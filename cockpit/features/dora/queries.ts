import "server-only";
import { db } from "@/lib/db";
import {
  chapterScore,
  resilienceIndex,
  effectiveMaturity,
  type ChapterResult,
  type TrafficLight,
} from "@/lib/domain/dora-scoring";
import { isOverdue } from "@/lib/utils";
import { maxCifDependency } from "@/lib/domain/kri";

/**
 * Aggregation des DORA-Anforderungskatalogs für Dashboard, Listen und
 * Reports. Die Berechnung folgt strikt lib/domain/dora-scoring.ts
 * (FRWK-DORA-001 Kap. 11) – hier wird nur Datenbeschaffung betrieben.
 */

export interface DoraRequirementRow {
  id: string;
  reqId: string;
  chapterKey: string;
  chapterRoman: string;
  article: string;
  title: string;
  bindingness: string;
  weight: number;
  knockout: boolean;
  ownerRole: string;
  maturity: number | null;
  effectiveMaturity: number;
  hasValidEvidence: boolean;
  evidenceCapped: boolean;
  isOpenKnockout: boolean;
  openFindings: number;
  linkedProcesses: string[];
}

export interface DoraChapterSummary {
  key: string;
  roman: string;
  title: string;
  articleRange: string;
  weightPercent: number;
  result: ChapterResult;
}

export interface DoraOverview {
  chapters: DoraChapterSummary[];
  index: { indexPercent: number; totalOpenKnockouts: number; status: TrafficLight };
  rows: DoraRequirementRow[];
  kpis: Array<{ id: string; label: string; value: string; target: string; ok: boolean | null }>;
  maturityTrend: Array<{ month: string; avgMaturity: number; count: number }>;
  openFindingsBySeverity: Record<string, number>;
  overdueCapaCount: number;
  incidentSummary: { open: number; major: number; overdueReports: number };
}

function evidenceIsValid(e: { validUntil: Date | null; reviewStatus: string }): boolean {
  return e.reviewStatus === "REVIEWED" && (!e.validUntil || !isOverdue(e.validUntil));
}

export async function getDoraRows(): Promise<DoraRequirementRow[]> {
  const requirements = await db.doraRequirement.findMany({
    include: {
      chapter: true,
      assessments: { where: { isCurrent: true }, take: 1 },
      evidence: { select: { validUntil: true, reviewStatus: true } },
      findings: { select: { status: true } },
    },
    orderBy: { reqId: "asc" },
  });

  return requirements.map((r) => {
    const maturity = r.assessments[0]?.maturity ?? null;
    const hasValidEvidence = r.evidence.some(evidenceIsValid);
    const eff = effectiveMaturity(maturity, hasValidEvidence);
    return {
      id: r.id,
      reqId: r.reqId,
      chapterKey: r.chapter.key,
      chapterRoman: r.chapter.roman,
      article: r.article,
      title: r.title,
      bindingness: r.bindingness,
      weight: r.weight,
      knockout: r.knockout,
      ownerRole: r.ownerRole,
      maturity,
      effectiveMaturity: eff,
      hasValidEvidence,
      evidenceCapped: maturity !== null && eff < maturity,
      isOpenKnockout: r.knockout && eff < 3,
      openFindings: r.findings.filter((f) => f.status !== "CLOSED").length,
      linkedProcesses: r.linkedProcesses ? r.linkedProcesses.split(",").map((s) => s.trim()) : [],
    };
  });
}

export async function getDoraOverview(): Promise<DoraOverview> {
  const [rows, chapters, findings, assessments, incidents] = await Promise.all([
    getDoraRows(),
    db.doraChapter.findMany({ orderBy: { key: "asc" } }),
    db.doraFinding.findMany({
      include: { action: { select: { status: true, dueDate: true } } },
    }),
    db.doraAssessment.findMany({
      where: { assessedAt: { gte: new Date(Date.now() - 365 * 86_400_000) } },
      select: { assessedAt: true, maturity: true },
    }),
    db.incident.findMany({ include: { reports: true } }),
  ]);

  const overdueCriticalCapa = findings.some(
    (f) =>
      f.severity === "CRITICAL" &&
      f.status !== "CLOSED" &&
      f.action &&
      !["CLOSED", "COMPLETED"].includes(f.action.status) &&
      isOverdue(f.action.dueDate),
  );

  const chapterSummaries: DoraChapterSummary[] = chapters.map((ch) => {
    const chapterRows = rows.filter((r) => r.chapterKey === ch.key);
    return {
      key: ch.key,
      roman: ch.roman,
      title: ch.title,
      articleRange: ch.articleRange,
      weightPercent: ch.weightPercent,
      result: chapterScore(
        chapterRows.map((r) => ({
          reqId: r.reqId,
          weight: r.weight,
          knockout: r.knockout,
          maturity: r.maturity,
          hasValidEvidence: r.hasValidEvidence,
        })),
        { hasOverdueCriticalCapa: overdueCriticalCapa },
      ),
    };
  });

  const index = resilienceIndex(
    chapterSummaries.map((c) => ({ key: c.key, weightPercent: c.weightPercent, result: c.result })),
  );

  // Reifegrad-Trend: Monatsmittel der (Neu-)Bewertungen der letzten 12 Monate
  const trendMap = new Map<string, { sum: number; count: number }>();
  for (const a of assessments) {
    const month = a.assessedAt.toISOString().slice(0, 7);
    const e = trendMap.get(month) ?? { sum: 0, count: 0 };
    e.sum += a.maturity;
    e.count += 1;
    trendMap.set(month, e);
  }
  const maturityTrend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, count }]) => ({
      month,
      avgMaturity: Math.round((sum / count) * 100) / 100,
      count,
    }));

  const openFindingsBySeverity: Record<string, number> = {};
  for (const f of findings) {
    if (f.status === "CLOSED") continue;
    openFindingsBySeverity[f.severity] = (openFindingsBySeverity[f.severity] ?? 0) + 1;
  }
  const overdueCapaCount = findings.filter(
    (f) =>
      f.status !== "CLOSED" &&
      f.action &&
      !["CLOSED", "COMPLETED"].includes(f.action.status) &&
      isOverdue(f.action.dueDate),
  ).length;

  const now = Date.now();
  const incidentSummary = {
    open: incidents.filter((i) => i.status !== "CLOSED").length,
    major: incidents.filter((i) => i.isMajor && i.status !== "CLOSED").length,
    overdueReports: incidents
      .filter((i) => i.status !== "CLOSED")
      .flatMap((i) => i.reports)
      .filter((r) => !r.submittedAt && r.dueAt.getTime() < now).length,
  };

  // Berechenbare Kennzahlen aus dem Kennzahlenkatalog (Tabelle 25)
  // CIF-Bezug ausschließlich aus der Relation (Review v3, B-2/P1-02).
  const [tpCritical, tpCriticalTestedExit, risksAboveAppetite, contractsTotal] = await Promise.all([
    db.thirdParty.findMany({
      where: { criticalFunctions: { some: {} } },
      include: { exitStrategy: true, _count: { select: { criticalFunctions: true } } },
    }),
    Promise.resolve(null),
    db.risk.findMany({
      where: { status: { notIn: ["CLOSED", "DRAFT", "REJECTED"] } },
      include: { category: true, assessments: { where: { isCurrent: true }, take: 1 } },
    }),
    db.contract.count(),
  ]);
  void tpCriticalTestedExit;
  const exitTested = tpCritical.filter((t) => t.exitStrategy?.status === "TESTED").length;
  const aboveAppetite = risksAboveAppetite.filter((r) => {
    const a = r.assessments[0];
    return a && a.residualScore > (r.appetiteOverride ?? r.category.appetiteThreshold);
  }).length;
  // Leere Relation => "nicht berechenbar" (null), NIE 0 mit Zielerreichung.
  const maxCifPerProvider = maxCifDependency(
    tpCritical.map((t) => t._count.criticalFunctions),
  );

  const kpis: DoraOverview["kpis"] = [
    {
      id: "KPI-GOV-01",
      label: "DORA Resilience Index",
      value: `${index.indexPercent} %`,
      target: "≥ 85 %",
      ok: index.indexPercent >= 85,
    },
    {
      id: "KRI-GOV-02",
      label: "Offene Knockouts",
      value: String(index.totalOpenKnockouts),
      target: "0",
      ok: index.totalOpenKnockouts === 0,
    },
    {
      id: "KRI-GOV-03",
      label: "Überfällige CAPA",
      value: String(overdueCapaCount),
      target: "0",
      ok: overdueCapaCount === 0,
    },
    {
      id: "KRI-K2-04",
      label: "Risiken über Risikoappetit",
      value: String(aboveAppetite),
      target: "0",
      ok: aboveAppetite === 0,
    },
    {
      id: "KPI-K5-03",
      label: "Getestete Exit-Strategien (CIF)",
      value: `${exitTested}/${tpCritical.length}`,
      target: "100 %",
      ok: tpCritical.length > 0 ? exitTested === tpCritical.length : null,
    },
    {
      id: "KRI-K5-04",
      label: "Max. CIF-Abhängigkeit je Provider",
      value: maxCifPerProvider === null ? "nicht berechenbar" : String(maxCifPerProvider),
      target: "≤ 2",
      ok: maxCifPerProvider === null ? null : maxCifPerProvider <= 2,
    },
    {
      id: "KPI-K5-01",
      label: "Verträge im Register",
      value: String(contractsTotal),
      target: "vollständig",
      ok: null,
    },
    {
      id: "KPI-K3-01",
      label: "Meldefristentreue (offene Vorfälle)",
      value:
        incidentSummary.overdueReports === 0
          ? "fristgerecht"
          : `${incidentSummary.overdueReports} überfällig`,
      target: "100 %",
      ok: incidentSummary.overdueReports === 0,
    },
  ];

  return {
    chapters: chapterSummaries,
    index,
    rows,
    kpis,
    maturityTrend,
    openFindingsBySeverity,
    overdueCapaCount,
    incidentSummary,
  };
}

// ------------------------------------------------------------------
// Heatmap Kapitel × kritische Funktionen (FRWK-DORA-001, Abb. 14):
// verbindet die Kapitelsicht mit der Frage, welcher Geschäftsprozess
// konkret gefährdet ist. Zellwert = offene Risiken der Funktion mit
// regulatorischem Bezug zum jeweiligen Kapitel; Farbe = höchste
// Residual-Klasse dieser Risiken.
// ------------------------------------------------------------------

const REG_PREFIX_TO_CHAPTER: Array<[string, string]> = [
  ["DORA-GOV", "K2"],
  ["DORA-PROT", "K2"],
  ["DORA-DET", "K2"],
  ["DORA-INC", "K3"],
  ["DORA-TEST", "K4"],
  ["DORA-TPR", "K5"],
];

export interface CifChapterCell {
  count: number;
  maxResidual: number | null;
}

export interface CifChapterHeatmap {
  cifs: Array<{ id: string; name: string; isCritical: boolean }>;
  chapters: string[]; // K2 … K6
  cells: Record<string, Record<string, CifChapterCell>>; // cifId → chapterKey → cell
}

export async function getCifChapterHeatmap(): Promise<CifChapterHeatmap> {
  const [cifs, risks] = await Promise.all([
    db.criticalFunction.findMany({ orderBy: { name: "asc" } }),
    db.risk.findMany({
      where: { status: { notIn: ["CLOSED", "DRAFT", "REJECTED"] } },
      include: {
        criticalFunctions: { select: { id: true } },
        regulatoryRequirements: { select: { refId: true } },
        assessments: { where: { isCurrent: true }, take: 1, select: { residualScore: true } },
      },
    }),
  ]);

  const chapters = ["K2", "K3", "K4", "K5", "K6"];
  const cells: CifChapterHeatmap["cells"] = {};
  for (const cif of cifs) {
    cells[cif.id] = Object.fromEntries(
      chapters.map((c) => [c, { count: 0, maxResidual: null }]),
    ) as Record<string, CifChapterCell>;
  }

  for (const risk of risks) {
    const residual = risk.assessments[0]?.residualScore ?? null;
    const riskChapters = new Set<string>();
    for (const req of risk.regulatoryRequirements) {
      for (const [prefix, chapter] of REG_PREFIX_TO_CHAPTER) {
        if (req.refId.startsWith(prefix)) riskChapters.add(chapter);
      }
    }
    if (riskChapters.size === 0) continue;
    for (const cif of risk.criticalFunctions) {
      const row = cells[cif.id];
      if (!row) continue;
      for (const chapter of riskChapters) {
        const cell = row[chapter]!;
        cell.count += 1;
        if (residual !== null && (cell.maxResidual === null || residual > cell.maxResidual)) {
          cell.maxResidual = residual;
        }
      }
    }
  }

  return {
    cifs: cifs.map((c) => ({ id: c.id, name: c.name, isCritical: c.isCritical })),
    chapters,
    cells,
  };
}
