"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";
import { FINDING_SEVERITY_RULES } from "@/lib/domain/dora-scoring";
import {
  DORA_FINDING_SOURCE,
  DORA_FINDING_STATUS,
} from "@/lib/domain/enums";

/**
 * Server Actions für DORA-Findings/CAPA (FRWK-DORA-001 Kap. 12).
 * Fristen und Eskalationsstufen leiten sich deterministisch aus der
 * Schweregrad-Systematik (Tabelle 24) ab; der Abschluss erfordert eine
 * dokumentierte Wirksamkeitsprüfung (Kap. 12.1).
 */

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

const FINDING_SOURCES = Object.keys(DORA_FINDING_SOURCE) as [string, ...string[]];
const FINDING_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

type FindingStatus = keyof typeof DORA_FINDING_STATUS;

/** Erlaubte Statusübergänge: strikt OPEN → IN_PROGRESS → EFFECTIVENESS_CHECK → CLOSED. */
const FINDING_TRANSITIONS: Record<FindingStatus, FindingStatus[]> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["EFFECTIVENESS_CHECK"],
  EFFECTIVENESS_CHECK: ["CLOSED"],
  CLOSED: [],
};

// ---------------------------------------------------------------
// Finding anlegen
// ---------------------------------------------------------------

const createSchema = z.object({
  requirementId: z.string().optional(),
  source: z.enum(FINDING_SOURCES),
  severity: z.enum(FINDING_SEVERITIES),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(4000),
  effectivenessCriterion: z.string().max(2000).optional(),
  actionId: z.string().optional(),
});

export async function createFinding(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  let findingDbId = "";
  try {
    const user = await assertPermission("compliance:write");
    const parsed = createSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        error:
          "Eingaben unvollständig: " +
          parsed.error.issues.map((i) => i.path.join(".")).join(", "),
      };
    }
    const d = parsed.data;

    if (d.requirementId) {
      const req = await db.doraRequirement.findUnique({ where: { id: d.requirementId } });
      if (!req) return { error: "Verknüpfte Anforderung nicht gefunden." };
    }
    if (d.actionId) {
      const action = await db.action.findUnique({ where: { id: d.actionId } });
      if (!action) return { error: "Verknüpfte Maßnahme (CAPA) nicht gefunden." };
    }

    const rule = FINDING_SEVERITY_RULES[d.severity];
    if (!rule) return { error: "Ungültiger Schweregrad." };

    const year = new Date().getFullYear();
    const count = await db.doraFinding.count({
      where: { findingId: { startsWith: `FND-${year}-` } },
    });
    const findingId = `FND-${year}-${String(count + 1).padStart(4, "0")}`;

    const detectedAt = new Date();
    const responseDueAt = new Date(detectedAt.getTime() + rule.responseDays * 86_400_000);
    const remediationDueAt = new Date(detectedAt.getTime() + rule.remediationDays * 86_400_000);

    const finding = await db.doraFinding.create({
      data: {
        findingId,
        requirementId: d.requirementId || null,
        source: d.source,
        severity: d.severity,
        title: d.title,
        description: d.description,
        detectedAt,
        responseDueAt,
        remediationDueAt,
        status: "OPEN",
        effectivenessCriterion: d.effectivenessCriterion?.trim() || null,
        escalatedTo: rule.escalateTo,
        actionId: d.actionId || null,
        createdById: user.id,
      },
    });

    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "DoraFinding",
      entityId: finding.id,
      newValue: `${findingId} (${rule.label})`,
      comment: `Finding ${findingId} angelegt – Reaktion bis ${responseDueAt.toISOString().slice(0, 10)}, Behebung bis ${remediationDueAt.toISOString().slice(0, 10)}, Eskalation: ${rule.escalateTo}`,
    });
    findingDbId = finding.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
  revalidatePath("/dora");
  revalidatePath("/dora/findings");
  redirect(`/dora/findings/${findingDbId}`);
}

// ---------------------------------------------------------------
// Statuswechsel (Workflow)
// ---------------------------------------------------------------

const statusSchema = z.object({
  findingId: z.string().min(1), // DB-ID
  newStatus: z.string().min(1),
  comment: z.string().min(3).max(1000),
  effectivenessCriterion: z.string().max(2000).optional(),
});

export async function changeFindingStatus(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("compliance:write");
    const parsed = statusSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: "Statuswechsel benötigt einen Kommentar (mind. 3 Zeichen)." };
    }
    const d = parsed.data;

    const finding = await db.doraFinding.findUnique({ where: { id: d.findingId } });
    if (!finding) return { error: "Finding nicht gefunden." };
    const from = finding.status as FindingStatus;
    const to = d.newStatus as FindingStatus;
    if (!(to in DORA_FINDING_STATUS)) return { error: "Ungültiger Zielstatus." };
    if (!FINDING_TRANSITIONS[from]?.includes(to)) {
      return {
        error: `Übergang ${DORA_FINDING_STATUS[from]} → ${DORA_FINDING_STATUS[to]} ist nicht zulässig.`,
      };
    }

    // Wirksamkeitskriterium kann beim Statuswechsel nachgetragen werden.
    const criterion = d.effectivenessCriterion?.trim() || finding.effectivenessCriterion;
    if (to === "CLOSED" && !criterion) {
      return { error: "Wirksamkeitskriterium erforderlich (FRWK-DORA-001 Kap. 12.1)" };
    }

    await db.doraFinding.update({
      where: { id: d.findingId },
      data: {
        status: to,
        effectivenessCriterion: criterion,
        closedAt: to === "CLOSED" ? new Date() : finding.closedAt,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "STATUS_CHANGE",
      entityType: "DoraFinding",
      entityId: finding.id,
      field: "status",
      oldValue: from,
      newValue: to,
      comment: d.comment,
    });
    revalidatePath("/dora");
    revalidatePath("/dora/findings");
    revalidatePath(`/dora/findings/${finding.id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
