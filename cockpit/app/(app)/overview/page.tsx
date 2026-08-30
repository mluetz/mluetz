import Link from "next/link";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getDashboardData } from "@/features/dashboard/queries";
import { getDoraOverview } from "@/features/dora/queries";
import { getRiskThresholds } from "@/lib/settings";
import { getLocale } from "@/lib/i18n/server";
import { CORE_MESSAGES } from "@/lib/i18n/messages/core";
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
  const locale = await getLocale();
  const t = CORE_MESSAGES[locale];
  const sp = await searchParams;
  const [data, thresholds, categories, ous, locations, dora, cifNoTestedExit, activeMv] =
    await Promise.all([
      getDashboardData({
        category: sp.category || undefined,
        ouId: sp.ouId || undefined,
        locationId: sp.locationId || undefined,
      }),
      getRiskThresholds(),
      db.riskCategory.findMany({ orderBy: { name: "asc" } }),
      db.organizationalUnit.findMany({ orderBy: { name: "asc" } }),
      db.location.findMany({ orderBy: { name: "asc" } }),
      getDoraOverview(),
      db.thirdParty.count({
        where: {
          criticalFunctions: { some: {} },
          OR: [{ exitStrategy: null }, { exitStrategy: { status: { not: "TESTED" } } }],
        },
      }),
      db.methodologyVersion.findFirst({ where: { status: "ACTIVE" } }),
    ]);
  const k = data.kpi;
  const de = locale === "de";
  const overdueReportsCount = dora.incidentSummary.overdueReports;

  return (
    <div>
      <PageHeader title={t.dashboard.title} description={t.dashboard.description} />

      <form
        method="GET"
        className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3"
      >
        <div className="min-w-44">
          <Label htmlFor="of-cat">{t.dashboard.filters.category}</Label>
          <Select id="of-cat" name="category" defaultValue={sp.category ?? ""}>
            <option value="">{t.common.all}</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-44">
          <Label htmlFor="of-ou">{t.dashboard.filters.ou}</Label>
          <Select id="of-ou" name="ouId" defaultValue={sp.ouId ?? ""}>
            <option value="">{t.common.all}</option>
            {ous.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-40">
          <Label htmlFor="of-loc">{t.dashboard.filters.location}</Label>
          <Select id="of-loc" name="locationId" defaultValue={sp.locationId ?? ""}>
            <option value="">{t.common.all}</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          {t.common.filter}
        </Button>
        <Link href="/overview" className="text-xs text-muted-foreground hover:underline">
          {t.common.reset}
        </Link>
      </form>

      {/* ===== Ebene 1 „Lage" (D-01/D-02): drei Kennzahlen, Farbe NUR bei
             Zielwertverletzung, jede mit „Ziel · Ist" ===== */}
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <LageTile
          label="DORA Resilience Index"
          value={`${dora.index.indexPercent} %`}
          target={de ? "Ziel ≥ 85 %" : "Target ≥ 85 %"}
          breach={dora.index.indexPercent < 85}
          href="/dora"
        />
        <LageTile
          label={de ? "Offene Knockouts" : "Open knockouts"}
          value={String(dora.index.totalOpenKnockouts)}
          target={`${de ? "Ziel" : "Target"} 0 · ${de ? "Ist" : "Actual"} ${dora.index.totalOpenKnockouts}`}
          breach={dora.index.totalOpenKnockouts > 0}
          href="/dora"
        />
        <LageTile
          label={de ? "Überfällige Meldungen" : "Overdue reports"}
          value={String(overdueReportsCount)}
          target={`${de ? "Ziel" : "Target"} 0 · ${de ? "Ist" : "Actual"} ${overdueReportsCount}`}
          breach={overdueReportsCount > 0}
          href="/dora/incidents"
        />
      </div>

      {/* ===== Ebene 2 „Handlungsbedarf": Zeilen mit Direktsprung ===== */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">
            {de ? "Handlungsbedarf" : "Action required"}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0 [&>a]:flex [&>a]:items-center [&>a]:justify-between [&>a]:gap-4 [&>a]:px-5 [&>a]:py-2.5">
          <ActionRow
            href="/actions?overdue=1"
            label={de ? "Überfällige Maßnahmen" : "Overdue actions"}
            count={k.overdueActions}
          />
          <ActionRow
            href="/risks?aboveAppetite=1"
            label={de ? "Risiken über Risikoappetit" : "Risks above appetite"}
            count={k.aboveAppetite}
          />
          <ActionRow
            href="/controls?weak=1"
            label={de ? "Kontrollen mit Schwächen" : "Controls with weaknesses"}
            count={k.weakControls}
          />
          <ActionRow
            href="/third-parties?untestedExit=1"
            label={
              de
                ? "CIF-Drittparteien ohne getesteten Exit-Plan"
                : "CIF third parties without tested exit plan"
            }
            count={cifNoTestedExit}
          />
          <ActionRow
            href="/reports/ACCEPTANCES"
            label={de ? "Offene Risikoakzeptanzen" : "Open risk acceptances"}
            count={k.openAcceptances}
            neutral
          />
        </CardContent>
      </Card>

      {/* ===== Ebene 3 „Datenqualität": kompakte neutrale Zeile ===== */}
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border bg-card px-4 py-2.5 text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-wide">
          {de ? "Datenqualität" : "Data quality"}
        </span>
        <DqItem
          href="/risks?noOwner=1"
          label={de ? "Risiken ohne Owner" : "risks without owner"}
          count={k.risksWithoutOwner}
        />
        <DqItem
          href="/risks?noAssessment=1"
          label={de ? "ohne aktuelle Bewertung" : "without current assessment"}
          count={k.risksWithoutAssessment}
        />
        <DqItem
          href="/risks?overdueReview=1"
          label={de ? "überfällige Reviews gesamt" : "overdue reviews (all types)"}
          count={k.overdueReviewsTotal}
        />
        <DqItem
          href="/third-parties?expiringContracts=1"
          label={de ? "auslaufende Verträge (180 T)" : "expiring contracts (180 d)"}
          count={k.expiringContracts}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.cards.matrixTitle}</CardTitle>
            <CardDescription>{t.dashboard.cards.matrixDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskHeatmap
              matrix={data.heatmap}
              matrixResidual={data.heatmapResidual}
              thresholds={thresholds}
              methodologyLabel={
                activeMv
                  ? de
                    ? `Methodikversion ${activeMv.version} (${activeMv.validFrom?.toISOString().slice(0, 10) ?? "–"})`
                    : `Methodology version ${activeMv.version} (${activeMv.validFrom?.toISOString().slice(0, 10) ?? "–"})`
                  : undefined
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.cards.trendTitle}</CardTitle>
            <CardDescription>{t.dashboard.cards.trendDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResidualTrendChart data={data.trend} locale={locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.cards.byCategory}</CardTitle>
          </CardHeader>
          <CardContent>
            <CountBarChart
              data={data.byCategory.map((c) => ({ name: c.name, count: c.count }))}
              locale={locale}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.cards.byOu}</CardTitle>
          </CardHeader>
          <CardContent>
            <CountBarChart data={data.byOu} locale={locale} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.cards.actionStatusTitle}</CardTitle>
            <CardDescription>{t.dashboard.cards.actionStatusDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.actionStatus.map((s) => {
              const overdueish = s.status === "BLOCKED";
              const done = ["COMPLETED", "CLOSED"].includes(s.status);
              return (
                <Link key={s.status} href={`/actions?status=${s.status}`}>
                  <Badge
                    variant={done ? "low" : overdueish ? "high" : "secondary"}
                    className="text-sm"
                  >
                    {ACTION_STATUS[s.status as ActionStatus] ?? s.status}: {s.count}
                  </Badge>
                </Link>
              );
            })}
            {k.overdueActions > 0 ? (
              <Link href="/actions?overdue=1">
                <Badge variant="critical" className="text-sm">
                  {t.dashboard.overdueBadge}: {k.overdueActions}
                </Badge>
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.cards.byThirdParty}</CardTitle>
          </CardHeader>
          <CardContent>
            <CountBarChart data={data.byThirdParty} locale={locale} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t.dashboard.cards.top10Title}</CardTitle>
          <CardDescription>{t.dashboard.cards.top10Description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.dashboard.top10.riskId}</TH>
                <TH>{t.dashboard.top10.title}</TH>
                <TH>{t.dashboard.top10.category}</TH>
                <TH>{t.dashboard.top10.owner}</TH>
                <TH>{t.dashboard.top10.residual}</TH>
                <TH>{t.dashboard.top10.appetite}</TH>
                <TH>{t.dashboard.top10.status}</TH>
              </TR>
            </THead>
            <TBody>
              {data.top10.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link
                      href={`/risks/${r.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
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
                  <TD
                    className={cn("text-xs", r.aboveAppetite && "font-medium text-risk-critical")}
                  >
                    {r.appetiteThreshold}
                    {r.aboveAppetite ? t.dashboard.top10.exceededSuffix : ""}
                  </TD>
                  <TD className="text-xs">{r.status}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        {t.dashboard.decisionNote}{" "}
        <Link href="/reports/DECISION_PAPER" className="text-primary hover:underline">
          {t.dashboard.decisionNoteLink}
        </Link>
        .
      </p>
    </div>
  );
}

/** Ebene-1-Kachel: Farbe ausschließlich bei Zielwertverletzung (D-02). */
function LageTile({
  label,
  value,
  target,
  breach,
  href,
}: {
  label: string;
  value: string;
  target: string;
  breach: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg border bg-card p-4 transition-colors hover:bg-accent",
        breach && "border-l-4 border-l-status-overdue",
      )}
    >
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-3xl font-semibold tabular-nums",
          breach && "text-status-overdue",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{target}</p>
    </Link>
  );
}

/** Ebene-2-Zeile: Handlungsposten mit Direktsprung. */
function ActionRow({
  href,
  label,
  count,
  neutral,
}: {
  href: string;
  label: string;
  count: number;
  neutral?: boolean;
}) {
  const alert = count > 0 && !neutral;
  return (
    <Link href={href} className="transition-colors hover:bg-accent/40">
      <span className="text-sm">{label}</span>
      <span
        className={cn(
          "inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-sm font-bold tabular-nums",
          alert
            ? "bg-status-overdue-bg text-status-overdue"
            : "bg-status-muted-bg text-status-muted",
        )}
      >
        {count}
      </span>
    </Link>
  );
}

/** Ebene-3-Eintrag: Datenqualität, bewusst neutral (D-01). */
function DqItem({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link href={href} className="hover:text-foreground hover:underline">
      <b className="text-foreground tabular-nums">{count}</b> {label}
    </Link>
  );
}
