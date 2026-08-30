"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";

/**
 * Meldestand-Workflow (Meldeschicht Welle 3, ADR-0007 Nr. 4/5):
 * DRAFT -> FROZEN -> SUBMITTED, nur vorwärts; payload/checksum haben keinerlei
 * Update-Pfade. Vier-Augen über Approval (Antragsteller != Genehmiger, in den
 * Actions erzwungen — Muster der übrigen Freigaben):
 *   ROI_EXPORT_OVERRIDE  erlaubt einen Paketexport trotz REJECT-Befunden;
 *                        wird beim Export verbraucht (Bindung an den Snapshot).
 *   ROI_SUBMISSION       Freigabe der Abgabe eines eingefrorenen Meldestands.
 * Alle Schreibpfade laufen über thirdparty:write und den Audit Trail.
 */

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

const idSchema = z.string().cuid();

export async function requestRoiExportOverride(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("thirdparty:write");
    const comment = String(formData.get("comment") ?? "").trim();
    if (comment.length < 10) {
      return { error: "Begründung erforderlich (mindestens 10 Zeichen)." };
    }
    const open = await db.approval.findFirst({
      where: { approvalType: "ROI_EXPORT_OVERRIDE", status: "PENDING" },
    });
    if (open) return { error: "Es liegt bereits ein offener Übersteuerungsantrag vor." };
    await db.approval.create({
      data: { approvalType: "ROI_EXPORT_OVERRIDE", requestedById: user.id, comment },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "ACCEPTANCE_REQUEST",
      entityType: "RoiSnapshot",
      entityId: "export-override",
      comment: `Übersteuerung des Exportstopps beantragt: ${comment}`,
    });
    revalidatePath("/register");
    return { ok: true };
  } catch {
    return { error: "Aktion fehlgeschlagen." };
  }
}

export async function decideRoiApproval(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("thirdparty:write");
    const approvalId = idSchema.parse(formData.get("approvalId"));
    const decision = formData.get("decision") === "APPROVED" ? "APPROVED" : "REJECTED";
    const approval = await db.approval.findUnique({ where: { id: approvalId } });
    if (!approval || approval.status !== "PENDING") {
      return { error: "Antrag nicht gefunden oder bereits entschieden." };
    }
    if (!approval.approvalType.startsWith("ROI_")) return { error: "Falscher Antragstyp." };
    if (approval.requestedById === user.id) {
      return { error: "Vier-Augen-Prinzip: Antragsteller und Genehmiger müssen verschieden sein." };
    }
    await db.approval.update({
      where: { id: approvalId },
      data: { status: decision, decidedById: user.id, decidedAt: new Date() },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: decision === "APPROVED" ? "APPROVE" : "REJECT",
      entityType: "Approval",
      entityId: approvalId,
      field: approval.approvalType,
      comment: approval.comment ?? undefined,
    });
    revalidatePath("/register");
    return { ok: true };
  } catch {
    return { error: "Aktion fehlgeschlagen." };
  }
}

export async function freezeRoiSnapshot(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("thirdparty:write");
    const snapshotId = idSchema.parse(formData.get("snapshotId"));
    const snapshot = await db.roiSnapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot) return { error: "Meldestand nicht gefunden." };
    if (snapshot.status !== "DRAFT") return { error: "Nur Entwürfe können eingefroren werden." };
    await db.roiSnapshot.update({ where: { id: snapshotId }, data: { status: "FROZEN" } });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "STATUS_CHANGE",
      entityType: "RoiSnapshot",
      entityId: snapshotId,
      field: "status",
      oldValue: "DRAFT",
      newValue: "FROZEN",
      comment: `Meldestand v${snapshot.version} (${snapshot.referenceDate.toISOString().slice(0, 10)}) eingefroren`,
    });
    revalidatePath("/register");
    return { ok: true };
  } catch {
    return { error: "Aktion fehlgeschlagen." };
  }
}

export async function requestRoiSubmission(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("thirdparty:write");
    const snapshotId = idSchema.parse(formData.get("snapshotId"));
    const snapshot = await db.roiSnapshot.findUnique({
      where: { id: snapshotId },
      include: { approvals: true },
    });
    if (!snapshot) return { error: "Meldestand nicht gefunden." };
    if (snapshot.status !== "FROZEN") {
      return { error: "Nur eingefrorene Meldestände können zur Abgabe beantragt werden." };
    }
    if (
      snapshot.approvals.some((a) => a.approvalType === "ROI_SUBMISSION" && a.status === "PENDING")
    ) {
      return { error: "Es liegt bereits ein offener Abgabeantrag vor." };
    }
    await db.approval.create({
      data: {
        approvalType: "ROI_SUBMISSION",
        requestedById: user.id,
        roiSnapshotId: snapshotId,
        comment: `Abgabe Meldestand v${snapshot.version} (${snapshot.referenceDate.toISOString().slice(0, 10)})`,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "ACCEPTANCE_REQUEST",
      entityType: "RoiSnapshot",
      entityId: snapshotId,
      comment: "Abgabefreigabe beantragt (Vier-Augen)",
    });
    revalidatePath("/register");
    return { ok: true };
  } catch {
    return { error: "Aktion fehlgeschlagen." };
  }
}

/**
 * Verknüpft eine offene Klausel-Lücke mit einer bestehenden Maßnahme
 * (Meldeschicht Welle 4, ADR-0008 Nr. 4/5). Leere Auswahl löst die
 * Verknüpfung.
 */
export async function linkClauseGapAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("thirdparty:write");
    const contractId = idSchema.parse(formData.get("contractId"));
    const clauseKey = z
      .string()
      .regex(/^ART30_[23]_[A-Z]$/)
      .parse(formData.get("clauseKey"));
    const actionIdRaw = String(formData.get("actionId") ?? "").trim();
    const actionId = actionIdRaw ? idSchema.parse(actionIdRaw) : null;

    const clause = await db.contractClause.findUnique({
      where: { contractId_clauseKey: { contractId, clauseKey } },
      include: { contract: { select: { contractRef: true, title: true } } },
    });
    if (!clause) return { error: "Klauselstatus nicht gefunden." };
    if (actionId) {
      const action = await db.action.findUnique({ where: { id: actionId } });
      if (!action) return { error: "Maßnahme nicht gefunden." };
    }
    await db.contractClause.update({
      where: { id: clause.id },
      data: { actionId },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "ContractClause",
      entityId: clause.id,
      field: "actionId",
      oldValue: clause.actionId,
      newValue: actionId,
      comment: `Klausel-Lücke ${clauseKey} (${clause.contract.contractRef ?? clause.contract.title}) ${actionId ? "mit Maßnahme verknüpft" : "von Maßnahme gelöst"}`,
    });
    revalidatePath("/register");
    return { ok: true };
  } catch {
    return { error: "Aktion fehlgeschlagen." };
  }
}

export async function markRoiSubmitted(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("thirdparty:write");
    const snapshotId = idSchema.parse(formData.get("snapshotId"));
    const submissionReference = String(formData.get("submissionReference") ?? "").trim();
    if (!submissionReference) return { error: "Abgabereferenz erforderlich." };
    const snapshot = await db.roiSnapshot.findUnique({
      where: { id: snapshotId },
      include: { approvals: true },
    });
    if (!snapshot) return { error: "Meldestand nicht gefunden." };
    if (snapshot.status !== "FROZEN") {
      return { error: "Nur eingefrorene Meldestände können als abgegeben markiert werden." };
    }
    const approved = snapshot.approvals.find(
      (a) => a.approvalType === "ROI_SUBMISSION" && a.status === "APPROVED",
    );
    if (!approved) {
      return { error: "Abgabe ohne genehmigten Vier-Augen-Antrag nicht möglich." };
    }
    await db.roiSnapshot.update({
      where: { id: snapshotId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        submittedById: user.id,
        submissionReference,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "STATUS_CHANGE",
      entityType: "RoiSnapshot",
      entityId: snapshotId,
      field: "status",
      oldValue: "FROZEN",
      newValue: "SUBMITTED",
      comment: `Abgabe dokumentiert, Referenz ${submissionReference}`,
    });
    revalidatePath("/register");
    return { ok: true };
  } catch {
    return { error: "Aktion fehlgeschlagen." };
  }
}
