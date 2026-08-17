import Link from "next/link";
import { AlertOctagon, ArrowRight } from "lucide-react";
import { requirePermission } from "@/lib/authz";
import { getCifChapterHeatmap, getDoraOverview } from "@/features/dora/queries";
import { MaturityTrendChart } from "@/features/dora/charts";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { classify } from "@/lib/domain/risk-calc";
import { getRiskThresholds } from "@/lib/settings";
import { COMPLIANCE_DISCLAIMER } from "@/lib/domain/enums";
import type { TrafficLight } from "@/lib/domain/dora-scoring";
import { cn } from "@/lib/utils";

export const metadata = { title: "DORA Compliance" };
export const dynamic = "force-dynamic";

const LIGHT_LABEL: Record<TrafficLight, string> = { GREEN: "GRÜN", YELLOW: "GELB", RED: "ROT" };
const LIGHT_CLASS: Record<TrafficLight, string> = {
  GREEN: "bg-risk-low/15 text-risk-low border-risk-low/40",
  YELLOW: "bg-risk-medium/15 text-risk-medium border-risk-medium/40",
  RED: "bg-risk-critical/15 text-risk-critical border-risk-critical/40",
};

export default async function DoraDashboardPage() {
  await requirePermission("compliance:read");
  const [o, heatmap, thresholds] = await Promise.all([
    getDoraOverview(),
    getCifChapterHeatmap(),
    getRiskThresholds(),
  ]);
  const openFindings = Object.values(o.openFindingsBySeverity).reduce((a, b) => a + b, 0);

  return (
    <div>
      <PageHeader
        title="DORA Compliance"
        description="Anforderungskatalog FRWK-DORA-001: 133 prüfbare Anforderungen, Reifegrad-Scoring mit Knockout-Übersteuerung und Nachweissperre, Findings/CAPA und Meldefristen-Monitor."
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "DORA Compliance" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/dora/requirements" className="text-sm text-primary hover:underline">
              Katalog
            </Link>
            <Link href="/dora/findings" className="text-sm text-primary hover:underline">
              Findings
            </Link>
            <Link href="/dora/incidents" className="text-sm text-primary hover:underline">
              Vorfälle
            </Link>
            <Link href="/dora-knowledge" className="text-sm text-primary hover:underline">
              Wissensbasis
            </Link>
          </div>
        }
      />

      {/* Kopfzeile: Index und Knockouts gleichrangig (FRWK-DORA-001, Kap. 15.2) */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <div className={cn("rounded-lg border-2 p-4", LIGHT_CLASS[o.index.status])}>
          <p className="text-[11px] font-medium">DORA Resilience Index</p>
          <p className="text-3xl font-bold">{o.index.indexPercent} %</p>
          <p className="text-xs font-semibold">
            Status: {LIGHT_LABEL[o.index.status]}
            {o.index.status === "RED" && o.index.totalOpenKnockouts > 0
              ? " (Knockout-Übersteuerung)"
              : ""}
          </p>
        </div>
        <Link
          href="/dora/requirements?openKnockouts=1"
          className={cn(
            "rounded-lg border-2 p-4 transition-colors hover:opacity-90",
            o.index.totalOpenKnockouts > 0 ? LIGHT_CLASS.RED : LIGHT_CLASS.GREEN,
          )}
        >
          <p className="flex items-center gap-1 text-[11px] font-medium">
            <AlertOctagon className="h-3.5 w-3.5" aria-hidden /> Offene Knockouts
          </p>
          <p className="text-3xl font-bold">{o.index.totalOpenKnockouts}</p>
          <p className="text-xs">KO-Anforderung mit wirksamem Reifegrad &lt; 3</p>
        </Link>
        <Kpi label="Überfällige CAPA" value={String(o.overdueCapaCount)} href="/dora/findings?overdue=1" warn={o.overdueCapaCount > 0} />
        <Kpi label="Offene Findings" value={String(openFindings)} href="/dora/findings?open=1" warn={(o.openFindingsBySeverity["CRITICAL"] ?? 0) > 0} sub={`davon ${o.openFindingsBySeverity["CRITICAL"] ?? 0} kritisch`} />
        <Kpi label="Offene Vorfälle" value={String(o.incidentSummary.open)} href="/dora/incidents?open=1" sub={`davon ${o.incidentSummary.major} schwerwiegend`} warn={o.incidentSummary.major > 0} />
        <Kpi label="Überfällige Meldungen" value={String(o.incidentSummary.overdueReports)} href="/dora/incidents" warn={o.incidentSummary.overdueReports > 0} />
      </div>

      {/* Kapitelampel */}
      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {o.chapters.map((c) => (
          <Link
            key={c.key}
            href={`/dora/requirements?chapter=${c.key}`}
            className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold">
                Kapitel {c.roman}
                <span className="block font-normal text-muted-foreground">{c.articleRange} · Gewicht {c.weightPercent} %</span>
              </p>
              <span className={cn("rounded-md border px-1.5 py-0.5 text-[11px] font-semibold", LIGHT_CLASS[c.result.status])}>
                {LIGHT_LABEL[c.result.status]}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[13px] leading-snug">{c.title}</p>
            <p className="mt-2 text-2xl font-semibold">{c.result.scorePercent} %</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div
                className={cn(
                  "h-full rounded-full",
                  c.result.status === "GREEN" ? "bg-risk-low" : c.result.status === "YELLOW" ? "bg-risk-medium" : "bg-risk-critical",
                )}
                style={{ width: `${Math.min(100, c.result.scorePercent)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {c.result.openKnockouts.length > 0
                ? `⚠ ${c.result.openKnockouts.length} Knockout: ${c.result.openKnockouts.slice(0, 2).join(", ")}${c.result.openKnockouts.length > 2 ? " …" : ""}`
                : `${c.result.assessedCount}/${c.result.totalCount} bewertet`}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reifegradverlauf</CardTitle>
            <CardDescription>Monatsmittel der Reifegrad-Bewertungen (Skala 0–5, letzte 12 Monate)</CardDescription>
          </CardHeader>
          <CardContent>
            <MaturityTrendChart data={o.maturityTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kennzahlen (KPI/KRI, Tabelle 25)</CardTitle>
            <CardDescription>Aus den Live-Daten des Cockpits berechnet – Ist gegen Zielwert</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {o.kpis.map((k) => (
                <li key={k.id} className="rounded-md border p-2">
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-mono">{k.id}</span> · Ziel {k.target}
                  </p>
                  <p className="flex items-center justify-between gap-2 text-sm font-semibold">
                    <span>{k.label}</span>
                    <span
                      className={cn(
                        k.ok === true && "text-risk-low",
                        k.ok === false && "text-risk-critical",
                      )}
                    >
                      {k.value} {k.ok === true ? "✓" : k.ok === false ? "✗" : ""}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Kapitel × kritische Funktionen */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Gefährdungslage je kritischer Funktion</CardTitle>
          <CardDescription>
            Offene Risiken mit regulatorischem Bezug zum DORA-Kapitel, je kritischer/wichtiger
            Funktion – Zellfarbe = höchste Residual-Klasse, Zahl = Anzahl Risiken. Klick öffnet das
            gefilterte Risk Register.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="p-1.5 text-left font-medium text-muted-foreground">Funktion</th>
                {heatmap.chapters.map((c) => (
                  <th key={c} className="p-1.5 font-medium" scope="col">
                    Kap. {["K2", "K3", "K4", "K5", "K6"].indexOf(c) > -1 ? ["II", "III", "IV", "V", "VI"][["K2", "K3", "K4", "K5", "K6"].indexOf(c)] : c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmap.cifs.map((cif) => (
                <tr key={cif.id}>
                  <th scope="row" className="p-1.5 text-left font-medium">
                    {cif.name}
                    {cif.isCritical ? <span className="ml-1 text-[10px] text-muted-foreground">(kritisch)</span> : null}
                  </th>
                  {heatmap.chapters.map((c) => {
                    const cell = heatmap.cells[cif.id]?.[c] ?? { count: 0, maxResidual: null };
                    const klass = cell.maxResidual !== null ? classify(cell.maxResidual, thresholds) : null;
                    const bg =
                      klass === "CRITICAL"
                        ? "bg-risk-critical/25"
                        : klass === "HIGH"
                          ? "bg-risk-high/25"
                          : klass === "MEDIUM"
                            ? "bg-risk-medium/20"
                            : klass === "LOW"
                              ? "bg-risk-low/20"
                              : "bg-muted/40";
                    return (
                      <td key={c} className="p-0.5">
                        <div
                          className={cn("flex h-9 items-center justify-center rounded-md border font-semibold", bg)}
                          title={
                            cell.count
                              ? `${cell.count} offene Risiken · höchste Residual-Klasse: ${klass}`
                              : "keine offenen Risiken mit diesem Kapitelbezug"
                          }
                        >
                          {cell.count || ""}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm border bg-risk-low/30" aria-hidden /> Low</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm border bg-risk-medium/30" aria-hidden /> Medium</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm border bg-risk-high/30" aria-hidden /> High</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm border bg-risk-critical/30" aria-hidden /> Critical</span>
            <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm border bg-muted/60" aria-hidden /> keine</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/dora/requirements" className="inline-flex items-center gap-1 text-primary hover:underline">
          Zum Anforderungskatalog <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link href="/reports/DORA_READINESS" className="inline-flex items-center gap-1 text-primary hover:underline">
          DORA-Readiness-Report <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Badge variant="outline">Methodik: FRWK-DORA-001 Kap. 11 – Gewichte MUSS 3 / SOLL 2 / KANN 1 · Ampel 85/60 · Nachweissperre ≤ 2</Badge>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">{COMPLIANCE_DISCLAIMER}</p>
    </div>
  );
}

function Kpi({
  label,
  value,
  href,
  warn,
  sub,
}: {
  label: string;
  value: string;
  href: string;
  warn?: boolean;
  sub?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg border bg-card p-4 transition-colors hover:bg-accent",
        warn && "border-risk-high/50",
      )}
    >
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
      <p className={cn("text-3xl font-bold", warn && "text-risk-high")}>{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </Link>
  );
}
