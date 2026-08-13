"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";
import { ACTION_STATUS, ACTION_TRANSITIONS, type ActionStatus } from "@/lib/domain/enums";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

function revalidateAction(actionDbId: string, riskDbId: string) {
  revalidatePath("/actions");
  revalidatePath(`/actions/${actionDbId}`);
  revalidatePath(`/risks/${riskDbId}`);
  revalidatePath("/overview");
}

// ---------------------------------------------------------------
// Fortschritt aktualisieren
// ---------------------------------------------------------------

const progressSchema = z.object({
  actionId: z.string().min(1), // DB-ID
  progress: z.coerce.number().int().min(0).max(100),
  evidenceNote: z.string().max(2000).optional(),
  comment: z.string().max(1000).optional(),
});

export async function updateActionProgress(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("action:write");
    const parsed = progressSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Fortschritt muss zwischen 0 und 100 % liegen." };
    const d = parsed.data;

    const action = await db.action.findUnique({ where: { id: d.actionId } });
    if (!action) return { error: "Maßnahme nicht gefunden." };

    await db.action.update({
      where: { id: d.actionId },
      data: {
        progress: d.progress,
        ...(d.evidenceNote && d.evidenceNote.trim() !== "" ? { evidenceNote: d.evidenceNote } : {}),
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "Action",
      entityId: action.id,
      field: "progress",
      oldValue: `${action.progress} %`,
      newValue: `${d.progress} %`,
      comment: d.comment || undefined,
    });
    revalidateAction(action.id, action.riskId);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Statuswechsel (Workflow)
// ---------------------------------------------------------------

const statusSchema = z.object({
  actionId: z.string().min(1), // DB-ID
  newStatus: z.string().min(1),
  comment: z.string().min(3).max(1000),
});

export async function changeActionStatus(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("action:write");
    const parsed = statusSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Statuswechsel benötigt einen Kommentar (mind. 3 Zeichen)." };
    const d = parsed.data;

    const action = await db.action.findUnique({ where: { id: d.actionId } });
    if (!action) return { error: "Maßnahme nicht gefunden." };
    const from = action.status as ActionStatus;
    const to = d.newStatus as ActionStatus;
    if (!(to in ACTION_STATUS)) return { error: "Ungültiger Zielstatus." };
    if (to === "CLOSED" && from !== "EFFECTIVENESS_REVIEW") {
      return { error: "Eine Maßnahme darf erst nach der Wirksamkeitsprüfung (Effectiveness Review) geschlossen werden." };
    }
    if (!ACTION_TRANSITIONS[from]?.includes(to)) {
      return { error: `Übergang ${ACTION_STATUS[from]} → ${ACTION_STATUS[to]} ist nicht zulässig.` };
    }

    await db.action.update({ where: { id: d.actionId }, data: { status: to } });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "STATUS_CHANGE",
      entityType: "Action",
      entityId: action.id,
      field: "status",
      oldValue: from,
      newValue: to,
      comment: d.comment,
    });
    revalidateAction(action.id, action.riskId);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Eskalation
// ---------------------------------------------------------------

const escalateSchema = z.object({
  actionId: z.string().min(1), // DB-ID
  escalationLevel: z.coerce.number().int().min(1).max(3),
  justification: z.string().min(5).max(2000),
});

export async function escalateAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("action:escalate");
    const parsed = escalateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: "Eskalationsstufe (1–3) und Begründung (mind. 5 Zeichen) sind erforderlich." };
    }
    const d = parsed.data;

    const action = await db.action.findUnique({ where: { id: d.actionId } });
    if (!action) return { error: "Maßnahme nicht gefunden." };

    await db.action.update({
      where: { id: d.actionId },
      data: { escalationLevel: d.escalationLevel },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "Action",
      entityId: action.id,
      field: "escalationLevel",
      oldValue: String(action.escalationLevel),
      newValue: String(d.escalationLevel),
      comment: d.justification,
    });
    revalidateAction(action.id, action.riskId);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Maßnahme anlegen
// ---------------------------------------------------------------

const createSchema = z.object({
  riskId: z.string().min(1), // DB-ID des Risikos
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(4000),
  ownerId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

function parseDateInput(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  let actionDbId = "";
  try {
    const user = await assertPermission("action:write");
    const parsed = createSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: "Eingaben unvollständig: " + parsed.error.issues.map((i) => i.path.join(".")).join(", ") };
    }
    const d = parsed.data;

    const risk = await db.risk.findUnique({ where: { id: d.riskId } });
    if (!risk) return { error: "Risiko nicht gefunden." };

    const count = await db.action.count();
    const actionId = `ACT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const action = await db.action.create({
      data: {
        actionId,
        riskId: d.riskId,
        title: d.title,
        description: d.description,
        ownerId: d.ownerId || null,
        priority: d.priority,
        startDate: parseDateInput(d.startDate),
        dueDate: parseDateInput(d.dueDate),
        status: "PLANNED",
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "Action",
      entityId: action.id,
      comment: `Maßnahme ${actionId} zu Risiko ${risk.riskId} angelegt`,
    });
    actionDbId = action.id;
    revalidateAction(action.id, action.riskId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
  redirect(`/actions/${actionDbId}`);
}
