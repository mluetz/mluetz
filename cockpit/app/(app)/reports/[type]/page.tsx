import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  ACCEPTANCE_STATUS,
  EFFECTIVENESS_RATING,
  FRAMEWORKS,
  RISK_CLASS,
  RISK_STATUS,
  TP_STATUS,
  TREATMENT_STRATEGY,
} from "@/lib/domain/enums";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getRiskRows, type RiskRow } from "@/features/risks/queries";
import { getReportDef, type ReportKey } from "@/features/reports/report-defs";
import { PrintButton } from "@/features/reports/print-button";
import { SaveReportButton } from "@/features/reports/save-report-button";
import { ComplianceDisclaimer } from "@/features/governance/disclaimer";
import { complianceStatusLabel, complianceStatusVariant } from "@/features/governance/status";
import { getLocale } from "@/lib/i18n/server";
import { REPORTS_MESSAGES, type ReportsMessages } from "@/lib/i18n/messages/reports";

export const metadata = { title: "Bericht" };
export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const def = getReportDef(type);
  if (!def) notFound();
  const locale = await getLocale();
  const t = REPORTS_MESSAGES[locale];
  const user = await requirePermission(def.permission);
  const now = new Date();
  const title = t.defs[def.key].title;

  const content = await renderContent(def.key, t);

  return (
    <div>
      <PageHeader
        title={title}
        description={t.defs[def.key].description}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Reports", href: "/reports" },
          { label: title },
        ]}
        actions={
          <div className="no-print flex items-center gap-2">
            <SaveReportButton reportType={def.key} title={title} locale={locale} />
            <PrintButton locale={locale} />
          </div>
        }
      />

      <div className="mb-5 grid gap-x-8 gap-y-1 rounded-lg border bg-card p-4 text-sm md:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="block text-xs text-muted-foreground">{t.meta.report}</span>
          {title}
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">{t.meta.effectiveDate}</span>
          {formatDate(now)}
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">{t.meta.author}</span>
          {user.name}
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">{t.meta.generatedAt}</span>
          {formatDateTime(now)}
        </div>
        <div className="md:col-span-2 lg:col-span-4">
          <span className="block text-xs text-muted-foreground">{t.meta.appliedFilters}</span>
          {t.meta.filtersAll}
        </div>
      </div>

      {content}
    </div>
  );
}

// ------------------------------------------------------------------
// Inhalte je Berichtstyp
// ------------------------------------------------------------------

async function renderContent(key: ReportKey, t: ReportsMessages): Promise<ReactNode> {
  switch (key) {
    case "EXECUTIVE_SUMMARY":
      return <ExecutiveSummary t={t} />;
    case "TOP_RISKS":
      return <TopRisks t={t} />;
    case "ABOVE_APPETITE":
      return <AboveAppetite t={t} />;
    case "OVERDUE_ACTIONS":
      return <OverdueActions t={t} />;
    case "ACCEPTANCES":
      return <Acceptances t={t} />;
    case "TPRM_OVERVIEW":
      return <TprmOverview t={t} />;
    case "DORA_READINESS":
      return <DoraReadiness t={t} />;
    case "CONTROL_EFFECTIVENESS":
      return <ControlEffectiveness t={t} />;
    case "QUALITY_REVIEW":
      return <QualityReviews t={t} />;
    case "TREND":
      return <Trend t={t} />;
    case "DECISION_PAPER":
      return <DecisionPaper t={t} />;
  }
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  );
}

function CountBadges({
  counts,
  labelOf,
  variantOf,
  emptyMessage,
}: {
  counts: Record<string, number>;
  labelOf: (key: string) => string;
  variantOf?: (key: string) => "low" | "medium" | "high" | "critical" | "secondary";
  emptyMessage: string;
}) {
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([k, n]) => (
        <Badge key={k} variant={variantOf ? variantOf(k) : "secondary"}>
          {labelOf(k)}: {n}
        </Badge>
      ))}
    </div>
  );
}

function RiskRowsTable({
  rows,
  emptyMessage,
  t,
}: {
  rows: RiskRow[];
  emptyMessage: string;
  t: ReportsMessages;
}) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>{t.riskTable.riskId}</TH>
          <TH>{t.riskTable.title}</TH>
          <TH>{t.riskTable.category}</TH>
          <TH>{t.riskTable.owner}</TH>
          <TH>{t.riskTable.inherent}</TH>
          <TH>{t.riskTable.residual}</TH>
          <TH>{t.riskTable.riskClass}</TH>
          <TH>{t.riskTable.status}</TH>
          <TH>{t.riskTable.strategy}</TH>
        </TR>
      </THead>
      <TBody>
        {rows.length === 0 ? (
          <TR>
            <TD colSpan={9} className="h-16 text-center text-muted-foreground">
              {emptyMessage}
            </TD>
          </TR>
        ) : (
          rows.map((r) => (
            <TR key={r.id}>
              <TD className="whitespace-nowrap font-medium">
                <Link href={`/risks/${r.id}`} className="hover:underline">
                  {r.riskId}
                </Link>
              </TD>
              <TD>{r.title}</TD>
              <TD className="whitespace-nowrap">{r.category}</TD>
              <TD className="whitespace-nowrap">{r.ownerName ?? "–"}</TD>
              <TD className="tabular-nums">{r.inherentScore ?? "–"}</TD>
              <TD className="tabular-nums">{r.residualScore ?? "–"}</TD>
              <TD>
                {r.residualClass ? (
                  <Badge variant={riskClassVariant(r.residualClass)}>
                    {RISK_CLASS[r.residualClass as keyof typeof RISK_CLASS] ?? r.residualClass}
                  </Badge>
                ) : (
                  "–"
                )}
              </TD>
              <TD className="whitespace-nowrap">
                {RISK_STATUS[r.status as keyof typeof RISK_STATUS] ?? r.status}
              </TD>
              <TD className="whitespace-nowrap">
                {r.treatmentStrategy
                  ? (TREATMENT_STRATEGY[r.treatmentStrategy as keyof typeof TREATMENT_STRATEGY] ??
                    r.treatmentStrategy)
                  : "–"}
              </TD>
            </TR>
          ))
        )}
      </TBody>
    </Table>
  );
}

function topByResidual(rows: RiskRow[], n = 10): RiskRow[] {
  return rows
    .filter((r) => r.residualScore !== null)
    .sort((a, b) => (b.residualScore ?? 0) - (a.residualScore ?? 0))
    .slice(0, n);
}

async function ExecutiveSummary({ t }: { t: ReportsMessages }) {
  const rows = await getRiskRows();
  const open = rows.filter((r) => !["CLOSED", "REJECTED"].includes(r.status));
  const highCritical = open.filter(
    (r) => r.residualClass === "HIGH" || r.residualClass === "CRITICAL",
  );
  const [openAcceptances, ineffectiveControls, criticalTps, openActions, overdueActions] =
    await Promise.all([
      db.riskAcceptance.count({ where: { status: { in: ["REQUESTED", "IN_REVIEW"] } } }),
      db.control.count({
        where: {
          OR: [{ designEffectiveness: "INEFFECTIVE" }, { operatingEffectiveness: "INEFFECTIVE" }],
        },
      }),
      db.thirdParty.count({ where: { criticality: "CRITICAL" } }),
      db.action.count({ where: { status: { notIn: ["CLOSED", "COMPLETED"] } } }),
      db.action.count({
        where: { status: { notIn: ["CLOSED", "COMPLETED"] }, dueDate: { lt: new Date() } },
      }),
    ]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold">{t.executiveSummary.kpiHeading}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label={t.executiveSummary.openRisks} value={open.length} />
          <Kpi label={t.executiveSummary.highCritical} value={highCritical.length} />
          <Kpi
            label={t.executiveSummary.aboveAppetite}
            value={open.filter((r) => r.aboveAppetite).length}
          />
          <Kpi
            label={t.executiveSummary.overdueReviews}
            value={rows.filter((r) => r.reviewOverdue).length}
          />
          <Kpi label={t.executiveSummary.openActions} value={openActions} />
          <Kpi label={t.executiveSummary.overdueActions} value={overdueActions} />
          <Kpi label={t.executiveSummary.openAcceptances} value={openAcceptances} />
          <Kpi label={t.executiveSummary.ineffectiveControls} value={ineffectiveControls} />
          <Kpi label={t.executiveSummary.criticalThirdParties} value={criticalTps} />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold">{t.executiveSummary.topHeading}</h2>
        <RiskRowsTable
          rows={topByResidual(rows)}
          emptyMessage={t.executiveSummary.emptyRisks}
          t={t}
        />
      </section>
    </div>
  );
}

async function TopRisks({ t }: { t: ReportsMessages }) {
  const rows = await getRiskRows();
  return <RiskRowsTable rows={topByResidual(rows)} emptyMessage={t.topRisks.empty} t={t} />;
}

async function AboveAppetite({ t }: { t: ReportsMessages }) {
  const rows = await getRiskRows({ aboveAppetite: true });
  return <RiskRowsTable rows={rows} emptyMessage={t.aboveAppetite.empty} t={t} />;
}

async function OverdueActions({ t }: { t: ReportsMessages }) {
  const actions = await db.action.findMany({
    where: { status: { notIn: ["CLOSED", "COMPLETED"] }, dueDate: { lt: new Date() } },
    include: { risk: { select: { id: true, riskId: true, title: true } }, owner: true },
    orderBy: { dueDate: "asc" },
  });
  const now = Date.now();
  return (
    <Table>
      <THead>
        <TR>
          <TH>{t.overdueActions.actionId}</TH>
          <TH>{t.overdueActions.title}</TH>
          <TH>{t.overdueActions.owner}</TH>
          <TH>{t.overdueActions.dueDate}</TH>
          <TH>{t.overdueActions.daysOverdue}</TH>
          <TH>{t.overdueActions.escalationLevel}</TH>
          <TH>{t.overdueActions.risk}</TH>
        </TR>
      </THead>
      <TBody>
        {actions.length === 0 ? (
          <TR>
            <TD colSpan={7} className="h-16 text-center text-muted-foreground">
              {t.overdueActions.empty}
            </TD>
          </TR>
        ) : (
          actions.map((a) => (
            <TR key={a.id}>
              <TD className="whitespace-nowrap font-medium">{a.actionId}</TD>
              <TD>{a.title}</TD>
              <TD className="whitespace-nowrap">{a.owner?.name ?? "–"}</TD>
              <TD className="whitespace-nowrap">{formatDate(a.dueDate)}</TD>
              <TD className="tabular-nums">
                {a.dueDate ? Math.floor((now - a.dueDate.getTime()) / 86400000) : "–"}
              </TD>
              <TD className="tabular-nums">{a.escalationLevel}</TD>
              <TD className="whitespace-nowrap">
                <Link href={`/risks/${a.risk.id}`} className="hover:underline">
                  {a.risk.riskId}
                </Link>
              </TD>
            </TR>
          ))
        )}
      </TBody>
    </Table>
  );
}

async function Acceptances({ t }: { t: ReportsMessages }) {
  const acceptances = await db.riskAcceptance.findMany({
    include: {
      risk: { select: { id: true, riskId: true, title: true } },
      requestedBy: true,
      approvedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return (
    <Table>
      <THead>
        <TR>
          <TH>{t.acceptances.risk}</TH>
          <TH>{t.acceptances.status}</TH>
          <TH>{t.acceptances.requestedBy}</TH>
          <TH>{t.acceptances.approvedBy}</TH>
          <TH>{t.acceptances.validUntil}</TH>
          <TH>{t.acceptances.compensatingControls}</TH>
        </TR>
      </THead>
      <TBody>
        {acceptances.length === 0 ? (
          <TR>
            <TD colSpan={6} className="h-16 text-center text-muted-foreground">
              {t.acceptances.empty}
            </TD>
          </TR>
        ) : (
          acceptances.map((a) => (
            <TR key={a.id}>
              <TD className="whitespace-nowrap">
                <Link href={`/risks/${a.risk.id}`} className="hover:underline">
                  {a.risk.riskId}
                </Link>{" "}
                – {a.risk.title}
              </TD>
              <TD className="whitespace-nowrap">
                {ACCEPTANCE_STATUS[a.status as keyof typeof ACCEPTANCE_STATUS] ?? a.status}
              </TD>
              <TD className="whitespace-nowrap">{a.requestedBy.name}</TD>
              <TD className="whitespace-nowrap">{a.approvedBy?.name ?? "–"}</TD>
              <TD className="whitespace-nowrap">{formatDate(a.validUntil)}</TD>
              <TD className="max-w-96 truncate" title={a.compensatingControls}>
                {a.compensatingControls}
              </TD>
            </TR>
          ))
        )}
      </TBody>
    </Table>
  );
}

async function TprmOverview({ t }: { t: ReportsMessages }) {
  const tps = await db.thirdParty.findMany({
    include: { exitStrategy: true },
    orderBy: { tpId: "asc" },
  });
  const critical = tps.filter((tp) => tp.criticality === "CRITICAL").length;
  const concentration = tps.filter((tp) => tp.concentrationRisk).length;
  const missingExit = tps.filter(
    (tp) =>
      tp.supportsCriticalFunction && (!tp.exitStrategy || tp.exitStrategy.status === "MISSING"),
  ).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi label={t.tprm.criticalThirdParties} value={critical} />
        <Kpi label={t.tprm.concentrationRisks} value={concentration} />
        <Kpi label={t.tprm.missingExit} value={missingExit} />
      </div>
      <Table>
        <THead>
          <TR>
            <TH>{t.tprm.tpId}</TH>
            <TH>{t.tprm.name}</TH>
            <TH>{t.tprm.status}</TH>
            <TH>{t.tprm.criticality}</TH>
            <TH>{t.tprm.residual}</TH>
            <TH>{t.tprm.dueDiligence}</TH>
            <TH>{t.tprm.nextReview}</TH>
            <TH>{t.tprm.concentration}</TH>
            <TH>{t.tprm.exitStatus}</TH>
          </TR>
        </THead>
        <TBody>
          {tps.length === 0 ? (
            <TR>
              <TD colSpan={9} className="h-16 text-center text-muted-foreground">
                {t.tprm.empty}
              </TD>
            </TR>
          ) : (
            tps.map((tp) => (
              <TR key={tp.id}>
                <TD className="whitespace-nowrap font-medium">{tp.tpId}</TD>
                <TD>{tp.name}</TD>
                <TD className="whitespace-nowrap">
                  {TP_STATUS[tp.status as keyof typeof TP_STATUS] ?? tp.status}
                </TD>
                <TD className="whitespace-nowrap">{tp.criticality}</TD>
                <TD className="tabular-nums">{tp.residualRiskScore ?? "–"}</TD>
                <TD className="whitespace-nowrap">{tp.dueDiligenceStatus}</TD>
                <TD className="whitespace-nowrap">{formatDate(tp.nextReviewDate)}</TD>
                <TD>{tp.concentrationRisk ? t.common.yes : t.common.no}</TD>
                <TD className="whitespace-nowrap">{tp.exitStrategy?.status ?? "MISSING"}</TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}

async function DoraReadiness({ t }: { t: ReportsMessages }) {
  const mappings = await db.complianceMapping.findMany({
    where: { requirement: { framework: { in: ["DORA", "DORA_RTS"] } } },
    include: { requirement: true, owner: true },
    orderBy: { requirement: { refId: "asc" } },
  });
  const counts: Record<string, number> = {};
  for (const m of mappings) counts[m.status] = (counts[m.status] ?? 0) + 1;
  const { getDoraOverview } = await import("@/features/dora/queries");
  const overview = await getDoraOverview();
  const lightLabel = t.dora.lights;
  return (
    <div className="space-y-6">
      <ComplianceDisclaimer />
      <section>
        <h2 className="mb-3 text-sm font-semibold">{t.dora.indexHeading}</h2>
        <p className="mb-2 text-sm">
          {t.dora.totalIndex} <span className="font-semibold">{overview.index.indexPercent} %</span>{" "}
          · {t.dora.statusLabel}{" "}
          <span className="font-semibold">{lightLabel[overview.index.status]}</span> ·{" "}
          {t.dora.openKnockoutsLabel}{" "}
          <span className="font-semibold">{overview.index.totalOpenKnockouts}</span>
        </p>
        <Table>
          <THead>
            <TR>
              <TH>{t.dora.chapter}</TH>
              <TH>{t.dora.articles}</TH>
              <TH>{t.dora.weight}</TH>
              <TH>{t.dora.score}</TH>
              <TH>{t.dora.status}</TH>
              <TH>{t.dora.assessed}</TH>
              <TH>{t.dora.openKnockouts}</TH>
            </TR>
          </THead>
          <TBody>
            {overview.chapters.map((c) => (
              <TR key={c.key}>
                <TD>
                  {t.dora.chapterAbbrev} {c.roman} – {c.title}
                </TD>
                <TD className="text-xs">{c.articleRange}</TD>
                <TD>{c.weightPercent} %</TD>
                <TD className="font-semibold">{c.result.scorePercent} %</TD>
                <TD>{lightLabel[c.result.status]}</TD>
                <TD className="text-xs">
                  {c.result.assessedCount}/{c.result.totalCount}
                </TD>
                <TD className="text-xs">
                  {c.result.openKnockouts.length ? c.result.openKnockouts.join(", ") : "–"}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <p className="mt-1 text-xs text-muted-foreground">{t.dora.methodology}</p>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold">{t.dora.statusDistribution}</h2>
        <CountBadges
          counts={counts}
          labelOf={complianceStatusLabel}
          variantOf={complianceStatusVariant}
          emptyMessage={t.common.noData}
        />
      </section>
      <Table>
        <THead>
          <TR>
            <TH>{t.dora.refId}</TH>
            <TH>{t.dora.framework}</TH>
            <TH>{t.dora.requirement}</TH>
            <TH>{t.dora.status}</TH>
            <TH>{t.dora.justification}</TH>
            <TH>{t.dora.owner}</TH>
            <TH>{t.dora.nextReview}</TH>
          </TR>
        </THead>
        <TBody>
          {mappings.length === 0 ? (
            <TR>
              <TD colSpan={7} className="h-16 text-center text-muted-foreground">
                {t.dora.empty}
              </TD>
            </TR>
          ) : (
            mappings.map((m) => (
              <TR key={m.id}>
                <TD className="whitespace-nowrap font-medium">
                  <Link href={`/governance/${m.requirementId}`} className="hover:underline">
                    {m.requirement.refId}
                  </Link>
                </TD>
                <TD className="whitespace-nowrap">
                  {FRAMEWORKS[m.requirement.framework as keyof typeof FRAMEWORKS] ??
                    m.requirement.framework}
                </TD>
                <TD>{m.requirement.title}</TD>
                <TD>
                  <Badge variant={complianceStatusVariant(m.status)}>
                    {complianceStatusLabel(m.status)}
                  </Badge>
                </TD>
                <TD className="max-w-72 truncate" title={m.justification}>
                  {m.justification}
                </TD>
                <TD className="whitespace-nowrap">{m.owner?.name ?? "–"}</TD>
                <TD className="whitespace-nowrap">{formatDate(m.nextReviewDate)}</TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}

async function ControlEffectiveness({ t }: { t: ReportsMessages }) {
  const controls = await db.control.findMany({
    include: {
      owner: true,
      assessments: { orderBy: { testDate: "desc" }, take: 1 },
    },
    orderBy: { controlId: "asc" },
  });
  const designCounts: Record<string, number> = {};
  const operatingCounts: Record<string, number> = {};
  for (const c of controls) {
    designCounts[c.designEffectiveness] = (designCounts[c.designEffectiveness] ?? 0) + 1;
    operatingCounts[c.operatingEffectiveness] =
      (operatingCounts[c.operatingEffectiveness] ?? 0) + 1;
  }
  const ratingLabel = (k: string) =>
    EFFECTIVENESS_RATING[k as keyof typeof EFFECTIVENESS_RATING] ?? k;
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="mb-2 text-sm font-semibold">{t.controls.designDistribution}</h2>
          <CountBadges counts={designCounts} labelOf={ratingLabel} emptyMessage={t.common.noData} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">{t.controls.operatingDistribution}</h2>
          <CountBadges
            counts={operatingCounts}
            labelOf={ratingLabel}
            emptyMessage={t.common.noData}
          />
        </div>
      </section>
      <Table>
        <THead>
          <TR>
            <TH>{t.controls.controlId}</TH>
            <TH>{t.controls.name}</TH>
            <TH>{t.controls.owner}</TH>
            <TH>{t.controls.designEffectiveness}</TH>
            <TH>{t.controls.operatingEffectiveness}</TH>
            <TH>{t.controls.lastTest}</TH>
            <TH>{t.controls.nextTest}</TH>
          </TR>
        </THead>
        <TBody>
          {controls.length === 0 ? (
            <TR>
              <TD colSpan={7} className="h-16 text-center text-muted-foreground">
                {t.controls.empty}
              </TD>
            </TR>
          ) : (
            controls.map((c) => (
              <TR key={c.id}>
                <TD className="whitespace-nowrap font-medium">{c.controlId}</TD>
                <TD>{c.name}</TD>
                <TD className="whitespace-nowrap">{c.owner?.name ?? "–"}</TD>
                <TD className="whitespace-nowrap">{ratingLabel(c.designEffectiveness)}</TD>
                <TD className="whitespace-nowrap">{ratingLabel(c.operatingEffectiveness)}</TD>
                <TD className="whitespace-nowrap">
                  {formatDate(c.assessments[0]?.testDate ?? null)}
                </TD>
                <TD className="whitespace-nowrap">{formatDate(c.nextTestDate)}</TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}

async function QualityReviews({ t }: { t: ReportsMessages }) {
  const reviews = await db.qualityReview.findMany({
    include: { risk: { select: { id: true, riskId: true, title: true } } },
    orderBy: { startedAt: "desc" },
  });
  const scored = reviews.filter((r) => r.qualityScore !== null);
  const avg = scored.length
    ? Math.round(scored.reduce((s, r) => s + (r.qualityScore ?? 0), 0) / scored.length)
    : null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi label={t.quality.total} value={reviews.length} />
        <Kpi label={t.quality.completedWithScore} value={scored.length} />
        <Kpi label={t.quality.averageScore} value={avg !== null ? `${avg} %` : "–"} />
      </div>
      <Table>
        <THead>
          <TR>
            <TH>{t.quality.risk}</TH>
            <TH>{t.quality.reviewer}</TH>
            <TH>{t.quality.outcome}</TH>
            <TH>{t.quality.score}</TH>
            <TH>{t.quality.date}</TH>
          </TR>
        </THead>
        <TBody>
          {reviews.length === 0 ? (
            <TR>
              <TD colSpan={5} className="h-16 text-center text-muted-foreground">
                {t.quality.empty}
              </TD>
            </TR>
          ) : (
            reviews.map((r) => (
              <TR key={r.id}>
                <TD className="whitespace-nowrap">
                  <Link href={`/risks/${r.risk.id}`} className="hover:underline">
                    {r.risk.riskId}
                  </Link>{" "}
                  – {r.risk.title}
                </TD>
                <TD className="whitespace-nowrap">{r.reviewerName}</TD>
                <TD className="whitespace-nowrap">{r.outcome}</TD>
                <TD className="tabular-nums">
                  {r.qualityScore !== null ? `${r.qualityScore} %` : "–"}
                </TD>
                <TD className="whitespace-nowrap">{formatDate(r.completedAt ?? r.startedAt)}</TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}

async function Trend({ t }: { t: ReportsMessages }) {
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const assessments = await db.riskAssessment.findMany({
    where: { assessedAt: { gte: start } },
    select: { assessedAt: true, residualScore: true },
  });
  const buckets = new Map<string, { count: number; sum: number }>();
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push(k);
    buckets.set(k, { count: 0, sum: 0 });
  }
  for (const a of assessments) {
    const k = `${a.assessedAt.getFullYear()}-${String(a.assessedAt.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(k);
    if (b) {
      b.count += 1;
      b.sum += a.residualScore;
    }
  }
  return (
    <Table>
      <THead>
        <TR>
          <TH>{t.trend.month}</TH>
          <TH>{t.trend.assessmentCount}</TH>
          <TH>{t.trend.avgResidualScore}</TH>
        </TR>
      </THead>
      <TBody>
        {months.map((m) => {
          const b = buckets.get(m)!;
          return (
            <TR key={m}>
              <TD className="whitespace-nowrap font-medium">{m}</TD>
              <TD className="tabular-nums">{b.count}</TD>
              <TD className="tabular-nums">{b.count > 0 ? (b.sum / b.count).toFixed(1) : "–"}</TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}

function DecisionLine({ t }: { t: ReportsMessages }) {
  return (
    <p className="mt-3 border-b border-dashed pb-1 text-sm">
      {t.decisionPaper.decision} ______________________________________________
    </p>
  );
}

async function DecisionPaper({ t }: { t: ReportsMessages }) {
  const [openAcceptances, aboveAppetiteRows, escalations] = await Promise.all([
    db.riskAcceptance.findMany({
      where: { status: { in: ["REQUESTED", "IN_REVIEW"] } },
      include: { risk: { select: { id: true, riskId: true, title: true } }, requestedBy: true },
      orderBy: { createdAt: "asc" },
    }),
    getRiskRows({ aboveAppetite: true }),
    db.action.findMany({
      where: { escalationLevel: { gte: 2 }, status: { notIn: ["CLOSED", "COMPLETED"] } },
      include: { risk: { select: { id: true, riskId: true, title: true } }, owner: true },
      orderBy: { escalationLevel: "desc" },
    }),
  ]);
  const untreated = aboveAppetiteRows.filter((r) => r.status === "OPEN" && r.openActions === 0);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold">{t.decisionPaper.section1}</h2>
        <Table>
          <THead>
            <TR>
              <TH>{t.decisionPaper.risk}</TH>
              <TH>{t.decisionPaper.requestedBy}</TH>
              <TH>{t.decisionPaper.status}</TH>
              <TH>{t.decisionPaper.requestedAt}</TH>
              <TH>{t.decisionPaper.justification}</TH>
            </TR>
          </THead>
          <TBody>
            {openAcceptances.length === 0 ? (
              <TR>
                <TD colSpan={5} className="h-14 text-center text-muted-foreground">
                  {t.decisionPaper.emptyAcceptances}
                </TD>
              </TR>
            ) : (
              openAcceptances.map((a) => (
                <TR key={a.id}>
                  <TD className="whitespace-nowrap">
                    <Link href={`/risks/${a.risk.id}`} className="hover:underline">
                      {a.risk.riskId}
                    </Link>{" "}
                    – {a.risk.title}
                  </TD>
                  <TD className="whitespace-nowrap">{a.requestedBy.name}</TD>
                  <TD className="whitespace-nowrap">
                    {ACCEPTANCE_STATUS[a.status as keyof typeof ACCEPTANCE_STATUS] ?? a.status}
                  </TD>
                  <TD className="whitespace-nowrap">{formatDate(a.createdAt)}</TD>
                  <TD className="max-w-96 truncate" title={a.justification}>
                    {a.justification}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
        <DecisionLine t={t} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">{t.decisionPaper.section2}</h2>
        <RiskRowsTable rows={untreated} emptyMessage={t.decisionPaper.emptyUntreated} t={t} />
        <DecisionLine t={t} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">{t.decisionPaper.section3}</h2>
        <Table>
          <THead>
            <TR>
              <TH>{t.decisionPaper.actionId}</TH>
              <TH>{t.decisionPaper.title}</TH>
              <TH>{t.decisionPaper.owner}</TH>
              <TH>{t.decisionPaper.dueDate}</TH>
              <TH>{t.decisionPaper.escalationLevel}</TH>
              <TH>{t.decisionPaper.risk}</TH>
            </TR>
          </THead>
          <TBody>
            {escalations.length === 0 ? (
              <TR>
                <TD colSpan={6} className="h-14 text-center text-muted-foreground">
                  {t.decisionPaper.emptyEscalations}
                </TD>
              </TR>
            ) : (
              escalations.map((a) => (
                <TR key={a.id}>
                  <TD className="whitespace-nowrap font-medium">{a.actionId}</TD>
                  <TD>{a.title}</TD>
                  <TD className="whitespace-nowrap">{a.owner?.name ?? "–"}</TD>
                  <TD className="whitespace-nowrap">{formatDate(a.dueDate)}</TD>
                  <TD className="tabular-nums">{a.escalationLevel}</TD>
                  <TD className="whitespace-nowrap">
                    <Link href={`/risks/${a.risk.id}`} className="hover:underline">
                      {a.risk.riskId}
                    </Link>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
        <DecisionLine t={t} />
      </section>
    </div>
  );
}
