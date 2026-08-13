"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

// ---------------------------------------------------------------
// Playbook aktivieren
// ---------------------------------------------------------------

const startSchema = z.object({
  playbookId: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  notes: z.string().max(4000).optional(),
  riskId: z.string().optional(),
  controlId: z.string().optional(),
  thirdPartyId: z.string().optional(),
});

export async function startPlaybookExecution(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let executionId = "";
  try {
    const user = await assertPermission("playbook:execute");
    const parsed = startSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Ungültige Eingaben – Severity ist Pflicht." };
    const d = parsed.data;

    const playbook = await db.playbook.findUnique({ where: { id: d.playbookId } });
    if (!playbook) return { error: "Playbook nicht gefunden." };

    const execution = await db.playbookExecution.create({
      data: {
        playbookId: playbook.id,
        startedById: user.id,
        status: "ACTIVE",
        severity: d.severity,
        notes: d.notes?.trim() || null,
        riskId: d.riskId || null,
        controlId: d.controlId || null,
        thirdPartyId: d.thirdPartyId || null,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "EXECUTE",
      entityType: "Playbook",
      entityId: playbook.id,
      newValue: execution.id,
      comment: `Playbook ${playbook.code} aktiviert (Severity ${d.severity})`,
    });
    executionId = execution.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
  revalidatePath("/playbooks");
  redirect(`/playbooks/executions/${executionId}`);
}

// ---------------------------------------------------------------
// Notizen / Severity einer aktiven Ausführung aktualisieren
// ---------------------------------------------------------------

const updateSchema = z.object({
  executionId: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  notes: z.string().max(8000).default(""),
});

export async function updatePlaybookExecution(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("playbook:execute");
    const parsed = updateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Ungültige Eingaben." };
    const d = parsed.data;

    const execution = await db.playbookExecution.findUnique({ where: { id: d.executionId } });
    if (!execution) return { error: "Ausführung nicht gefunden." };
    if (execution.status !== "ACTIVE") {
      return { error: "Die Ausführung ist geschlossen und kann nicht mehr geändert werden." };
    }

    await db.playbookExecution.update({
      where: { id: d.executionId },
      data: { notes: d.notes.trim() || null, severity: d.severity },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "PlaybookExecution",
      entityId: d.executionId,
      field: "notes/severity",
      oldValue: execution.severity,
      newValue: d.severity,
      comment: "Notizen bzw. Severity aktualisiert",
    });
    revalidatePath(`/playbooks/executions/${d.executionId}`);
    revalidatePath("/playbooks");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Ausführung schließen / abbrechen
// ---------------------------------------------------------------

const closeSchema = z.object({
  executionId: z.string().min(1),
  outcome: z.enum(["CLOSED", "ABORTED"]),
  comment: z.string().min(3).max(2000),
});

export async function closePlaybookExecution(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("playbook:execute");
    const parsed = closeSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: "Der Abschluss erfordert einen Kommentar (mind. 3 Zeichen)." };
    }
    const d = parsed.data;

    const execution = await db.playbookExecution.findUnique({ where: { id: d.executionId } });
    if (!execution) return { error: "Ausführung nicht gefunden." };
    if (execution.status !== "ACTIVE") {
      return { error: "Die Ausführung ist bereits geschlossen." };
    }

    const closingNote = `Abschluss: ${d.comment.trim()}`;
    const notes = execution.notes ? `${execution.notes}\n\n${closingNote}` : closingNote;
    await db.playbookExecution.update({
      where: { id: d.executionId },
      data: { status: d.outcome, closedAt: new Date(), notes },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "STATUS_CHANGE",
      entityType: "PlaybookExecution",
      entityId: d.executionId,
      field: "status",
      oldValue: "ACTIVE",
      newValue: d.outcome,
      comment: d.comment.trim(),
    });
    revalidatePath(`/playbooks/executions/${d.executionId}`);
    revalidatePath("/playbooks");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
