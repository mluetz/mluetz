import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  computeDeadlines,
  remainingLabel,
  type Deadline,
  type ReportType,
} from "@/lib/domain/incident-deadlines";
import { INCIDENT_REPORT_LABELS, INCIDENT_STATUS } from "@/lib/domain/enums";
import { formatDateTime } from "@/lib/utils";

export type IncidentStatus = keyof typeof INCIDENT_STATUS;

/**
 * Erlaubte Workflow-Übergänge eines Vorfalls:
 * OPEN → CONTAINED → RESTORED → CLOSED (OPEN → RESTORED ist zulässig).
 * Die Server Action prüft zusätzlich, dass vor CLOSED keine offene
 * überfällige Meldung existiert.
 */
export const INCIDENT_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  OPEN: ["CONTAINED", "RESTORED"],
  CONTAINED: ["RESTORED"],
  RESTORED: ["CLOSED"],
  CLOSED: [],
};

export interface DeadlineMonitorIncident {
  awarenessAt: Date;
  classifiedAt: Date | null;
  isMajor: boolean;
  gdprRelevant: boolean;
  nis2Relevant: boolean;
}

export interface DeadlineMonitorReport {
  reportType: string;
  submittedAt: Date | null;
  reference: string | null;
}

function StatusBadge({ deadline, now }: { deadline: Deadline; now: Date }) {
  switch (deadline.status) {
    case "OK":
      return <Badge variant="low">fristgerecht</Badge>;
    case "DUE":
      return <Badge variant="medium">{remainingLabel(deadline.dueAt, now)}</Badge>;
    case "OVERDUE":
      return <Badge variant="critical">{remainingLabel(deadline.dueAt, now)}</Badge>;
    case "LATE":
      return <Badge variant="high">verspätet gemeldet</Badge>;
  }
}

/**
 * Meldefristen-Monitor: rendert die deterministisch berechneten Fristen
 * aus lib/domain/incident-deadlines.ts mit den Ist-Abgaben aus der DB.
 * Reine Anzeige – keine eigene Fristenlogik.
 */
export function DeadlineMonitor({
  incident,
  reports,
}: {
  incident: DeadlineMonitorIncident;
  reports: DeadlineMonitorReport[];
}) {
  const now = new Date();
  const submitted: Partial<Record<ReportType, Date>> = {};
  for (const r of reports) {
    if (r.submittedAt) submitted[r.reportType as ReportType] = r.submittedAt;
  }
  const deadlines = computeDeadlines(
    {
      awarenessAt: incident.awarenessAt,
      classifiedAt: incident.classifiedAt,
      isMajor: incident.isMajor,
      gdprRelevant: incident.gdprRelevant,
      nis2Relevant: incident.nis2Relevant,
      submitted,
    },
    now,
  );
  const referenceByType = new Map(reports.map((r) => [r.reportType, r.reference]));

  if (deadlines.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Keine regulatorischen Meldefristen ermittelt: Der Vorfall ist nicht als schwerwiegend
          klassifiziert und weder NIS-2- noch DSGVO-relevant markiert.
        </p>
        <p className="text-xs text-muted-foreground">
          Fristen nach Art. 19 DORA (RTS 2025/301); parallele Stränge NIS-2/BSIG und DSGVO Art. 33.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Table>
        <THead>
          <TR>
            <TH>Meldung</TH>
            <TH>Fällig am</TH>
            <TH>Status</TH>
            <TH>Referenz</TH>
          </TR>
        </THead>
        <TBody>
          {deadlines.map((d) => (
            <TR key={d.reportType}>
              <TD>
                <p className="text-sm font-medium">
                  {INCIDENT_REPORT_LABELS[d.reportType] ?? d.reportType}
                </p>
                <p className="text-xs text-muted-foreground">{d.label}</p>
              </TD>
              <TD className="whitespace-nowrap text-xs">{formatDateTime(d.dueAt)}</TD>
              <TD>
                <StatusBadge deadline={d} now={now} />
              </TD>
              <TD className="text-xs">
                {referenceByType.get(d.reportType) || "–"}
                {d.submittedAt ? (
                  <p className="text-muted-foreground">gemeldet {formatDateTime(d.submittedAt)}</p>
                ) : null}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        Fristen nach Art. 19 DORA (RTS 2025/301); parallele Stränge NIS-2/BSIG und DSGVO Art. 33.
      </p>
    </div>
  );
}
