"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";
import {
  QUALITY_CRITERIA,
  RISK_STATUS,
  RISK_TRANSITIONS,
  type RiskStatus,
} from "@/lib/domain/enums";
import { inherentRisk, residualRisk } from "@/lib/domain/risk-calc";
import { getMitigationCap } from "@/lib/settings";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

// ---------------------------------------------------------------
// Risiko anlegen / ändern
// ---------------------------------------------------------------

const riskSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(4000),
  cause: z.string().min(5).max(2000),
  riskEvent: z.string().min(5).max(2000),
  impactDescription: z.string().min(5).max(2000),
  threat: z.string().min(2).max(500),
  vulnerability: z.string().min(2).max(500),
  existingControls: z.string().max(2000).default(""),
  categoryId: z.string().min(1),
  riskOwnerId: z.string().optional(),
  ouId: z.string().optional(),
  locationId: z.string().optional(),
});

export async function createRisk(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  let riskDbId = "";
  try {
    const user = await assertPermission("risk:write");
    const parsed = riskSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: "Eingaben unvollständig: " + parsed.error.issues.map((i) => i.path.join(".")).join(", ") };
    }
    const d = parsed.data;
    const count = await db.risk.count();
    const riskId = `RISK-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const risk = await db.risk.create({
      data: {
        riskId,
        title: d.title,
        description: d.description,
        cause: d.cause,
        riskEvent: d.riskEvent,
        impactDescription: d.impactDescription,
        threat: d.threat,
        vulnerability: d.vulnerability,
        existingControls: d.existingControls,
        categoryId: d.categoryId,
        riskOwnerId: d.riskOwnerId || null,
        ouId: d.ouId || null,
        locationId: d.locationId || null,
        createdById: user.id,
        status: "DRAFT",
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "Risk",
      entityId: risk.id,
      comment: `Risiko ${riskId} angelegt`,
    });
    riskDbId = risk.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
  revalidatePath("/risks");
  redirect(`/risks/${riskDbId}`);
}

// ---------------------------------------------------------------
// Risikobewertung
// ---------------------------------------------------------------

const assessSchema = z.object({
  riskId: z.string().min(1),
  likelihood: z.coerce.number().int().min(1).max(5),
  impact: z.coerce.number().int().min(1).max(5),
  controlEffectiveness: z.coerce.number().refine((v) => [0, 25, 50, 75, 100].includes(v), {
    message: "Kontrollwirksamkeit muss 0/25/50/75/100 sein",
  }),
  justification: z.string().min(10).max(4000),
});

const DIMENSIONS = [
  "CONFIDENTIALITY",
  "INTEGRITY",
  "AVAILABILITY",
  "AUTHENTICITY",
  "FINANCIAL",
  "REGULATORY",
  "CUSTOMER",
  "REPUTATION",
  "BUSINESS_INTERRUPTION",
  "DATA_PROTECTION",
  "CRITICAL_FUNCTION",
] as const;

export async function assessRisk(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("risk:assess");
    const parsed = assessSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Bewertung unvollständig oder ungültig." };
    const d = parsed.data;

    // Dimension-Scores (optional, 1–5); Impact = Maximum der bewerteten Dimensionen, falls vorhanden
    const dimScores: Array<{ dimension: string; score: number }> = [];
    for (const dim of DIMENSIONS) {
      const raw = formData.get(`dim_${dim}`);
      if (raw && String(raw) !== "") {
        const score = Number(raw);
        if (Number.isInteger(score) && score >= 1 && score <= 5) {
          dimScores.push({ dimension: dim, score });
        }
      }
    }
    const impact = dimScores.length ? Math.max(...dimScores.map((s) => s.score)) : d.impact;

    const risk = await db.risk.findUnique({ where: { id: d.riskId } });
    if (!risk) return { error: "Risiko nicht gefunden." };

    const cap = await getMitigationCap();
    const inh = inherentRisk(d.likelihood, impact);
    const res = residualRisk(inh, d.controlEffectiveness, cap);

    await db.$transaction([
      db.riskAssessment.updateMany({
        where: { riskId: d.riskId, isCurrent: true },
        data: { isCurrent: false },
      }),
      db.riskAssessment.create({
        data: {
          riskId: d.riskId,
          assessorId: user.id,
          likelihood: d.likelihood,
          impact,
          controlEffectiveness: d.controlEffectiveness,
          inherentScore: inh,
          residualScore: res,
          justification: d.justification,
          isCurrent: true,
          dimensionScores: { create: dimScores },
        },
      }),
      db.risk.update({ where: { id: d.riskId }, data: { version: { increment: 1 } } }),
    ]);

    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "ASSESS",
      entityType: "Risk",
      entityId: d.riskId,
      field: "assessment",
      newValue: `L=${d.likelihood}, I=${impact}, E=${d.controlEffectiveness}%, inherent=${inh}, residual=${res}`,
      comment: d.justification.slice(0, 200),
    });
    revalidatePath(`/risks/${d.riskId}`);
    revalidatePath("/risks");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Statuswechsel (Workflow)
// ---------------------------------------------------------------

const statusSchema = z.object({
  riskId: z.string().min(1),
  newStatus: z.string().min(1),
  comment: z.string().min(3).max(1000),
});

export async function changeRiskStatus(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("risk:write");
    const parsed = statusSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Statuswechsel benötigt einen Kommentar (mind. 3 Zeichen)." };
    const d = parsed.data;

    const risk = await db.risk.findUnique({ where: { id: d.riskId } });
    if (!risk) return { error: "Risiko nicht gefunden." };
    const from = risk.status as RiskStatus;
    const to = d.newStatus as RiskStatus;
    if (!(to in RISK_STATUS)) return { error: "Ungültiger Zielstatus." };
    if (!RISK_TRANSITIONS[from]?.includes(to)) {
      return { error: `Übergang ${RISK_STATUS[from]} → ${RISK_STATUS[to]} ist nicht zulässig.` };
    }
    // Funktionstrennung: Freigaben (Approval/Second-Line) erfordern eigene Berechtigungen
    if ((from === "APPROVAL_PENDING" || from === "SECOND_LINE_REVIEW") && to !== "IN_ASSESSMENT") {
      await assertPermission("risk:approve");
    }
    if (from === "QUALITY_REVIEW") {
      await assertPermission("risk:review");
    }

    await db.risk.update({
      where: { id: d.riskId },
      data: {
        status: to,
        approvalStatus: to === "OPEN" ? "APPROVED" : risk.approvalStatus,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "STATUS_CHANGE",
      entityType: "Risk",
      entityId: d.riskId,
      field: "status",
      oldValue: from,
      newValue: to,
      comment: d.comment,
    });
    revalidatePath(`/risks/${d.riskId}`);
    revalidatePath("/risks");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Quality Review
// ---------------------------------------------------------------

export async function startQualityReview(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("risk:review");
    const riskId = String(formData.get("riskId") ?? "");
    const risk = await db.risk.findUnique({ where: { id: riskId } });
    if (!risk) return { error: "Risiko nicht gefunden." };
    if (risk.createdById === user.id) {
      return { error: "Funktionstrennung: Der Ersteller darf das eigene Risiko nicht reviewen." };
    }
    await db.qualityReview.create({
      data: {
        riskId,
        reviewerId: user.id,
        reviewerName: user.name,
        checklistItems: {
          create: QUALITY_CRITERIA.map((criterion, i) => ({ criterion, sortOrder: i })),
        },
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "QualityReview",
      entityId: riskId,
      comment: "Quality Review gestartet",
    });
    revalidatePath(`/risks/${riskId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

const completeReviewSchema = z.object({
  reviewId: z.string().min(1),
  outcome: z.enum(["APPROVED", "RETURNED", "REJECTED"]),
  comments: z.string().max(2000).default(""),
  rejectionReason: z.string().max(2000).default(""),
});

export async function completeQualityReview(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("risk:review");
    const parsed = completeReviewSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Review-Abschluss unvollständig." };
    const d = parsed.data;

    const review = await db.qualityReview.findUnique({
      where: { id: d.reviewId },
      include: { checklistItems: true },
    });
    if (!review) return { error: "Review nicht gefunden." };
    if (review.completedAt) return { error: "Review ist bereits abgeschlossen." };
    if ((d.outcome === "RETURNED" || d.outcome === "REJECTED") && d.rejectionReason.trim().length < 5) {
      return { error: "Rückgabe/Ablehnung erfordert eine dokumentierte Begründung." };
    }

    // Checklisten-Ergebnisse aus dem Formular übernehmen
    const updates = review.checklistItems.map((item) => {
      const v = formData.get(`item_${item.id}`);
      const fulfilled = v === "yes" ? true : v === "no" ? false : null;
      const comment = String(formData.get(`comment_${item.id}`) ?? "") || null;
      return db.qualityChecklistItem.update({
        where: { id: item.id },
        data: { fulfilled, comment },
      });
    });
    await db.$transaction(updates);

    const items = await db.qualityChecklistItem.findMany({ where: { reviewId: d.reviewId } });
    const answered = items.filter((i) => i.fulfilled !== null);
    const score = answered.length
      ? Math.round((items.filter((i) => i.fulfilled === true).length / items.length) * 100)
      : 0;

    await db.qualityReview.update({
      where: { id: d.reviewId },
      data: {
        outcome: d.outcome,
        completedAt: new Date(),
        qualityScore: score,
        comments: d.comments || null,
        rejectionReason: d.rejectionReason || null,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: d.outcome === "APPROVED" ? "APPROVE" : d.outcome === "RETURNED" ? "RETURN" : "REJECT",
      entityType: "QualityReview",
      entityId: review.riskId,
      field: "outcome",
      newValue: `${d.outcome} (Score ${score} %)`,
      comment: d.rejectionReason || d.comments || undefined,
    });
    revalidatePath(`/risks/${review.riskId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Risikoakzeptanz
// ---------------------------------------------------------------

const acceptanceSchema = z.object({
  riskId: z.string().min(1),
  justification: z.string().min(10).max(4000),
  compensatingControls: z.string().min(5).max(4000),
});

export async function requestAcceptance(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("acceptance:request");
    const parsed = acceptanceSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: "Begründung und kompensierende Kontrollen sind erforderlich." };
    }
    const d = parsed.data;
    await db.riskAcceptance.create({
      data: {
        riskId: d.riskId,
        requestedById: user.id,
        justification: d.justification,
        compensatingControls: d.compensatingControls,
        status: "REQUESTED",
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "ACCEPTANCE_REQUEST",
      entityType: "RiskAcceptance",
      entityId: d.riskId,
      comment: d.justification.slice(0, 200),
    });
    revalidatePath(`/risks/${d.riskId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

const acceptanceDecisionSchema = z.object({
  acceptanceId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().min(3).max(2000),
  validUntil: z.string().optional(),
});

export async function decideAcceptance(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("acceptance:approve");
    const parsed = acceptanceDecisionSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Entscheidung benötigt einen Kommentar." };
    const d = parsed.data;
    const acc = await db.riskAcceptance.findUnique({ where: { id: d.acceptanceId } });
    if (!acc) return { error: "Akzeptanzantrag nicht gefunden." };
    if (acc.status !== "REQUESTED" && acc.status !== "IN_REVIEW") {
      return { error: "Antrag ist bereits entschieden." };
    }
    if (acc.requestedById === user.id) {
      return { error: "Funktionstrennung: Antragsteller darf nicht selbst genehmigen." };
    }
    let validUntil: Date | null = null;
    if (d.decision === "APPROVED") {
      if (!d.validUntil) return { error: "Eine Genehmigung muss befristet sein (Gültig-bis-Datum)." };
      validUntil = new Date(d.validUntil);
      if (Number.isNaN(validUntil.getTime()) || validUntil <= new Date()) {
        return { error: "Gültig-bis-Datum muss in der Zukunft liegen." };
      }
    }
    const review = validUntil ? new Date(validUntil.getTime() - 30 * 86400000) : null;
    await db.riskAcceptance.update({
      where: { id: d.acceptanceId },
      data: {
        status: d.decision,
        approvedById: user.id,
        approvedAt: new Date(),
        validUntil,
        nextReviewDate: review,
      },
    });
    if (d.decision === "APPROVED") {
      await db.risk.update({
        where: { id: acc.riskId },
        data: { treatmentStrategy: "ACCEPT" },
      });
    }
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "ACCEPTANCE_DECISION",
      entityType: "RiskAcceptance",
      entityId: acc.riskId,
      newValue: d.decision,
      comment: d.comment,
    });
    revalidatePath(`/risks/${acc.riskId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Kommentare
// ---------------------------------------------------------------

export async function addRiskComment(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("risk:read");
    const riskId = String(formData.get("riskId") ?? "");
    const body = String(formData.get("body") ?? "").trim();
    if (!riskId || body.length < 2) return { error: "Kommentar darf nicht leer sein." };
    if (body.length > 2000) return { error: "Kommentar zu lang (max. 2000 Zeichen)." };
    await db.comment.create({ data: { riskId, authorId: user.id, body } });
    revalidatePath(`/risks/${riskId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
