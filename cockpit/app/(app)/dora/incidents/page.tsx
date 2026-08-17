import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { INCIDENT_STATUS } from "@/lib/domain/enums";
import { remainingLabel } from "@/lib/domain/incident-deadlines";
import { formatDateTime } from "@/lib/utils";
import type { IncidentStatus } from "@/features/dora/deadline-monitor";

export const metadata = { title: "IKT-Vorfälle" };
export const dynamic = "force-dynamic";

interface Search {
  open?: string;
  major?: string;
  overdue?: string;
}

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requirePermission("incident:read");
  const sp = await searchParams;
  const now = new Date();

  const incidents = await db.incident.findMany({
    include: { criticalFunction: true, thirdParty: true, reports: true },
    orderBy: { createdAt: "desc" },
  });

  const enriched = incidents.map((i) => {
    const openReports = i.reports.filter((r) => !r.submittedAt);
    const nextDue = openReports.length
      ? openReports.reduce((min, r) => (r.dueAt.getTime() < min.dueAt.getTime() ? r : min))
      : null;
    const overdueCount = openReports.filter((r) => r.dueAt.getTime() < now.getTime()).length;
    return { incident: i, nextDue, overdueCount };
  });

  // KPI-Zeile (immer über den Gesamtbestand)
  const openIncidents = incidents.filter((i) => i.status !== "CLOSED");
  const openMajor = openIncidents.filter((i) => i.isMajor);
  const overdueReportsTotal = enriched.reduce((sum, e) => sum + e.overdueCount, 0);

  // Chips-Filter
  const rows = enriched.filter((e) => {
    if (sp.open === "1" && e.incident.status === "CLOSED") return false;
    if (sp.major === "1" && !e.incident.isMajor) return false;
    if (sp.overdue === "1" && e.overdueCount === 0) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="IKT-Vorfälle"
        description="Vorfallsregister mit Meldefristen-Monitor nach Art. 17–23 DORA (RB-21)"
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Incidents" }]}
        actions={
          hasPermission(user, "incident:write") ? (
            <Link href="/dora/incidents/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden /> Vorfall erfassen
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Kpi label="Offene Vorfälle" value={String(openIncidents.length)} />
        <Kpi
          label="Davon schwerwiegend"
          value={String(openMajor.length)}
          warn={openMajor.length > 0}
        />
        <Kpi
          label="Überfällige Meldungen gesamt"
          value={String(overdueReportsTotal)}
          warn={overdueReportsTotal > 0}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <FilterChip href="/dora/incidents?open=1" active={sp.open === "1"} label="offen" />
        <FilterChip
          href="/dora/incidents?major=1"
          active={sp.major === "1"}
          label="schwerwiegend"
        />
        <FilterChip
          href="/dora/incidents?overdue=1"
          active={sp.overdue === "1"}
          label="mit überfälliger Meldung"
        />
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Incident ID</TH>
            <TH>Titel</TH>
            <TH>Schwerwiegend</TH>
            <TH>Status</TH>
            <TH>Kenntnis</TH>
            <TH>Nächste offene Frist</TH>
            <TH>Kritische Funktion</TH>
            <TH>Drittpartei</TH>
          </TR>
        </THead>
        <TBody>
          {rows.map(({ incident: i, nextDue, overdueCount }) => {
            const overdue = nextDue ? nextDue.dueAt.getTime() < now.getTime() : false;
            return (
              <TR key={i.id}>
                <TD>
                  <Link
                    href={`/dora/incidents/${i.id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {i.incidentId}
                  </Link>
                </TD>
                <TD className="max-w-[320px] truncate">{i.title}</TD>
                <TD>
                  {i.isMajor ? (
                    <Badge variant="critical">Ja</Badge>
                  ) : (
                    <Badge variant="outline">Nein</Badge>
                  )}
                </TD>
                <TD>
                  <Badge variant="secondary">
                    {INCIDENT_STATUS[i.status as IncidentStatus] ?? i.status}
                  </Badge>
                </TD>
                <TD className="whitespace-nowrap text-xs">{formatDateTime(i.awarenessAt)}</TD>
                <TD className="whitespace-nowrap text-xs">
                  {nextDue ? (
                    <span className={overdue ? "font-medium text-risk-critical" : ""}>
                      {formatDateTime(nextDue.dueAt)}
                      {overdue ? ` · ${remainingLabel(nextDue.dueAt, now)}` : ""}
                    </span>
                  ) : (
                    "–"
                  )}
                  {overdueCount > 1 ? (
                    <span className="text-muted-foreground">
                      {" "}
                      (+{overdueCount - 1} weitere überfällig)
                    </span>
                  ) : null}
                </TD>
                <TD className="text-xs">{i.criticalFunction?.name ?? "–"}</TD>
                <TD className="text-xs">
                  {i.thirdParty ? (
                    <Link
                      href={`/third-parties/${i.thirdParty.id}`}
                      className="text-primary hover:underline"
                    >
                      {i.thirdParty.tpId} {i.thirdParty.name}
                    </Link>
                  ) : (
                    "–"
                  )}
                </TD>
              </TR>
            );
          })}
          {rows.length === 0 ? (
            <TR>
              <TD colSpan={8} className="text-center text-muted-foreground">
                Keine Vorfälle gefunden.
              </TD>
            </TR>
          ) : null}
        </TBody>
      </Table>
    </div>
  );
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${warn ? "text-risk-critical" : ""}`}>{value}</p>
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={active ? "/dora/incidents" : href}
      className={`rounded-full border px-2.5 py-1 ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
    >
      {label}
    </Link>
  );
}
