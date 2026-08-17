import Link from "next/link";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getDashboardData } from "@/features/dashboard/queries";
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

      {/* KPI-Kacheln */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <KpiTile label={t.dashboard.kpi.openRisks} value={k.openRisks} href="/risks" />
        <KpiTile
          label={t.dashboard.kpi.highCritical}
          value={k.highCritical}
          href="/risks?klass=CRITICAL"
          warn={k.highCritical > 0}
        />
        <KpiTile
          label={t.dashboard.kpi.aboveAppetite}
          value={k.aboveAppetite}
          href="/risks?aboveAppetite=1"
          warn={k.aboveAppetite > 0}
        />
        <KpiTile
          label={t.dashboard.kpi.overdueReviews}
          value={k.overdueReviews}
          href="/risks?overdueReview=1"
          warn={k.overdueReviews > 0}
        />
        <KpiTile label={t.dashboard.kpi.openActions} value={k.openActions} href="/actions" />
        <KpiTile
          label={t.dashboard.kpi.overdueActions}
          value={k.overdueActions}
          href="/actions?overdue=1"
          warn={k.overdueActions > 0}
        />
        <KpiTile
          label={t.dashboard.kpi.openAcceptances}
          value={k.openAcceptances}
          href="/reports/ACCEPTANCES"
          warn={k.openAcceptances > 0}
        />
        <KpiTile
          label={t.dashboard.kpi.weakControls}
          value={k.weakControls}
          href="/controls?weak=1"
          warn={k.weakControls > 0}
        />
        <KpiTile
          label={t.dashboard.kpi.criticalThirdParties}
          value={k.criticalThirdParties}
          href="/third-parties?critical=1"
        />
        <KpiTile
          label={t.dashboard.kpi.expiringContracts}
          value={k.expiringContracts}
          href="/third-parties?expiringContracts=1"
          warn={k.expiringContracts > 0}
        />
        <KpiTile
          label={t.dashboard.kpi.risksWithoutOwner}
          value={k.risksWithoutOwner}
          href="/risks?noOwner=1"
          warn={k.risksWithoutOwner > 0}
        />
        <KpiTile
          label={t.dashboard.kpi.risksWithoutAssessment}
          value={k.risksWithoutAssessment}
          href="/risks?noAssessment=1"
          warn={k.risksWithoutAssessment > 0}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.cards.matrixTitle}</CardTitle>
            <CardDescription>{t.dashboard.cards.matrixDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <RiskHeatmap matrix={data.heatmap} thresholds={thresholds} />
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
