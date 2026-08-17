import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDateTime } from "@/lib/utils";
import { INCIDENT_REPORT_LABELS, INCIDENT_STATUS } from "@/lib/domain/enums";
import { remainingLabel } from "@/lib/domain/incident-deadlines";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DeadlineMonitor,
  INCIDENT_TRANSITIONS,
  type IncidentStatus,
} from "@/features/dora/deadline-monitor";
import { ClassifyForm, ReportSubmitForm, StatusForm } from "@/features/dora/incident-panels";

export const dynamic = "force-dynamic";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("incident:read");
  const { id } = await params;
  const incident = await db.incident.findUnique({
    where: { id },
    include: {
      criticalFunction: true,
      thirdParty: true,
      createdBy: true,
      reports: { orderBy: { dueAt: "asc" } },
    },
  });
  if (!incident) notFound();

  const now = new Date();
  const status = incident.status as IncidentStatus;
  const allowedTargets = (INCIDENT_TRANSITIONS[status] ?? []) as string[];
  const openReports = incident.reports.filter((r) => !r.submittedAt);
  const overdueReports = openReports.filter((r) => r.dueAt.getTime() < now.getTime());
  const canWrite = hasPermission(user, "incident:write");

  const auditEntries = await db.auditLog.findMany({
    where: { entityType: "Incident", entityId: incident.id },
    orderBy: { timestamp: "desc" },
    take: 50,
    include: { user: true },
  });

  return (
    <div>
      <PageHeader
        title={`${incident.incidentId} – ${incident.title}`}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Incidents", href: "/dora/incidents" },
          { label: incident.incidentId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {incident.isMajor ? (
              <Badge variant="critical">Schwerwiegend (Art. 18)</Badge>
            ) : incident.classifiedAt ? (
              <Badge variant="outline">Nicht schwerwiegend</Badge>
            ) : (
              <Badge variant="medium">Klassifizierung ausstehend</Badge>
            )}
            <Badge variant="secondary">{INCIDENT_STATUS[status] ?? incident.status}</Badge>
            {incident.nis2Relevant ? <Badge variant="outline">NIS-2/BSIG</Badge> : null}
            {incident.gdprRelevant ? <Badge variant="outline">DSGVO Art. 33</Badge> : null}
          </div>
        }
      />

      {/* KPI-Zeile */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Kenntniserlangung" value={formatDateTime(incident.awarenessAt)} />
        <Kpi
          label="Klassifizierung"
          value={incident.classifiedAt ? formatDateTime(incident.classifiedAt) : "ausstehend"}
          warn={!incident.classifiedAt && incident.status !== "CLOSED"}
        />
        <Kpi label="Offene Meldungen" value={String(openReports.length)} />
        <Kpi
          label="Davon überfällig"
          value={String(overdueReports.length)}
          warn={overdueReports.length > 0}
        />
      </div>

      {/* Meldefristen-Monitor prominent */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Meldefristen-Monitor</CardTitle>
          <CardDescription>
            Deterministische Fristenberechnung ab Kenntniserlangung bzw. Klassifizierung – die
            Anzeige nutzt die Ist-Abgaben der dokumentierten Meldungen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeadlineMonitor incident={incident} reports={incident.reports} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Beschreibung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label="Vorfallsbeschreibung" value={incident.description} />
            <Info
              label="Klassifizierungsnotiz"
              value={incident.classificationNote ?? "–"}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Verknüpfungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info
                label="Kritische / wichtige Funktion"
                value={incident.criticalFunction?.name ?? "–"}
              />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Drittpartei</p>
                {incident.thirdParty ? (
                  <Link
                    href={`/third-parties/${incident.thirdParty.id}`}
                    className="text-primary hover:underline"
                  >
                    {incident.thirdParty.tpId} {incident.thirdParty.name}
                  </Link>
                ) : (
                  <p>–</p>
                )}
              </div>
              <Info label="Erfasst von" value={incident.createdBy.name} />
              <Info label="Erfasst am" value={formatDateTime(incident.createdAt)} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Prozessverweise</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <Link href="/runbooks" className="rounded-full border px-2.5 py-1 hover:bg-accent">
                  RB-21 – Schwerwiegenden IKT-Vorfall klassifizieren und melden
                </Link>
                <Link href="/playbooks" className="rounded-full border px-2.5 py-1 hover:bg-accent">
                  PB-06 – Lieferantenbedingter Informationssicherheitsvorfall
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offene Meldungen dokumentieren */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Meldungen dokumentieren</CardTitle>
          <CardDescription>
            Abgabe je Meldung mit Zeitstempel und Referenz erfassen; Folgefristen
            (Zwischen-/Abschlussmeldung) werden automatisch neu berechnet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {openReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine offenen Meldungen.</p>
          ) : (
            openReports.map((r) => {
              const label = INCIDENT_REPORT_LABELS[r.reportType] ?? r.reportType;
              const overdue = r.dueAt.getTime() < now.getTime();
              return (
                <div key={r.id} className="rounded-md border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{label}</span>
                    <span className={`text-xs ${overdue ? "font-medium text-risk-critical" : "text-muted-foreground"}`}>
                      fällig {formatDateTime(r.dueAt)}
                      {overdue ? ` · ${remainingLabel(r.dueAt, now)}` : ""}
                    </span>
                  </div>
                  {canWrite ? (
                    <ReportSubmitForm reportId={r.id} label={label} />
                  ) : (
                    <p className="text-xs text-muted-foreground">Keine Schreibberechtigung.</p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Nachträgliche Klassifizierung */}
      {!incident.classifiedAt && canWrite ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Vorfall klassifizieren</CardTitle>
            <CardDescription>
              Klassifizierung nach den Kriterien der DelVO (EU) 2024/1772 (RB-21). Bei Einstufung
              als schwerwiegend werden die DORA-Meldefristen automatisch angelegt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClassifyForm incidentId={incident.id} />
          </CardContent>
        </Card>
      ) : null}

      {/* Workflow */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>
            Offen → Eingedämmt → Wiederhergestellt → Geschlossen. Abschluss nur, wenn keine
            offene überfällige Meldung mehr existiert; jeder Wechsel wird protokolliert.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canWrite ? (
            <StatusForm
              incidentId={incident.id}
              currentStatus={incident.status}
              allowedTargets={allowedTargets}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Keine Schreibberechtigung.</p>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Audit Trail (Auszug)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs">
            {auditEntries.map((e) => (
              <li key={e.id} className="rounded-md border p-2">
                <span className="font-medium">{e.action}</span>{" "}
                {e.field ? (
                  <span>
                    {e.field}: {e.oldValue ?? "–"} → {e.newValue ?? "–"}
                  </span>
                ) : null}
                <div className="text-muted-foreground">
                  {e.user?.name ?? e.userEmail} · {formatDateTime(e.timestamp)}
                  {e.comment ? ` · ${e.comment}` : ""}
                </div>
              </li>
            ))}
            {auditEntries.length === 0 ? (
              <li className="text-muted-foreground">Keine Einträge.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${warn ? "text-risk-critical" : ""}`}>{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}
