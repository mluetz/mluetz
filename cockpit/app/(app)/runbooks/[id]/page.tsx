import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StartRunbookForm } from "@/features/runbooks/start-form";

export const dynamic = "force-dynamic";

const EXECUTION_STATUS: Record<string, string> = {
  IN_PROGRESS: "Laufend",
  COMPLETED: "Abgeschlossen",
  ABORTED: "Abgebrochen",
};

export default async function RunbookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("runbook:read");
  const { id } = await params;
  const runbook = await db.runbook.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { sortOrder: "asc" } },
      executions: {
        orderBy: { startedAt: "desc" },
        include: { startedBy: true, stepResults: true },
      },
    },
  });
  if (!runbook) notFound();

  const canExecute = hasPermission(user, "runbook:execute");
  const totalSteps = runbook.steps.length;

  return (
    <div>
      <PageHeader
        title={`${runbook.code} – ${runbook.title}`}
        description={runbook.purpose}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Runbooks", href: "/runbooks" },
          { label: runbook.code },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Version {runbook.version}</Badge>
            <Badge variant={runbook.approvalStatus === "APPROVED" ? "low" : "medium"}>
              {runbook.approvalStatus === "APPROVED" ? "Freigegeben" : runbook.approvalStatus}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Beschreibung &amp; Rahmen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label="Zweck" value={runbook.purpose} />
            <Info label="Scope" value={runbook.scope} />
            <Info label="Trigger / Auslöser" value={runbook.triggerText} />
            <Info label="Voraussetzungen" value={runbook.prerequisites} />
            <Info label="Input" value={runbook.input} />
            <Info label="Rollen" value={runbook.rolesText} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Steuerung &amp; Governance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label="SLA" value={runbook.sla} />
            <Info label="Eskalationsregeln" value={runbook.escalationRules} />
            <Info label="Output" value={runbook.output} />
            <Info label="KPI" value={runbook.kpi} />
            <Info label="Kontrollpunkte" value={runbook.controlPoints} />
            <div className="grid grid-cols-2 gap-3">
              <Info label="Review-Zyklus" value={runbook.reviewCycle} />
              <Info
                label="Version / Freigabe"
                value={`v${runbook.version} · ${runbook.approvalStatus === "APPROVED" ? "Freigegeben" : runbook.approvalStatus}`}
              />
            </div>
            {runbook.lessonsLearned ? (
              <Info label="Lessons Learned" value={runbook.lessonsLearned} />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Schritte ({totalSteps})</CardTitle>
          <CardDescription>
            Entscheidungspunkte sind mit „◆ Entscheidungspunkt“ gekennzeichnet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {runbook.steps.map((s) => (
              <li key={s.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {s.sortOrder}. {s.title}
                  {s.isDecisionPoint ? (
                    <span className="ml-2 text-xs font-semibold text-risk-medium">
                      ◆ Entscheidungspunkt
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
                  {s.description}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Rolle: {s.responsibleRole}
                  {s.requiredEvidence ? ` · Erforderlicher Nachweis: ${s.requiredEvidence}` : ""}
                </p>
              </li>
            ))}
            {runbook.steps.length === 0 ? (
              <li className="text-sm text-muted-foreground">Keine Schritte definiert.</li>
            ) : null}
          </ol>
        </CardContent>
      </Card>

      {canExecute ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Ausführung starten</CardTitle>
            <CardDescription>
              Startet eine neue Ausführung als interaktive Checkliste. Jeder Schritt wird mit
              Bearbeiter, Zeitstempel und Kommentar protokolliert.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StartRunbookForm runbookId={runbook.id} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Ausführungshistorie ({runbook.executions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Status</TH>
                <TH>Gestartet von</TH>
                <TH>Gestartet am</TH>
                <TH>Beendet am</TH>
                <TH>Fortschritt</TH>
                <TH>Kontext</TH>
                <TH>Aktion</TH>
              </TR>
            </THead>
            <TBody>
              {runbook.executions.map((e) => {
                const done = e.stepResults.filter(
                  (r) => r.status === "DONE" || r.status === "SKIPPED",
                ).length;
                return (
                  <TR key={e.id}>
                    <TD>
                      <Badge
                        variant={
                          e.status === "COMPLETED"
                            ? "low"
                            : e.status === "IN_PROGRESS"
                              ? "secondary"
                              : "critical"
                        }
                      >
                        {EXECUTION_STATUS[e.status] ?? e.status}
                      </Badge>
                    </TD>
                    <TD className="text-xs">{e.startedBy.name}</TD>
                    <TD className="whitespace-nowrap text-xs">{formatDateTime(e.startedAt)}</TD>
                    <TD className="whitespace-nowrap text-xs">{formatDateTime(e.completedAt)}</TD>
                    <TD className="text-xs">
                      {done}/{totalSteps} Schritte
                    </TD>
                    <TD className="max-w-[280px] truncate text-xs">{e.contextNote ?? "–"}</TD>
                    <TD>
                      <Link
                        href={`/runbooks/executions/${e.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        Öffnen
                      </Link>
                    </TD>
                  </TR>
                );
              })}
              {runbook.executions.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="text-center text-muted-foreground">
                    Dieses Runbook wurde noch nicht ausgeführt.
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap">{value}</p>
    </div>
  );
}
