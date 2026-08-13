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
// Nachweis anlegen (Metadaten + Link, kein Upload)
// ---------------------------------------------------------------

const createSchema = z.object({
  title: z.string().min(3).max(200),
  docType: z.enum(["POLICY", "REPORT", "CERTIFICATE", "TEST_RESULT", "CONTRACT", "SCREENSHOT", "OTHER"]),
  link: z.string().url({ message: "Link muss eine gültige URL sein." }),
  classification: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "STRICTLY_CONFIDENTIAL"]),
  validUntil: z.string().optional(),
  riskId: z.string().optional(),
  controlId: z.string().optional(),
  thirdPartyId: z.string().optional(),
  version: z.string().max(20).optional(),
  contentHash: z.string().max(200).optional(),
});

export async function createEvidence(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  let evidenceDbId = "";
  try {
    const user = await assertPermission("evidence:write");
    const parsed = createSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: "Eingaben unvollständig: " + parsed.error.issues.map((i) => i.path.join(".") || i.message).join(", ") };
    }
    const d = parsed.data;

    let validUntil: Date | null = null;
    if (d.validUntil) {
      validUntil = new Date(d.validUntil);
      if (Number.isNaN(validUntil.getTime())) return { error: "Ungültiges Gültig-bis-Datum." };
    }

    const count = await db.evidence.count();
    const evidenceId = `EV-${String(count + 1).padStart(3, "0")}`;
    const evidence = await db.evidence.create({
      data: {
        evidenceId,
        title: d.title,
        docType: d.docType,
        link: d.link,
        classification: d.classification,
        validUntil,
        riskId: d.riskId || null,
        controlId: d.controlId || null,
        thirdPartyId: d.thirdPartyId || null,
        version: d.version?.trim() ? d.version.trim() : "1.0",
        contentHash: d.contentHash?.trim() ? d.contentHash.trim() : null,
        ownerId: user.id,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "Evidence",
      entityId: evidence.id,
      comment: `Nachweis ${evidenceId} (${d.title}) angelegt`,
    });
    evidenceDbId = evidence.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
  revalidatePath("/evidence");
  redirect(`/evidence/${evidenceDbId}`);
}

// ---------------------------------------------------------------
// Nachweis reviewen
// ---------------------------------------------------------------

const reviewSchema = z.object({
  evidenceId: z.string().min(1), // DB-ID
  reviewStatus: z.enum(["REVIEWED", "EXPIRED", "REJECTED"]),
  comment: z.string().max(1000).optional(),
});

export async function reviewEvidence(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("evidence:write");
    const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Review unvollständig oder ungültig." };
    const d = parsed.data;

    const evidence = await db.evidence.findUnique({ where: { id: d.evidenceId } });
    if (!evidence) return { error: "Nachweis nicht gefunden." };

    await db.evidence.update({
      where: { id: d.evidenceId },
      data: { reviewStatus: d.reviewStatus, reviewerId: user.id },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "Evidence",
      entityId: d.evidenceId,
      field: "reviewStatus",
      oldValue: evidence.reviewStatus,
      newValue: d.reviewStatus,
      comment: d.comment || undefined,
    });
    revalidatePath(`/evidence/${d.evidenceId}`);
    revalidatePath("/evidence");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
