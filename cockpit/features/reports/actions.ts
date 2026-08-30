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

// ---------------------------------------------------------------
// Monatsabschluss-Snapshot (Review v3, P1-06 / RB-17): friert
// Kennzahlen, Risikoliste und Register-Prüfsumme zum Stichtag ein.
// Trends und Berichte speisen sich aus Snapshots statt aus
// Live-Neuberechnung; der Registerstand ist reproduzierbar.
// ---------------------------------------------------------------

export async function createPeriodSnapshot(
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("report:create");
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM
    const existing = await db.periodSnapshot.findUnique({ where: { period } });
    if (existing) return { error: `Snapshot für ${period} existiert bereits (unveränderlich).` };

    const { getDoraOverview } = await import("@/features/dora/queries");
    const { collectRegisterRecords } = await import("@/lib/register/data");
    const { createHash } = await import("node:crypto");

    const [overview, registerRecords, risks] = await Promise.all([
      getDoraOverview(),
      collectRegisterRecords(),
      db.risk.findMany({
        where: { status: { notIn: ["CLOSED", "REJECTED"] } },
        include: { assessments: { where: { isCurrent: true }, take: 1 } },
      }),
    ]);

    const riskList = risks.map((r) => ({
      riskId: r.riskId,
      title: r.title,
      status: r.status,
      inherent: r.assessments[0]?.inherentScore ?? null,
      residual: r.assessments[0]?.residualScore ?? null,
    }));
    const registerChecksum = createHash("sha256")
      .update(JSON.stringify(registerRecords), "utf8")
      .digest("hex");

    const snap = await db.periodSnapshot.create({
      data: {
        period,
        createdById: user.id,
        doraIndexPercent: overview.index.indexPercent,
        openKnockouts: overview.index.totalOpenKnockouts,
        kpis: JSON.stringify(overview.kpis),
        riskList: JSON.stringify(riskList),
        registerRecordCount: registerRecords.length,
        registerChecksum,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "PeriodSnapshot",
      entityId: snap.id,
      comment: `Monatsabschluss ${period}: Index ${overview.index.indexPercent} %, ${riskList.length} Risiken, Register-SHA-256 ${registerChecksum.slice(0, 12)}…`,
    });
    revalidatePath("/reports");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
