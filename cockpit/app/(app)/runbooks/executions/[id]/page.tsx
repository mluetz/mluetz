import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StepRow } from "@/features/runbooks/step-row";
import { CompleteExecutionForm } from "@/features/runbooks/complete-form";

export const dynamic = "force-dynamic";

const EXECUTION_STATUS: Record<string, string> = {
  IN_PROGRESS: "Laufend",
  COMPLETED: "Abgeschlossen",
  ABORTED: "Abgebrochen",
};

export default async function RunbookExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("runbook:read");
  const { id } = await params;
  const execution = await db.runbookExecution.findUnique({
    where: { id },
    include: {
      runbook: { include: { steps: { orderBy: { sortOrder: "asc" } } } },
      startedBy: true,
      stepResults: { include: { completedBy: true } },
    },
  });
  if (!execution) notFound();

  const resultByStep = new Map(execution.stepResults.map((r) => [r.stepId, r]));
  const total = execution.runbook.steps.length;
  const done = execution.runbook.steps.filter((s) => {
    const r = resultByStep.get(s.id);
    return r !== undefined && (r.status === "DONE" || r.status === "SKIPPED");
  }).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const editable = execution.status === "IN_PROGRESS" && hasPermission(user, "runbook:execute");

  return (
    <div>
      <PageHeader
        title={`Ausführung: ${execution.runbook.code} – ${execution.runbook.title}`}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Runbooks", href: "/runbooks" },
          { label: execution.runbook.code, href: `/runbooks/${execution.runbookId}` },
          { label: "Ausführung" },
        ]}
        actions={
          <Badge
            variant={
              execution.status === "COMPLETED"
                ? "low"
                : execution.status === "IN_PROGRESS"
                  ? "secondary"
                  : "critical"
            }
          >
            {EXECUTION_STATUS[execution.status] ?? execution.status}
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Kopfdaten</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <Info
            label="Runbook"
            value={`${execution.runbook.code} – ${execution.runbook.title}`}
            link={`/runbooks/${execution.runbookId}`}
          />
          <Info
            label="Gestartet von / am"
            value={`${execution.startedBy.name} · ${formatDateTime(execution.startedAt)}`}
          />
          <Info label="Kontext / Anlass" value={execution.contextNote ?? "–"} />
          <Info
            label="Beendet am"
            value={execution.completedAt ? formatDateTime(execution.completedAt) : "–"}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Checkliste ({total} Schritte)</CardTitle>
          <CardDescription>
            {editable
              ? "Status und Kommentar je Schritt speichern; Bearbeiter und Zeitstempel werden automatisch protokolliert."
              : "Die Ausführung ist schreibgeschützt (abgeschlossen oder keine Berechtigung)."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {execution.runbook.steps.map((s) => {
            const r = resultByStep.get(s.id);
            return (
              <StepRow
                key={s.id}
                executionId={execution.id}
                editable={editable}
                step={{
                  id: s.id,
                  sortOrder: s.sortOrder,
                  title: s.title,
                  description: s.description,
                  responsibleRole: s.responsibleRole,
                  isDecisionPoint: s.isDecisionPoint,
                  requiredEvidence: s.requiredEvidence,
                }}
                result={
                  r
                    ? {
                        status: r.status,
                        comment: r.comment,
                        completedByName: r.completedBy?.name ?? null,
                        completedAt: r.completedAt ? formatDateTime(r.completedAt) : null,
                      }
                    : null
                }
              />
            );
          })}
          {execution.runbook.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Dieses Runbook hat keine Schritte.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Fortschritt &amp; Abschluss</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-1 text-sm">
              {done} von {total} erledigt ({pct} %)
            </p>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={done}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label="Fortschritt der Checkliste"
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {editable ? (
            <CompleteExecutionForm executionId={execution.id} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {execution.status === "IN_PROGRESS"
                ? "Keine Berechtigung zum Abschließen dieser Ausführung."
                : `Diese Ausführung wurde am ${formatDateTime(execution.completedAt)} beendet (${EXECUTION_STATUS[execution.status] ?? execution.status}).`}
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
