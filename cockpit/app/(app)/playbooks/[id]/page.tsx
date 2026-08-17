import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StartPlaybookForm } from "@/features/playbooks/panels";

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

export default async function PlaybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("runbook:read");
  const { id } = await params;
  const playbook = await db.playbook.findUnique({
    where: { id },
    include: {
      executions: {
        orderBy: { startedAt: "desc" },
        include: { startedBy: true, risk: true, thirdParty: true },
      },
    },
  });
  if (!playbook) notFound();

  const canExecute = hasPermission(user, "playbook:execute");
  const [risks, controls, thirdParties] = canExecute
    ? await Promise.all([
        db.risk.findMany({
          orderBy: { riskId: "asc" },
          select: { id: true, riskId: true, title: true },
        }),
        db.control.findMany({
          orderBy: { controlId: "asc" },
          select: { id: true, controlId: true, name: true },
        }),
        db.thirdParty.findMany({
          orderBy: { tpId: "asc" },
          select: { id: true, tpId: true, name: true },
        }),
      ])
    : [[], [], []];

  const sections: Array<{ title: string; value: string }> = [
    { title: "Szenario", value: playbook.scenario },
    { title: "Ziel", value: playbook.objective },
    { title: "Aktivierungskriterien", value: playbook.activationCriteria },
    { title: "Severity-Leitlinie", value: playbook.severityGuidance },
    { title: "Rollen & RACI", value: playbook.rolesRaci },
    { title: "Erste Bewertung", value: playbook.initialAssessment },
    { title: "Sofortmaßnahmen", value: playbook.immediateActions },
    { title: "Risikoanalyse", value: playbook.riskAnalysis },
    { title: "Entscheidungsbaum", value: playbook.decisionTree },
    { title: "Kommunikation & Eskalation", value: playbook.communication },
    { title: "Regulatorische Prüfung", value: playbook.regulatoryCheck },
    { title: "Maßnahmen", value: playbook.measures },
    { title: "Erforderliche Nachweise", value: playbook.evidenceRequired },
    { title: "Abschlusskriterien", value: playbook.closureCriteria },
    { title: "Post-Event-Review", value: playbook.postEventReview },
  ];

  return (
    <div>
      <PageHeader
        title={`${playbook.code} – ${playbook.scenario}`}
        description={playbook.objective}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Playbooks", href: "/playbooks" },
          { label: playbook.code },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{s.value}</p>
            </CardContent>
          </Card>
        ))}
        {playbook.lessonsLearned ? (
          <Card>
            <CardHeader>
              <CardTitle>Lessons Learned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{playbook.lessonsLearned}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {canExecute ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Playbook aktivieren</CardTitle>
            <CardDescription>
              Startet eine neue Ausführung. Die Severity ist Pflicht; optional kann die Ausführung
              mit einem Risiko, einer Drittpartei oder einer Kontrolle verknüpft werden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StartPlaybookForm
              playbookId={playbook.id}
              risks={risks.map((r) => ({ id: r.id, label: `${r.riskId} – ${r.title}` }))}
              controls={controls.map((c) => ({ id: c.id, label: `${c.controlId} – ${c.name}` }))}
              thirdParties={thirdParties.map((t) => ({ id: t.id, label: `${t.tpId} – ${t.name}` }))}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Ausführungshistorie ({playbook.executions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Status</TH>
                <TH>Severity</TH>
                <TH>Bezug (Risiko / Drittpartei)</TH>
                <TH>Gestartet von</TH>
                <TH>Gestartet am</TH>
                <TH>Geschlossen am</TH>
                <TH>Aktion</TH>
              </TR>
            </THead>
            <TBody>
              {playbook.executions.map((e) => (
                <TR key={e.id}>
                  <TD>
                    <Badge
                      variant={
                        e.status === "CLOSED"
                          ? "low"
                          : e.status === "ACTIVE"
                            ? "secondary"
                            : "critical"
                      }
                    >
                      {PB_EXECUTION_STATUS[e.status] ?? e.status}
                    </Badge>
                  </TD>
                  <TD>
                    <Badge variant={riskClassVariant(e.severity)}>
                      {SEVERITY_LABELS[e.severity] ?? e.severity}
                    </Badge>
                  </TD>
                  <TD className="text-xs">
                    {[
                      e.risk?.riskId,
                      e.thirdParty ? `${e.thirdParty.tpId} ${e.thirdParty.name}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "–"}
                  </TD>
                  <TD className="text-xs">{e.startedBy.name}</TD>
                  <TD className="whitespace-nowrap text-xs">{formatDateTime(e.startedAt)}</TD>
                  <TD className="whitespace-nowrap text-xs">{formatDateTime(e.closedAt)}</TD>
                  <TD>
                    <Link
                      href={`/playbooks/executions/${e.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Öffnen
                    </Link>
                  </TD>
                </TR>
              ))}
              {playbook.executions.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="text-center text-muted-foreground">
                    Dieses Playbook wurde noch nicht aktiviert.
                  </TD>
                </TR>
              ) : null}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
