import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { hasPermission, requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, formatDateTime } from "@/lib/utils";
import { REPORT_DEFS, getReportDef } from "@/features/reports/report-defs";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const CSV_EXPORTS: Array<{ type: string; label: string }> = [
  { type: "risks", label: "Risiken (CSV)" },
  { type: "actions", label: "Maßnahmen (CSV)" },
  { type: "controls", label: "Kontrollen (CSV)" },
  { type: "third-parties", label: "Drittparteien (CSV)" },
  { type: "compliance", label: "Compliance-Mappings (CSV)" },
];

export default async function ReportsPage() {
  const user = await requirePermission("report:read");
  const canExport = hasPermission(user, "export");
  const snapshots = await db.report.findMany({
    include: { createdBy: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Serverseitig generierte, druckoptimierte Berichte und CSV-Direktexporte"
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Reports" }]}
      />

      <h2 className="mb-3 text-sm font-semibold">Berichtstypen</h2>
      <div className="mb-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {REPORT_DEFS.filter((d) => hasPermission(user, d.permission)).map((d) => (
          <Link key={d.key} href={`/reports/${d.key}`} className="group">
            <Card className="h-full transition-colors group-hover:bg-accent/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {d.titel}
                </CardTitle>
                <CardDescription>{d.beschreibung}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {canExport ? (
        <>
          <h2 className="mb-3 text-sm font-semibold">Direkt-Exporte (CSV)</h2>
          <div className="mb-8 flex flex-wrap gap-2">
            {CSV_EXPORTS.map((e) => (
              <a
                key={e.type}
                href={`/api/export?type=${e.type}&format=csv`}
                className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-sm hover:bg-accent"
              >
                <Download className="h-4 w-4 text-muted-foreground" aria-hidden />
                {e.label}
              </a>
            ))}
          </div>
        </>
      ) : null}

      <h2 className="mb-3 text-sm font-semibold">Erzeugte Reports</h2>
      <Table>
        <THead>
          <TR>
            <TH>Typ</TH>
            <TH>Titel</TH>
            <TH>Stichtag</TH>
            <TH>Ersteller</TH>
            <TH>Erstellt am</TH>
          </TR>
        </THead>
        <TBody>
          {snapshots.length === 0 ? (
            <TR>
              <TD colSpan={5} className="h-20 text-center text-muted-foreground">
                Noch keine Reports erzeugt.
              </TD>
            </TR>
          ) : (
            snapshots.map((r) => (
              <TR key={r.id}>
                <TD className="whitespace-nowrap">
                  <Link href={`/reports/${r.reportType}`} className="hover:underline">
                    {getReportDef(r.reportType)?.titel ?? r.reportType}
                  </Link>
                </TD>
                <TD>{r.title}</TD>
                <TD className="whitespace-nowrap">{formatDate(r.effectiveDate)}</TD>
                <TD className="whitespace-nowrap">{r.createdBy.name}</TD>
                <TD className="whitespace-nowrap">{formatDateTime(r.createdAt)}</TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}
