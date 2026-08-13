"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";
import { REPORT_KEYS } from "./report-defs";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

const createReportSchema = z.object({
  reportType: z.enum(REPORT_KEYS),
  title: z.string().min(3).max(200),
});

/** Speichert den aktuell gerenderten Bericht als Report-Datensatz (Snapshot-Metadaten). */
export async function createReport(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("report:create");
    const parsed = createReportSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Ungültiger Berichtstyp oder Titel." };
    const d = parsed.data;

    const report = await db.report.create({
      data: {
        reportType: d.reportType,
        title: d.title,
        createdById: user.id,
        effectiveDate: new Date(),
        filters: "{}",
        format: "HTML",
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "Report",
      entityId: report.id,
      comment: `Report ${d.reportType} („${d.title}") erzeugt`,
    });
    revalidatePath("/reports");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
