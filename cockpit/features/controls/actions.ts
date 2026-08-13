"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";
import { EFFECTIVENESS_RATING } from "@/lib/domain/enums";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

const EFFECTIVENESS_KEYS = Object.keys(EFFECTIVENESS_RATING) as [string, ...string[]];

// ---------------------------------------------------------------
// Kontrolltest erfassen
// ---------------------------------------------------------------

const testSchema = z.object({
  controlId: z.string().min(1), // DB-ID
  testResult: z.enum(["PASSED", "PASSED_WITH_FINDINGS", "FAILED"]),
  designEffectiveness: z.enum(EFFECTIVENESS_KEYS),
  operatingEffectiveness: z.enum(EFFECTIVENESS_KEYS),
  findings: z.string().max(4000).optional(),
  evidenceNote: z.string().max(2000).optional(),
  nextTestDate: z.string().optional(),
});

export async function recordControlTest(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("control:test");
    const parsed = testSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: "Testergebnis sowie Design- und operative Wirksamkeit sind erforderlich." };
    }
    const d = parsed.data;

    const control = await db.control.findUnique({ where: { id: d.controlId } });
    if (!control) return { error: "Kontrolle nicht gefunden." };

    let nextTestDate: Date | null = null;
    if (d.nextTestDate) {
      nextTestDate = new Date(d.nextTestDate);
      if (Number.isNaN(nextTestDate.getTime())) return { error: "Ungültiges Datum für den nächsten Test." };
    }

    await db.$transaction([
      db.controlAssessment.create({
        data: {
          controlId: d.controlId,
          testedById: user.id,
          testResult: d.testResult,
          designEffectiveness: d.designEffectiveness,
          operatingEffectiveness: d.operatingEffectiveness,
          findings: d.findings?.trim() ? d.findings : null,
          evidenceNote: d.evidenceNote?.trim() ? d.evidenceNote : null,
        },
      }),
      db.control.update({
        where: { id: d.controlId },
        data: {
          designEffectiveness: d.designEffectiveness,
          operatingEffectiveness: d.operatingEffectiveness,
          ...(nextTestDate ? { nextTestDate } : {}),
        },
      }),
    ]);

    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "ASSESS",
      entityType: "Control",
      entityId: control.id,
      field: "effectiveness",
      oldValue: `Design=${control.designEffectiveness}, Operativ=${control.operatingEffectiveness}`,
      newValue: `Ergebnis=${d.testResult}, Design=${d.designEffectiveness}, Operativ=${d.operatingEffectiveness}`,
      comment: d.findings?.slice(0, 200) || undefined,
    });
    revalidatePath(`/controls/${control.id}`);
    revalidatePath("/controls");
    revalidatePath("/assessments");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Kontrolle bearbeiten
// ---------------------------------------------------------------

const updateSchema = z.object({
  controlId: z.string().min(1), // DB-ID
  name: z.string().min(3).max(200),
  objective: z.string().min(5).max(2000),
  description: z.string().min(5).max(4000),
  frequency: z.enum([
    "CONTINUOUS",
    "DAILY",
    "WEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "ANNUALLY",
    "EVENT_DRIVEN",
  ]),
  ownerId: z.string().optional(),
});

export async function updateControl(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("control:write");
    const parsed = updateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: "Eingaben unvollständig: " + parsed.error.issues.map((i) => i.path.join(".")).join(", ") };
    }
    const d = parsed.data;

    const control = await db.control.findUnique({ where: { id: d.controlId } });
    if (!control) return { error: "Kontrolle nicht gefunden." };

    await db.control.update({
      where: { id: d.controlId },
      data: {
        name: d.name,
        objective: d.objective,
        description: d.description,
        frequency: d.frequency,
        ownerId: d.ownerId || null,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "Control",
      entityId: control.id,
      comment: `Kontrolle ${control.controlId} aktualisiert (Name/Ziel/Beschreibung/Frequenz/Owner)`,
    });
    revalidatePath(`/controls/${control.id}`);
    revalidatePath("/controls");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
