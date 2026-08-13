import Link from "next/link";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getDashboardData } from "@/features/dashboard/queries";
import { getRiskThresholds } from "@/lib/settings";
import { RiskHeatmap } from "@/components/heatmap";
import { CountBarChart, ResidualTrendChart } from "@/features/dashboard/charts";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ACTION_STATUS, RISK_CLASS, type ActionStatus, type RiskClass } from "@/lib/domain/enums";
import { cn } from "@/lib/utils";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

interface Search {
  category?: string;
  ouId?: string;
  locationId?: string;
}

export default async function OverviewPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requirePermission("risk:read");
  const sp = await searchParams;
  const [data, thresholds, categories, ous, locations] = await Promise.all([
    getDashboardData({
      category: sp.category || undefined,
      ouId: sp.ouId || undefined,
      locationId: sp.locationId || undefined,
    }),
    getRiskThresholds(),
    db.riskCategory.findMany({ orderBy: { name: "asc" } }),
    db.organizationalUnit.findMany({ orderBy: { name: "asc" } }),
    db.location.findMany({ orderBy: { name: "asc" } }),
  ]);
  const k = data.kpi;

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Lage der ICT- und Informationssicherheitsrisiken – alle Kennzahlen sind anklickbar und führen zur gefilterten Detailansicht."
      />

      <form method="GET" className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
        <div className="min-w-44">
          <Label htmlFor="of-cat">Risikokategorie</Label>
          <Select id="of-cat" name="category" defaultValue={sp.category ?? ""}>
            <option value="">Alle</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-44">
          <Label htmlFor="of-ou">Gesellschaft / Bereich</Label>
          <Select id="of-ou" name="ouId" defaultValue={sp.ouId ?? ""}>
            <option value="">Alle</option>
            {ous.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-40">
          <Label htmlFor="of-loc">Standort</Label>
          <Select id="of-loc" name="locationId" defaultValue={sp.locationId ?? ""}>
            <option value="">Alle</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filtern
        </Button>
        <Link href="/overview" className="text-xs text-muted-foreground hover:underline">
          Zurücksetzen
        </Link>
      </form>

      {/* KPI-Kacheln */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <KpiTile label="Offene Risiken" value={k.openRisks} href="/risks" />
        <KpiTile label="High / Critical (Residual)" value={k.highCritical} href="/risks?klass=CRITICAL" warn={k.highCritical > 0} />
        <KpiTile label="Über Risikoappetit" value={k.aboveAppetite} href="/risks?aboveAppetite=1" warn={k.aboveAppetite > 0} />
        <KpiTile label="Überfällige Risk-Reviews" value={k.overdueReviews} href="/risks?overdueReview=1" warn={k.overdueReviews > 0} />
        <KpiTile label="Offene Maßnahmen" value={k.openActions} href="/actions" />
        <KpiTile label="Überfällige Maßnahmen" value={k.overdueActions} href="/actions?overdue=1" warn={k.overdueActions > 0} />
        <KpiTile label="Offene Risikoakzeptanzen" value={k.openAcceptances} href="/reports/ACCEPTANCES" warn={k.openAcceptances > 0} />
        <KpiTile label="Kontrollen mit Schwächen" value={k.weakControls} href="/controls?weak=1" warn={k.weakControls > 0} />
        <KpiTile label="Kritische Drittparteien" value={k.criticalThirdParties} href="/third-parties?critical=1" />
        <KpiTile label="Auslaufende Verträge (180 T.)" value={k.expiringContracts} href="/third-parties?expiringContracts=1" warn={k.expiringContracts > 0} />
        <KpiTile label="Risiken ohne Owner" value={k.risksWithoutOwner} href="/risks?noOwner=1" warn={k.risksWithoutOwner > 0} />
        <KpiTile label="Ohne aktuelle Bewertung" value={k.risksWithoutAssessment} href="/risks?noAssessment=1" warn={k.risksWithoutAssessment > 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risikomatrix 5 × 5 (aktuelle Bewertungen)</CardTitle>
            <CardDescription>Zellwert = Anzahl offener Risiken · kleiner Wert = Zell-Score</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskHeatmap matrix={data.heatmap} thresholds={thresholds} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entwicklung Residual Risk (12 Monate)</CardTitle>
            <CardDescription>Monatliches Mittel des Residual-Scores aller Bewertungen</CardDescription>
          </CardHeader>
          <CardContent>
            <ResidualTrendChart data={data.trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risiken je Kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            <CountBarChart data={data.byCategory.map((c) => ({ name: c.name, count: c.count }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risiken je Geschäftsbereich</CardTitle>
          </CardHeader>
          <CardContent>
            <CountBarChart data={data.byOu} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maßnahmenstatus</CardTitle>
            <CardDescription>Statusverteilung aller Maßnahmen (Ampel + Text)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.actionStatus.map((s) => {
              const overdueish = s.status === "BLOCKED";
              const done = ["COMPLETED", "CLOSED"].includes(s.status);
              return (
                <Link key={s.status} href={`/actions?status=${s.status}`}>
                  <Badge variant={done ? "low" : overdueish ? "high" : "secondary"} className="text-sm">
                    {ACTION_STATUS[s.status as ActionStatus] ?? s.status}: {s.count}
                  </Badge>
                </Link>
              );
            })}
            {k.overdueActions > 0 ? (
              <Link href="/actions?overdue=1">
                <Badge variant="critical" className="text-sm">
                  Überfällig: {k.overdueActions}
                </Badge>
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risiken je Drittpartei (Top 8)</CardTitle>
          </CardHeader>
          <CardContent>
            <CountBarChart data={data.byThirdParty} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Top-10-Risiken nach Residual Risk</CardTitle>
          <CardDescription>Entscheidungsrelevante Risiken – Klick öffnet die Detailansicht</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Risk ID</TH>
                <TH>Titel</TH>
                <TH>Kategorie</TH>
                <TH>Risk Owner</TH>
                <TH>Residual</TH>
                <TH>Appetit</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {data.top10.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/risks/${r.id}`} className="font-mono text-xs text-primary hover:underline">
                      {r.riskId}
                    </Link>
                  </TD>
                  <TD className="max-w-[340px] truncate">{r.title}</TD>
                  <TD className="text-xs">{r.category}</TD>
                  <TD className="text-xs">{r.ownerName ?? "–"}</TD>
                  <TD>
                    <Badge variant={riskClassVariant(r.residualClass ?? "")}>
                      {r.residualScore} · {RISK_CLASS[r.residualClass as RiskClass] ?? "?"}
                    </Badge>
                  </TD>
                  <TD className={cn("text-xs", r.aboveAppetite && "font-medium text-risk-critical")}>
                    {r.appetiteThreshold}
                    {r.aboveAppetite ? " (überschritten)" : ""}
                  </TD>
                  <TD className="text-xs">{r.status}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Entscheidungspunkte für das Management: offene Risikoakzeptanzen, Risiken über dem
        Risikoappetit und Eskalationen ab Stufe 2 – siehe{" "}
        <Link href="/reports/DECISION_PAPER" className="text-primary hover:underline">
          Entscheidungsvorlage
        </Link>
        .
      </p>
    </div>
  );
}

function KpiTile({
  label,
  value,
  href,
  warn,
}: {
  label: string;
  value: number;
  href: string;
  warn?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg border bg-card p-3 transition-colors hover:bg-accent",
        warn && "border-risk-high/50",
      )}
    >
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", warn && "text-risk-high")}>{value}</p>
    </Link>
  );
}
