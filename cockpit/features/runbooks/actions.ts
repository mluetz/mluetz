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
// Runbook-Ausführung starten
// ---------------------------------------------------------------

const startSchema = z.object({
  runbookId: z.string().min(1),
  contextNote: z.string().max(2000).optional(),
});

export async function startRunbookExecution(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let executionId = "";
  try {
    const user = await assertPermission("runbook:execute");
    const parsed = startSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Ungültige Eingaben für den Start der Ausführung." };
    const d = parsed.data;

    const runbook = await db.runbook.findUnique({ where: { id: d.runbookId } });
    if (!runbook) return { error: "Runbook nicht gefunden." };

    // StepResults werden bewusst NICHT vorab angelegt, sondern lazy per Upsert
    // beim ersten Bearbeiten eines Schritts erzeugt.
    const execution = await db.runbookExecution.create({
      data: {
        runbookId: runbook.id,
        startedById: user.id,
        status: "IN_PROGRESS",
        contextNote: d.contextNote?.trim() || null,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "EXECUTE",
      entityType: "Runbook",
      entityId: runbook.id,
      newValue: execution.id,
      comment: `Ausführung des Runbooks ${runbook.code} – ${runbook.title} gestartet`,
    });
    executionId = execution.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
  revalidatePath("/runbooks");
  redirect(`/runbooks/executions/${executionId}`);
}

// ---------------------------------------------------------------
// Schritt-Ergebnis speichern (lazy Upsert je [executionId, stepId])
// ---------------------------------------------------------------

const stepSchema = z.object({
  executionId: z.string().min(1),
  stepId: z.string().min(1),
  status: z.enum(["OPEN", "DONE", "SKIPPED", "BLOCKED"]),
  comment: z.string().max(2000).optional(),
});

export async function updateStepResult(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("runbook:execute");
    const parsed = stepSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Ungültige Eingaben für den Schritt." };
    const d = parsed.data;

    const execution = await db.runbookExecution.findUnique({ where: { id: d.executionId } });
    if (!execution) return { error: "Ausführung nicht gefunden." };
    if (execution.status !== "IN_PROGRESS") {
      return {
        error: "Die Ausführung ist bereits abgeschlossen und kann nicht mehr geändert werden.",
      };
    }
    const step = await db.runbookStep.findUnique({ where: { id: d.stepId } });
    if (!step || step.runbookId !== execution.runbookId) {
      return { error: "Der Schritt gehört nicht zu dieser Ausführung." };
    }

    const comment = d.comment?.trim() || null;
    const done = d.status === "DONE";
    await db.runbookStepResult.upsert({
      where: { executionId_stepId: { executionId: d.executionId, stepId: d.stepId } },
      create: {
        executionId: d.executionId,
        stepId: d.stepId,
        status: d.status,
        comment,
        completedById: done ? user.id : null,
        completedAt: done ? new Date() : null,
      },
      update: {
        status: d.status,
        comment,
        completedById: done ? user.id : null,
        completedAt: done ? new Date() : null,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "RunbookExecution",
      entityId: d.executionId,
      field: `Schritt ${step.sortOrder}: ${step.title}`,
      newValue: d.status,
      comment: comment ?? undefined,
    });
    revalidatePath(`/runbooks/executions/${d.executionId}`);
    revalidatePath("/runbooks");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Ausführung abschließen / abbrechen
// ---------------------------------------------------------------

const completeSchema = z.object({
  executionId: z.string().min(1),
  outcome: z.enum(["COMPLETED", "ABORTED"]),
  comment: z.string().max(2000).default(""),
});

export async function completeExecution(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("runbook:execute");
    const parsed = completeSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Ungültige Eingaben für den Abschluss." };
    const d = parsed.data;

    const execution = await db.runbookExecution.findUnique({
      where: { id: d.executionId },
      include: {
        stepResults: true,
        runbook: { include: { _count: { select: { steps: true } } } },
      },
    });
    if (!execution) return { error: "Ausführung nicht gefunden." };
    if (execution.status !== "IN_PROGRESS") {
      return { error: "Die Ausführung ist bereits abgeschlossen." };
    }
    if (d.outcome === "ABORTED" && d.comment.trim().length < 3) {
      return { error: "Ein Abbruch erfordert einen Kommentar (Begründung, mind. 3 Zeichen)." };
    }
    if (d.outcome === "COMPLETED") {
      const total = execution.runbook._count.steps;
      const doneOrSkipped = execution.stepResults.filter(
        (r) => r.status === "DONE" || r.status === "SKIPPED",
      ).length;
      const open = total - doneOrSkipped;
      if (open > 0) {
        return {
          error: `Abschluss nicht möglich: ${open} von ${total} Schritten sind noch nicht erledigt oder übersprungen.`,
        };
      }
    }

    await db.runbookExecution.update({
      where: { id: d.executionId },
      data: { status: d.outcome, completedAt: new Date() },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "STATUS_CHANGE",
      entityType: "RunbookExecution",
      entityId: d.executionId,
      field: "status",
      oldValue: "IN_PROGRESS",
      newValue: d.outcome,
      comment: d.comment.trim() || undefined,
    });
    revalidatePath(`/runbooks/executions/${d.executionId}`);
    revalidatePath("/runbooks");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
