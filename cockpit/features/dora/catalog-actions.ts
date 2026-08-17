"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";
import { EVIDENCE_MATURITY_CAP } from "@/lib/domain/dora-scoring";
import { isOverdue } from "@/lib/utils";

/**
 * Server Actions für den DORA-Anforderungskatalog (FRWK-DORA-001).
 * Bewertungen sind versioniert (isCurrent-Semantik wie RiskAssessment);
 * die Nachweissperre (Kap. 11.1) deckelt nur den WIRKSAMEN Reifegrad –
 * der Rohwert wird immer gespeichert, die UI erhält eine Warnung.
 */

export interface ActionResult {
  error?: string;
  ok?: boolean;
  /** Hinweis (kein Fehler), z. B. aktive Nachweissperre trotz gespeicherter Bewertung. */
  warning?: string;
}

const assessSchema = z.object({
  requirementId: z.string().min(1), // DB-ID
  maturity: z.coerce.number().int().min(0).max(5),
  justification: z.string().min(10).max(4000),
});

export async function assessRequirement(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("dora:assess");
    const parsed = assessSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        error:
          "Bewertung unvollständig: Reifegrad (0–5) und Begründung (mind. 10 Zeichen) sind erforderlich.",
      };
    }
    const d = parsed.data;

    const requirement = await db.doraRequirement.findUnique({
      where: { id: d.requirementId },
      include: {
        assessments: { where: { isCurrent: true }, take: 1 },
        evidence: { select: { validUntil: true, reviewStatus: true } },
      },
    });
    if (!requirement) return { error: "Anforderung nicht gefunden." };
    const oldMaturity = requirement.assessments[0]?.maturity ?? null;

    await db.$transaction([
      db.doraAssessment.updateMany({
        where: { requirementId: d.requirementId, isCurrent: true },
        data: { isCurrent: false },
      }),
      db.doraAssessment.create({
        data: {
          requirementId: d.requirementId,
          maturity: d.maturity,
          justification: d.justification,
          assessorId: user.id,
          isCurrent: true,
        },
      }),
    ]);

    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "ASSESS",
      entityType: "DoraRequirement",
      entityId: d.requirementId,
      field: "maturity",
      oldValue: oldMaturity !== null ? String(oldMaturity) : null,
      newValue: String(d.maturity),
      comment: d.justification.slice(0, 200),
    });

    revalidatePath("/dora");
    revalidatePath("/dora/requirements");
    revalidatePath(`/dora/requirements/${d.requirementId}`);

    // Nachweissperre (Kap. 11.1): Rohwert wurde gespeichert, aber ohne
    // gültigen, geprüften Nachweis wirkt höchstens Reifegrad 2.
    const hasValidEvidence = requirement.evidence.some(
      (e) => e.reviewStatus === "REVIEWED" && (!e.validUntil || !isOverdue(e.validUntil)),
    );
    if (d.maturity > EVIDENCE_MATURITY_CAP && !hasValidEvidence) {
      return {
        ok: true,
        warning:
          "Nachweissperre aktiv: Ohne gültigen, geprüften Nachweis wirkt höchstens Reifegrad 2.",
      };
    }
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
