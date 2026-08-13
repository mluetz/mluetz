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

export const metadata = { title: "Bericht" };
export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const def = getReportDef(type);
  if (!def) notFound();
  const user = await requirePermission(def.permission);
  const now = new Date();

  const content = await renderContent(def.key);

  return (
    <div>
      <PageHeader
        title={def.titel}
        description={def.beschreibung}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Reports", href: "/reports" },
          { label: def.titel },
        ]}
        actions={
          <div className="no-print flex items-center gap-2">
            <SaveReportButton reportType={def.key} title={def.titel} />
            <PrintButton />
          </div>
        }
      />

      <div className="mb-5 grid gap-x-8 gap-y-1 rounded-lg border bg-card p-4 text-sm md:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="block text-xs text-muted-foreground">Bericht</span>
          {def.titel}
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Stichtag</span>
          {formatDate(now)}
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Ersteller</span>
          {user.name}
        </div>
        <div>
          <span className="block text-xs text-muted-foreground">Generiert am</span>
          {formatDateTime(now)}
        </div>
        <div className="md:col-span-2 lg:col-span-4">
          <span className="block text-xs text-muted-foreground">Angewandte Filter</span>
          alle
        </div>
      </div>

      {content}
    </div>
  );
}

// ------------------------------------------------------------------
// Inhalte je Berichtstyp
// ------------------------------------------------------------------

async function renderContent(key: ReportKey): Promise<ReactNode> {
  switch (key) {
    case "EXECUTIVE_SUMMARY":
      return <ExecutiveSummary />;
    case "TOP_RISKS":
      return <TopRisks />;
    case "ABOVE_APPETITE":
      return <AboveAppetite />;
    case "OVERDUE_ACTIONS":
      return <OverdueActions />;
    case "ACCEPTANCES":
      return <Acceptances />;
    case "TPRM_OVERVIEW":
      return <TprmOverview />;
    case "DORA_READINESS":
      return <DoraReadiness />;
    case "CONTROL_EFFECTIVENESS":
      return <ControlEffectiveness />;
    case "QUALITY_REVIEW":
      return <QualityReviews />;
    case "TREND":
      return <Trend />;
    case "DECISION_PAPER":
      return <DecisionPaper />;
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
}: {
  counts: Record<string, number>;
  labelOf: (key: string) => string;
  variantOf?: (key: string) => "low" | "medium" | "high" | "critical" | "secondary";
}) {
  const entries = Object.entries(counts).filter(([, n]) => n > 0);
  if (entries.length === 0)
    return <p className="text-sm text-muted-foreground">Keine Daten vorhanden.</p>;
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

function RiskRowsTable({ rows, emptyMessage }: { rows: RiskRow[]; emptyMessage: string }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Risiko-ID</TH>
          <TH>Titel</TH>
          <TH>Kategorie</TH>
          <TH>Owner</TH>
          <TH>Inherent</TH>
          <TH>Residual</TH>
          <TH>Klasse</TH>
          <TH>Status</TH>
          <TH>Strategie</TH>
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

async function ExecutiveSummary() {
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
        <h2 className="mb-3 text-sm font-semibold">Kennzahlen</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Offene Risiken" value={open.length} />
          <Kpi label="High / Critical (Residual)" value={highCritical.length} />
          <Kpi label="Über Risikoappetit" value={open.filter((r) => r.aboveAppetite).length} />
          <Kpi label="Überfällige Reviews" value={rows.filter((r) => r.reviewOverdue).length} />
          <Kpi label="Offene Maßnahmen" value={openActions} />
          <Kpi label="Überfällige Maßnahmen" value={overdueActions} />
          <Kpi label="Offene Akzeptanzanträge" value={openAcceptances} />
          <Kpi label="Unwirksame Kontrollen" value={ineffectiveControls} />
          <Kpi label="Kritische Drittparteien" value={criticalTps} />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold">Top-10-Risiken nach Residual-Score</h2>
        <RiskRowsTable rows={topByResidual(rows)} emptyMessage="Keine bewerteten Risiken." />
      </section>
    </div>
  );
}

async function TopRisks() {
  const rows = await getRiskRows();
  return (
    <RiskRowsTable rows={topByResidual(rows)} emptyMessage="Keine bewerteten Risiken vorhanden." />
  );
}

async function AboveAppetite() {
  const rows = await getRiskRows({ aboveAppetite: true });
  return (
    <RiskRowsTable
      rows={rows}
      emptyMessage="Kein Risiko überschreitet derzeit den Risikoappetit."
    />
  );
}

async function OverdueActions() {
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
          <TH>Maßnahmen-ID</TH>
          <TH>Titel</TH>
          <TH>Owner</TH>
          <TH>Fälligkeit</TH>
          <TH>Verzugstage</TH>
          <TH>Eskalationsstufe</TH>
          <TH>Risiko</TH>
        </TR>
      </THead>
      <TBody>
        {actions.length === 0 ? (
          <TR>
            <TD colSpan={7} className="h-16 text-center text-muted-foreground">
              Keine überfälligen Maßnahmen.
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

async function Acceptances() {
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
          <TH>Risiko</TH>
          <TH>Status</TH>
          <TH>Antragsteller</TH>
          <TH>Genehmiger</TH>
          <TH>Befristet bis</TH>
          <TH>Kompensierende Kontrollen</TH>
        </TR>
      </THead>
      <TBody>
        {acceptances.length === 0 ? (
          <TR>
            <TD colSpan={6} className="h-16 text-center text-muted-foreground">
              Keine Risikoakzeptanzen vorhanden.
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

async function TprmOverview() {
  const tps = await db.thirdParty.findMany({
    include: { exitStrategy: true },
    orderBy: { tpId: "asc" },
  });
  const critical = tps.filter((t) => t.criticality === "CRITICAL").length;
  const concentration = tps.filter((t) => t.concentrationRisk).length;
  const missingExit = tps.filter(
    (t) =>
      t.supportsCriticalFunction && (!t.exitStrategy || t.exitStrategy.status === "MISSING"),
  ).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi label="Kritische Drittparteien" value={critical} />
        <Kpi label="Konzentrationsrisiken" value={concentration} />
        <Kpi label="Fehlende Exit-Strategien (kritische Funktion)" value={missingExit} />
      </div>
      <Table>
        <THead>
          <TR>
            <TH>TP-ID</TH>
            <TH>Name</TH>
            <TH>Status</TH>
            <TH>Kritikalität</TH>
            <TH>Residual</TH>
            <TH>Due Diligence</TH>
            <TH>Nächstes Review</TH>
            <TH>Konzentration</TH>
            <TH>Exit-Status</TH>
          </TR>
        </THead>
        <TBody>
          {tps.length === 0 ? (
            <TR>
              <TD colSpan={9} className="h-16 text-center text-muted-foreground">
                Keine Drittparteien vorhanden.
              </TD>
            </TR>
          ) : (
            tps.map((t) => (
              <TR key={t.id}>
                <TD className="whitespace-nowrap font-medium">{t.tpId}</TD>
                <TD>{t.name}</TD>
                <TD className="whitespace-nowrap">
                  {TP_STATUS[t.status as keyof typeof TP_STATUS] ?? t.status}
                </TD>
                <TD className="whitespace-nowrap">{t.criticality}</TD>
                <TD className="tabular-nums">{t.residualRiskScore ?? "–"}</TD>
                <TD className="whitespace-nowrap">{t.dueDiligenceStatus}</TD>
                <TD className="whitespace-nowrap">{formatDate(t.nextReviewDate)}</TD>
                <TD>{t.concentrationRisk ? "ja" : "nein"}</TD>
                <TD className="whitespace-nowrap">{t.exitStrategy?.status ?? "MISSING"}</TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}

async function DoraReadiness() {
  const mappings = await db.complianceMapping.findMany({
    where: { requirement: { framework: { in: ["DORA", "DORA_RTS"] } } },
    include: { requirement: true, owner: true },
    orderBy: { requirement: { refId: "asc" } },
  });
  const counts: Record<string, number> = {};
  for (const m of mappings) counts[m.status] = (counts[m.status] ?? 0) + 1;
  return (
    <div className="space-y-6">
      <ComplianceDisclaimer />
      <section>
        <h2 className="mb-3 text-sm font-semibold">Statusverteilung</h2>
        <CountBadges
          counts={counts}
          labelOf={complianceStatusLabel}
          variantOf={complianceStatusVariant}
        />
      </section>
      <Table>
        <THead>
          <TR>
            <TH>Ref-ID</TH>
            <TH>Framework</TH>
            <TH>Anforderung</TH>
            <TH>Status</TH>
            <TH>Begründung</TH>
            <TH>Owner</TH>
            <TH>Nächstes Review</TH>
          </TR>
        </THead>
        <TBody>
          {mappings.length === 0 ? (
            <TR>
              <TD colSpan={7} className="h-16 text-center text-muted-foreground">
                Keine DORA-Mappings vorhanden.
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

async function ControlEffectiveness() {
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
    operatingCounts[c.operatingEffectiveness] = (operatingCounts[c.operatingEffectiveness] ?? 0) + 1;
  }
  const ratingLabel = (k: string) =>
    EFFECTIVENESS_RATING[k as keyof typeof EFFECTIVENESS_RATING] ?? k;
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="mb-2 text-sm font-semibold">Verteilung Design-Wirksamkeit</h2>
          <CountBadges counts={designCounts} labelOf={ratingLabel} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Verteilung operative Wirksamkeit</h2>
          <CountBadges counts={operatingCounts} labelOf={ratingLabel} />
        </div>
      </section>
      <Table>
        <THead>
          <TR>
            <TH>Kontroll-ID</TH>
            <TH>Name</TH>
            <TH>Owner</TH>
            <TH>Design-Wirksamkeit</TH>
            <TH>Operative Wirksamkeit</TH>
            <TH>Letzter Test</TH>
            <TH>Nächster Test</TH>
          </TR>
        </THead>
        <TBody>
          {controls.length === 0 ? (
            <TR>
              <TD colSpan={7} className="h-16 text-center text-muted-foreground">
                Keine Kontrollen vorhanden.
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

async function QualityReviews() {
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
        <Kpi label="Quality Reviews gesamt" value={reviews.length} />
        <Kpi label="Mit Score abgeschlossen" value={scored.length} />
        <Kpi label="Durchschnittsscore" value={avg !== null ? `${avg} %` : "–"} />
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Risiko</TH>
            <TH>Reviewer</TH>
            <TH>Ergebnis</TH>
            <TH>Score</TH>
            <TH>Datum</TH>
          </TR>
        </THead>
        <TBody>
          {reviews.length === 0 ? (
            <TR>
              <TD colSpan={5} className="h-16 text-center text-muted-foreground">
                Keine Quality Reviews vorhanden.
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

async function Trend() {
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
          <TH>Monat</TH>
          <TH>Anzahl Bewertungen</TH>
          <TH>Ø Residual-Score</TH>
        </TR>
      </THead>
      <TBody>
        {months.map((m) => {
          const b = buckets.get(m)!;
          return (
            <TR key={m}>
              <TD className="whitespace-nowrap font-medium">{m}</TD>
              <TD className="tabular-nums">{b.count}</TD>
              <TD className="tabular-nums">
                {b.count > 0 ? (b.sum / b.count).toFixed(1) : "–"}
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}

function DecisionLine() {
  return (
    <p className="mt-3 border-b border-dashed pb-1 text-sm">
      Entscheidung: ______________________________________________
    </p>
  );
}

async function DecisionPaper() {
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
        <h2 className="mb-3 text-sm font-semibold">1. Offene Akzeptanzanträge</h2>
        <Table>
          <THead>
            <TR>
              <TH>Risiko</TH>
              <TH>Antragsteller</TH>
              <TH>Status</TH>
              <TH>Beantragt am</TH>
              <TH>Begründung</TH>
            </TR>
          </THead>
          <TBody>
            {openAcceptances.length === 0 ? (
              <TR>
                <TD colSpan={5} className="h-14 text-center text-muted-foreground">
                  Keine offenen Akzeptanzanträge.
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
        <DecisionLine />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">
          2. Risiken über Risikoappetit ohne aktive Behandlung
        </h2>
        <RiskRowsTable
          rows={untreated}
          emptyMessage="Keine Risiken über Appetit ohne aktive Behandlung."
        />
        <DecisionLine />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">3. Eskalationen (Stufe ≥ 2)</h2>
        <Table>
          <THead>
            <TR>
              <TH>Maßnahmen-ID</TH>
              <TH>Titel</TH>
              <TH>Owner</TH>
              <TH>Fälligkeit</TH>
              <TH>Eskalationsstufe</TH>
              <TH>Risiko</TH>
            </TR>
          </THead>
          <TBody>
            {escalations.length === 0 ? (
              <TR>
                <TD colSpan={6} className="h-14 text-center text-muted-foreground">
                  Keine Eskalationen der Stufe 2 oder höher.
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
        <DecisionLine />
      </section>
    </div>
  );
}
