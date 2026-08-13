"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";
import { COMPLIANCE_STATUS } from "@/lib/domain/enums";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

const mappingSchema = z.object({
  mappingId: z.string().optional(),
  requirementId: z.string().optional(),
  status: z.string().refine((s) => s in COMPLIANCE_STATUS, { message: "Ungültiger Status." }),
  justification: z.string().min(10, "Begründung erforderlich (mind. 10 Zeichen).").max(4000),
  evidenceId: z.string().optional(),
  nextReviewDate: z.string().optional(),
});

/**
 * Legt ein Compliance-Mapping an oder aktualisiert es (Berechtigung "compliance:write").
 * Jede Statusänderung wird als COMPLIANCE_CHANGE mit altem/neuem Wert auditiert.
 */
export async function upsertComplianceMapping(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("compliance:write");
    const parsed = mappingSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues.map((i) => i.message).join(" ") };
    }
    const d = parsed.data;

    let nextReviewDate: Date | null = null;
    if (d.nextReviewDate) {
      nextReviewDate = new Date(d.nextReviewDate);
      if (Number.isNaN(nextReviewDate.getTime())) {
        return { error: "Ungültiges Datum für das nächste Review." };
      }
    }
    const evidenceId = d.evidenceId || null;
    if (evidenceId) {
      const ev = await db.evidence.findUnique({ where: { id: evidenceId } });
      if (!ev) return { error: "Ausgewählter Nachweis nicht gefunden." };
    }

    let requirementId: string;
    let oldStatus: string | null = null;

    if (d.mappingId) {
      const existing = await db.complianceMapping.findUnique({ where: { id: d.mappingId } });
      if (!existing) return { error: "Compliance-Mapping nicht gefunden." };
      oldStatus = existing.status;
      requirementId = existing.requirementId;
      await db.complianceMapping.update({
        where: { id: d.mappingId },
        data: {
          status: d.status,
          justification: d.justification,
          ownerId: user.id,
          assessedAt: new Date(),
          evidenceId,
          nextReviewDate,
        },
      });
    } else {
      if (!d.requirementId) return { error: "Anforderung fehlt." };
      const requirement = await db.regulatoryRequirement.findUnique({
        where: { id: d.requirementId },
      });
      if (!requirement) return { error: "Regulatorische Anforderung nicht gefunden." };
      requirementId = requirement.id;
      await db.complianceMapping.create({
        data: {
          requirementId,
          status: d.status,
          justification: d.justification,
          ownerId: user.id,
          evidenceId,
          nextReviewDate,
        },
      });
    }

    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "COMPLIANCE_CHANGE",
      entityType: "ComplianceMapping",
      entityId: requirementId,
      field: "status",
      oldValue: oldStatus,
      newValue: d.status,
      comment: d.justification.slice(0, 200),
    });
    revalidatePath("/governance");
    revalidatePath(`/governance/${requirementId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
