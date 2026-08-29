import "server-only";
import { db } from "@/lib/db";
import { getRiskRows, type RiskFilters, type RiskRow } from "@/features/risks/queries";
import { isOverdue } from "@/lib/utils";

export interface DashboardData {
  rows: RiskRow[];
  kpi: {
    openRisks: number;
    highCritical: number;
    aboveAppetite: number;
    overdueReviews: number;
    openActions: number;
    overdueActions: number;
    openAcceptances: number;
    weakControls: number;
    criticalThirdParties: number;
    expiringContracts: number;
    risksWithoutOwner: number;
    risksWithoutAssessment: number;
  };
  heatmap: number[][]; // [likelihood-1][impact-1] = Anzahl (aktuelle Bewertungen)
  byCategory: Array<{ name: string; count: number; aboveAppetite: number }>;
  byOu: Array<{ name: string; count: number }>;
  byThirdParty: Array<{ name: string; count: number }>;
  actionStatus: Array<{ status: string; count: number }>;
  trend: Array<{ month: string; avgResidual: number; count: number }>;
  top10: RiskRow[];
}

const OPEN_STATUSES = [
  "OPEN",
  "TREATMENT",
  "MONITORING",
  "ACCEPTED",
  "IN_ASSESSMENT",
  "QUALITY_REVIEW",
  "APPROVAL_PENDING",
  "SECOND_LINE_REVIEW",
];

export async function getDashboardData(filters: RiskFilters = {}): Promise<DashboardData> {
  const rows = await getRiskRows(filters);
  const openRows = rows.filter((r) => OPEN_STATUSES.includes(r.status));

  const [actions, acceptances, controls, thirdParties, contracts, assessments] = await Promise.all([
    db.action.findMany({ select: { status: true, dueDate: true } }),
    db.riskAcceptance.count({ where: { status: { in: ["REQUESTED", "IN_REVIEW"] } } }),
    db.control.count({
      where: { operatingEffectiveness: { in: ["INEFFECTIVE", "PARTIALLY_EFFECTIVE"] } },
    }),
    db.thirdParty.count({
      where: { OR: [{ criticality: "CRITICAL" }, { criticalFunctions: { some: {} } }] },
    }),
    db.contract.count({
      where: { endDate: { not: null, lte: new Date(Date.now() + 180 * 86400000) } },
    }),
    db.riskAssessment.findMany({
      where: { assessedAt: { gte: new Date(Date.now() - 365 * 86400000) } },
      select: {
        assessedAt: true,
        residualScore: true,
        likelihood: true,
        impact: true,
        isCurrent: true,
      },
    }),
  ]);

  const openActions = actions.filter((a) => !["CLOSED", "COMPLETED"].includes(a.status));
  const overdueActions = openActions.filter((a) => isOverdue(a.dueDate));

  // Heatmap über aktuelle Bewertungen der gefilterten Risiken
  const heatmap: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0) as number[]);
  for (const r of openRows) {
    if (r.likelihood && r.impact) {
      heatmap[r.likelihood - 1]![r.impact - 1]! += 1;
    }
  }

  const countBy = (items: string[]): Map<string, number> => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
    return m;
  };

  const byCategoryMap = new Map<string, { count: number; aboveAppetite: number }>();
  for (const r of openRows) {
    const e = byCategoryMap.get(r.category) ?? { count: 0, aboveAppetite: 0 };
    e.count += 1;
    if (r.aboveAppetite) e.aboveAppetite += 1;
    byCategoryMap.set(r.category, e);
  }

  const byOu = [...countBy(openRows.map((r) => r.ouName ?? "Ohne Zuordnung")).entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const byThirdParty = [...countBy(openRows.flatMap((r) => r.thirdParties)).entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const actionStatus = [...countBy(actions.map((a) => a.status)).entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // Trend: Monatsmittel des Residual-Scores aller Bewertungen der letzten 12 Monate
  const trendMap = new Map<string, { sum: number; count: number }>();
  for (const a of assessments) {
    const month = a.assessedAt.toISOString().slice(0, 7);
    const e = trendMap.get(month) ?? { sum: 0, count: 0 };
    e.sum += a.residualScore;
    e.count += 1;
    trendMap.set(month, e);
  }
  const trend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, count }]) => ({
      month,
      avgResidual: Math.round((sum / count) * 10) / 10,
      count,
    }));

  const top10 = [...openRows]
    .filter((r) => r.residualScore != null)
    .sort((a, b) => (b.residualScore ?? 0) - (a.residualScore ?? 0))
    .slice(0, 10);

  return {
    rows,
    kpi: {
      openRisks: openRows.length,
      highCritical: openRows.filter(
        (r) => r.residualClass === "HIGH" || r.residualClass === "CRITICAL",
      ).length,
      aboveAppetite: openRows.filter((r) => r.aboveAppetite).length,
      overdueReviews: openRows.filter((r) => r.reviewOverdue).length,
      openActions: openActions.length,
      overdueActions: overdueActions.length,
      openAcceptances: acceptances,
      weakControls: controls,
      criticalThirdParties: thirdParties,
      expiringContracts: contracts,
      risksWithoutOwner: openRows.filter((r) => !r.ownerName).length,
      risksWithoutAssessment: rows.filter((r) => r.residualScore === null && r.status !== "CLOSED")
        .length,
    },
    heatmap,
    byCategory: [...byCategoryMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count),
    byOu,
    byThirdParty,
    actionStatus,
    trend,
    top10,
  };
}
