import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { ACTION_STATUS, ACTION_TRANSITIONS, PRIORITY, type ActionStatus } from "@/lib/domain/enums";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EscalationForm, ProgressForm, StatusForm } from "@/features/actions-mgmt/panels";

export const dynamic = "force-dynamic";

const VALIDATION_STATUS: Record<string, string> = {
  NOT_VALIDATED: "Nicht validiert",
  VALIDATED: "Validiert",
  REJECTED: "Abgelehnt",
};

const ESCALATION_LABELS: Record<number, string> = {
  0: "keine",
  1: "Stufe 1 – Teamleitung",
  2: "Stufe 2 – Bereich",
  3: "Stufe 3 – Management",
};

export default async function ActionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("action:read");
  const { id } = await params;
  const action = await db.action.findUnique({
    where: { id },
    include: {
      risk: { select: { id: true, riskId: true, title: true } },
      owner: true,
    },
  });
  if (!action) notFound();

  const status = action.status as ActionStatus;
  const allowedTargets = (ACTION_TRANSITIONS[status] ?? []) as string[];
  const overdue = isOverdue(action.dueDate) && !["COMPLETED", "CLOSED"].includes(action.status);
  const auditEntries = await db.auditLog.findMany({
    where: { entityType: "Action", entityId: action.id },
    orderBy: { timestamp: "desc" },
    take: 50,
    include: { user: true },
  });

  const canWrite = hasPermission(user, "action:write");
  const canEscalate = hasPermission(user, "action:escalate");

  return (
    <div>
      <PageHeader
        title={`${action.actionId} – ${action.title}`}
        description={`Maßnahme zu Risiko ${action.risk.riskId}`}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Maßnahmen", href: "/actions" },
          { label: action.actionId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{ACTION_STATUS[status] ?? action.status}</Badge>
            {action.escalationLevel > 0 ? (
              <Badge variant={action.escalationLevel >= 3 ? "critical" : "high"}>
                Eskalation {ESCALATION_LABELS[action.escalationLevel]}
              </Badge>
            ) : null}
          </div>
        }
      />

      {/* KPI-Zeile */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label="Status" value={ACTION_STATUS[status] ?? action.status} />
        <Kpi
          label="Priorität"
          value={PRIORITY[action.priority as keyof typeof PRIORITY] ?? action.priority}
        />
        <Kpi label="Fälligkeit" value={formatDate(action.dueDate)} warn={overdue} />
        <Kpi label="Fortschritt" value={`${action.progress} %`} />
        <Kpi
          label="Eskalationsstufe"
          value={ESCALATION_LABELS[action.escalationLevel] ?? String(action.escalationLevel)}
          warn={action.escalationLevel > 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Beschreibung &amp; Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label="Beschreibung" value={action.description} />
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Zugehöriges Risiko</p>
              <Link href={`/risks/${action.risk.id}`} className="text-primary hover:underline">
                <span className="font-mono text-xs">{action.risk.riskId}</span> –{" "}
                {action.risk.title}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Info label="Action Owner" value={action.owner?.name ?? "⚠ nicht benannt"} />
              <Info label="Startdatum" value={formatDate(action.startDate)} />
              <Info label="Budget" value={action.budget ?? "–"} />
              <Info label="Abhängigkeiten" value={action.dependencies ?? "–"} />
              <Info label="Erwartete Risikoreduktion" value={action.expectedRiskReduction ?? "–"} />
              <Info
                label="Validierungsstatus"
                value={VALIDATION_STATUS[action.validationStatus] ?? action.validationStatus}
              />
              <Info label="Wirksamkeitsprüfung" value={action.effectivenessCheck ?? "–"} />
              <Info label="Nachweis / Evidence" value={action.evidenceNote ?? "–"} />
              <Info label="Erstellt am" value={formatDate(action.createdAt)} />
              <Info label="Letzte Änderung" value={formatDateTime(action.updatedAt)} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fortschritt aktualisieren</CardTitle>
              <CardDescription>
                Fortschritt in Prozent mit optionalem Nachweis; jede Änderung wird protokolliert.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canWrite ? (
                <ProgressForm actionId={action.id} currentProgress={action.progress} />
              ) : (
                <p className="text-sm text-muted-foreground">Keine Schreibberechtigung.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statuswechsel</CardTitle>
              <CardDescription>
                Nur entlang der erlaubten Workflow-Übergänge; Abschluss (Closed) erst nach der
                Wirksamkeitsprüfung.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canWrite ? (
                <StatusForm
                  actionId={action.id}
                  currentStatus={action.status}
                  allowedTargets={allowedTargets}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Keine Schreibberechtigung.</p>
              )}
            </CardContent>
          </Card>

          {canEscalate ? (
            <Card>
              <CardHeader>
                <CardTitle>Eskalation</CardTitle>
                <CardDescription>
                  Eskalation an Teamleitung (1), Bereich (2) oder Management (3) mit
                  Pflichtbegründung.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EscalationForm actionId={action.id} currentLevel={action.escalationLevel} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

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
      <p className={`text-sm font-semibold ${warn ? "text-risk-high" : ""}`}>
        {value}
        {warn && label === "Fälligkeit" ? " (überfällig)" : ""}
      </p>
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
