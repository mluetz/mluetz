import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UpdateExecutionForm, ClosePlaybookForm } from "@/features/playbooks/panels";

export const dynamic = "force-dynamic";

const SEVERITY_LABELS: Record<string, string> = {
  LOW: "Niedrig",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
  CRITICAL: "Kritisch",
};

const PB_EXECUTION_STATUS: Record<string, string> = {
  ACTIVE: "Aktiv",
  CLOSED: "Geschlossen",
  ABORTED: "Abgebrochen",
};

export default async function PlaybookExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("runbook:read");
  const { id } = await params;
  const execution = await db.playbookExecution.findUnique({
    where: { id },
    include: {
      playbook: true,
      startedBy: true,
      risk: true,
      control: true,
      thirdParty: true,
    },
  });
  if (!execution) notFound();

  const pb = execution.playbook;
  const editable = execution.status === "ACTIVE" && hasPermission(user, "playbook:execute");

  const guideSections: Array<{ title: string; value: string }> = [
    { title: "Aktivierungskriterien", value: pb.activationCriteria },
    { title: "Severity-Leitlinie", value: pb.severityGuidance },
    { title: "Rollen & RACI", value: pb.rolesRaci },
    { title: "Erste Bewertung", value: pb.initialAssessment },
    { title: "Sofortmaßnahmen", value: pb.immediateActions },
    { title: "Risikoanalyse", value: pb.riskAnalysis },
    { title: "Entscheidungsbaum", value: pb.decisionTree },
    { title: "Kommunikation & Eskalation", value: pb.communication },
    { title: "Regulatorische Prüfung", value: pb.regulatoryCheck },
    { title: "Maßnahmen", value: pb.measures },
    { title: "Erforderliche Nachweise", value: pb.evidenceRequired },
    { title: "Abschlusskriterien", value: pb.closureCriteria },
    { title: "Post-Event-Review", value: pb.postEventReview },
  ];

  return (
    <div>
      <PageHeader
        title={`Ausführung: ${pb.code} – ${pb.scenario}`}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Playbooks", href: "/playbooks" },
          { label: pb.code, href: `/playbooks/${execution.playbookId}` },
          { label: "Ausführung" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={riskClassVariant(execution.severity)}>
              Severity: {SEVERITY_LABELS[execution.severity] ?? execution.severity}
            </Badge>
            <Badge
              variant={
                execution.status === "CLOSED"
                  ? "low"
                  : execution.status === "ACTIVE"
                    ? "secondary"
                    : "critical"
              }
            >
              {PB_EXECUTION_STATUS[execution.status] ?? execution.status}
            </Badge>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Kurzinfo &amp; Verknüpfungen</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <Info
            label="Playbook"
            value={`${pb.code} – ${pb.scenario}`}
            link={`/playbooks/${execution.playbookId}`}
          />
          <Info
            label="Gestartet von / am"
            value={`${execution.startedBy.name} · ${formatDateTime(execution.startedAt)}`}
          />
          <Info label="Ziel" value={pb.objective} />
          <Info
            label="Geschlossen am"
            value={execution.closedAt ? formatDateTime(execution.closedAt) : "–"}
          />
          <Info
            label="Verknüpftes Risiko"
            value={execution.risk ? `${execution.risk.riskId} – ${execution.risk.title}` : "–"}
            link={execution.risk ? `/risks/${execution.risk.id}` : undefined}
          />
          <Info
            label="Verknüpfte Drittpartei"
            value={
              execution.thirdParty
                ? `${execution.thirdParty.tpId} – ${execution.thirdParty.name}`
                : "–"
            }
            link={execution.thirdParty ? `/third-parties/${execution.thirdParty.id}` : undefined}
          />
          <Info
            label="Verknüpfte Kontrolle"
            value={
              execution.control ? `${execution.control.controlId} – ${execution.control.name}` : "–"
            }
            link={execution.control ? `/controls/${execution.control.id}` : undefined}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Notizen</CardTitle>
          <CardDescription>
            {editable
              ? "Laufende Dokumentation der Ausführung (Lagebeurteilung, Entscheidungen, Maßnahmen)."
              : "Die Ausführung ist geschlossen – Notizen sind schreibgeschützt."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editable ? (
            <UpdateExecutionForm
              executionId={execution.id}
              severity={execution.severity}
              notes={execution.notes}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm">{execution.notes ?? "–"}</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Playbook-Leitfaden</CardTitle>
          <CardDescription>
            Vollständiger Leitfaden des Playbooks – Abschnitte zum Aufklappen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {guideSections.map((s) => (
            <details key={s.title} className="rounded-md border p-3">
              <summary className="cursor-pointer text-sm font-medium">{s.title}</summary>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{s.value}</p>
            </details>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Abschluss</CardTitle>
          <CardDescription>
            Der Abschlusskommentar wird den Notizen als „Abschluss: …“ angehängt und protokolliert.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editable ? (
            <ClosePlaybookForm executionId={execution.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {execution.status === "ACTIVE"
                ? "Keine Berechtigung zum Schließen dieser Ausführung."
                : `Diese Ausführung wurde am ${formatDateTime(execution.closedAt)} beendet (${PB_EXECUTION_STATUS[execution.status] ?? execution.status}).`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      {link ? (
        <Link href={link} className="text-primary hover:underline">
          {value}
        </Link>
      ) : (
        <p className="whitespace-pre-wrap">{value}</p>
      )}
    </div>
  );
}
