import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { hasPermission, requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/utils";
import { REPORT_DEFS, getReportDef } from "@/features/reports/report-defs";
import { getLocale } from "@/lib/i18n/server";
import { REPORTS_MESSAGES } from "@/lib/i18n/messages/reports";
import { SnapshotButton } from "@/features/reports/snapshot-button";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const CSV_EXPORTS = [
  { type: "risks", labelKey: "risks" },
  { type: "actions", labelKey: "actions" },
  { type: "controls", labelKey: "controls" },
  { type: "third-parties", labelKey: "thirdParties" },
  { type: "compliance", labelKey: "compliance" },
] as const;

export default async function ReportsPage() {
  const locale = await getLocale();
  const t = REPORTS_MESSAGES[locale];
  const user = await requirePermission("report:read");
  const canExport = hasPermission(user, "export");
  const snapshots = await db.report.findMany({
    include: { createdBy: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const periodSnapshots = await db.periodSnapshot.findMany({
    include: { createdBy: { select: { email: true } } },
    orderBy: { period: "desc" },
    take: 24,
  });
  const canCreateSnapshot = hasPermission(user, "report:create");

  return (
    <div>
      <PageHeader
        title={t.list.title}
        description={t.list.description}
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Reports" }]}
      />

      <h2 className="mb-3 text-sm font-semibold">{t.list.sectionTypes}</h2>
      <div className="mb-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {REPORT_DEFS.filter((d) => hasPermission(user, d.permission)).map((d) => (
          <Link key={d.key} href={`/reports/${d.key}`} className="group">
            <Card className="h-full transition-colors group-hover:bg-accent/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {t.defs[d.key].title}
                </CardTitle>
                <CardDescription>{t.defs[d.key].description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {canExport ? (
        <>
          <h2 className="mb-3 text-sm font-semibold">{t.list.sectionCsv}</h2>
          <div className="mb-8 flex flex-wrap gap-2">
            {CSV_EXPORTS.map((e) => (
              <a
                key={e.type}
                href={`/api/export?type=${e.type}&format=csv`}
                className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-sm hover:bg-accent"
              >
                <Download className="h-4 w-4 text-muted-foreground" aria-hidden />
                {t.list.csv[e.labelKey]}
              </a>
            ))}
          </div>
        </>
      ) : null}

      {/* Monatsabschluss-Snapshots (Review v3, P1-06 / RB-17) */}
      <h2 className="mb-3 text-sm font-semibold">
        {locale === "de" ? "Monatsabschluss-Snapshots (RB-17)" : "Month-end snapshots (RB-17)"}
      </h2>
      <div className="mb-2">
        {canCreateSnapshot ? <SnapshotButton locale={locale} /> : null}
      </div>
      <div className="mb-8 overflow-x-auto rounded-lg border">
        <Table>
          <THead>
            <TR>
              <TH>{locale === "de" ? "Periode" : "Period"}</TH>
              <TH>DORA-Index</TH>
              <TH>{locale === "de" ? "Offene Knockouts" : "Open knockouts"}</TH>
              <TH>{locale === "de" ? "Risiken" : "Risks"}</TH>
              <TH>{locale === "de" ? "Register (Datensätze / SHA-256)" : "Register (records / SHA-256)"}</TH>
              <TH>{locale === "de" ? "Erstellt" : "Created"}</TH>
            </TR>
          </THead>
          <TBody>
            {periodSnapshots.length === 0 ? (
              <TR>
                <TD colSpan={6} className="h-16 text-center text-muted-foreground">
                  {locale === "de"
                    ? "Noch keine Snapshots — Monatsabschluss erzeugt eingefrorene Kennzahlen als Trendbasis."
                    : "No snapshots yet — the month-end close freezes KPIs as the trend baseline."}
                </TD>
              </TR>
            ) : (
              periodSnapshots.map((s) => (
                <TR key={s.id}>
                  <TD className="font-medium tabular-nums">{s.period}</TD>
                  <TD className="tabular-nums">
                    {s.doraIndexPercent != null ? `${s.doraIndexPercent} %` : "–"}
                  </TD>
                  <TD className="tabular-nums">{s.openKnockouts}</TD>
                  <TD className="tabular-nums">
                    {(JSON.parse(s.riskList) as unknown[]).length}
                  </TD>
                  <TD className="tabular-nums">
                    {s.registerRecordCount} ·{" "}
                    <span className="font-mono text-xs">{s.registerChecksum.slice(0, 12)}…</span>
                  </TD>
                  <TD className="whitespace-nowrap text-xs">
                    {formatDateTime(s.createdAt)} · {s.createdBy.email}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </div>

      <h2 className="mb-3 text-sm font-semibold">{t.list.sectionGenerated}</h2>
      <Table>
        <THead>
          <TR>
            <TH>{t.list.table.type}</TH>
            <TH>{t.list.table.title}</TH>
            <TH>{t.list.table.effectiveDate}</TH>
            <TH>{t.list.table.createdBy}</TH>
            <TH>{t.list.table.createdAt}</TH>
          </TR>
        </THead>
        <TBody>
          {snapshots.length === 0 ? (
            <TR>
              <TD colSpan={5} className="h-20 text-center text-muted-foreground">
                {t.list.empty}
              </TD>
            </TR>
          ) : (
            snapshots.map((r) => {
              const def = getReportDef(r.reportType);
              return (
                <TR key={r.id}>
                  <TD className="whitespace-nowrap">
                    <Link href={`/reports/${r.reportType}`} className="hover:underline">
                      {def ? t.defs[def.key].title : r.reportType}
                    </Link>
                  </TD>
                  <TD>{r.title}</TD>
                  <TD className="whitespace-nowrap">{formatDate(r.effectiveDate)}</TD>
                  <TD className="whitespace-nowrap">{r.createdBy.name}</TD>
                  <TD className="whitespace-nowrap">{formatDateTime(r.createdAt)}</TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </div>
  );
}
