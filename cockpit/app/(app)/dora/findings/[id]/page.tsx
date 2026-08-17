import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { hasPermission, requirePermission } from "@/lib/authz";
import { FINDING_SEVERITY_RULES } from "@/lib/domain/dora-scoring";
import { DORA_FINDING_SOURCE, DORA_FINDING_STATUS } from "@/lib/domain/enums";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FindingStatusForm } from "@/features/dora/findings-panels";

export const dynamic = "force-dynamic";

/** Erlaubte Statusübergänge (Anzeige; Durchsetzung serverseitig in findings-actions.ts). */
const FINDING_TRANSITIONS: Record<string, string[]> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["EFFECTIVENESS_CHECK"],
  EFFECTIVENESS_CHECK: ["CLOSED"],
  CLOSED: [],
};

export default async function DoraFindingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("compliance:read");
  const { id } = await params;
  const finding = await db.doraFinding.findUnique({
    where: { id },
    include: {
      requirement: { select: { id: true, reqId: true, title: true } },
      action: { select: { id: true, actionId: true, title: true, status: true, dueDate: true } },
      createdBy: true,
    },
  });
  if (!finding) notFound();

  const rule = FINDING_SEVERITY_RULES[finding.severity];
  const responseOverdue = finding.status === "OPEN" && isOverdue(finding.responseDueAt);
  const remediationOverdue = finding.status !== "CLOSED" && isOverdue(finding.remediationDueAt);
  const allowedTargets = FINDING_TRANSITIONS[finding.status] ?? [];
  const canWrite = hasPermission(user, "compliance:write");

  const auditEntries = await db.auditLog.findMany({
    where: { entityType: "DoraFinding", entityId: finding.id },
    orderBy: { timestamp: "desc" },
    take: 50,
    include: { user: true },
  });

  return (
    <div>
      <PageHeader
        title={`${finding.findingId} – ${finding.title}`}
        description={finding.description}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "DORA", href: "/dora" },
          { label: "Findings", href: "/dora/findings" },
          { label: finding.findingId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {DORA_FINDING_STATUS[finding.status as keyof typeof DORA_FINDING_STATUS] ??
                finding.status}
            </Badge>
            <Badge variant={riskClassVariant(finding.severity)}>
              {rule?.label ?? finding.severity}
            </Badge>
            {remediationOverdue ? <Badge variant="critical">Behebung überfällig</Badge> : null}
          </div>
        }
      />

      {/* KPI-Zeile: Fristen */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Festgestellt am" value={formatDate(finding.detectedAt)} />
        <Kpi
          label="Reaktion fällig"
          value={`${formatDate(finding.responseDueAt)}${responseOverdue ? " (überfällig)" : ""}`}
          warn={responseOverdue}
        />
        <Kpi
          label="Behebung fällig"
          value={`${formatDate(finding.remediationDueAt)}${remediationOverdue ? " (überfällig)" : ""}`}
          warn={remediationOverdue}
        />
        <Kpi
          label="Geschlossen am"
          value={finding.closedAt ? formatDate(finding.closedAt) : "–"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info
                label="Quelle"
                value={
                  DORA_FINDING_SOURCE[finding.source as keyof typeof DORA_FINDING_SOURCE] ??
                  finding.source
                }
              />
              <Info label="Schweregrad" value={rule?.label ?? finding.severity} />
              <Info label="Eskalation an" value={finding.escalatedTo ?? "–"} />
              <Info label="Erstellt von" value={finding.createdBy.name} />
            </div>
            <Info label="Beschreibung" value={finding.description} />
            <Info
              label="Wirksamkeitskriterium"
              value={
                finding.effectivenessCriterion ??
                "⚠ noch nicht gesetzt – erforderlich für den Abschluss (Kap. 12.1)"
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verknüpfungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">DORA-Anforderung</p>
              {finding.requirement ? (
                <Link
                  href={`/dora/requirements/${finding.requirement.id}`}
                  className="text-primary hover:underline"
                >
                  <span className="font-mono text-xs">{finding.requirement.reqId}</span> –{" "}
                  {finding.requirement.title}
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">ohne Anforderungsbezug</p>
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">CAPA-Maßnahme</p>
              {finding.action ? (
                <div>
                  <Link
                    href={`/actions/${finding.action.id}`}
                    className="text-primary hover:underline"
                  >
                    <span className="font-mono text-xs">{finding.action.actionId}</span> –{" "}
                    {finding.action.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Status: {finding.action.status} · fällig {formatDate(finding.action.dueDate)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">keine Maßnahme verknüpft</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Statuswechsel</CardTitle>
          <CardDescription>
            Workflow: Offen → In Bearbeitung → Wirksamkeitsprüfung → Geschlossen. Der Abschluss
            erfordert ein dokumentiertes Wirksamkeitskriterium (FRWK-DORA-001 Kap. 12.1).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canWrite ? (
            <FindingStatusForm
              findingId={finding.id}
              currentStatus={finding.status}
              allowedTargets={allowedTargets}
              hasEffectivenessCriterion={Boolean(finding.effectivenessCriterion)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Keine Schreibberechtigung.</p>
          )}
        </CardContent>
      </Card>

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
            {auditEntries.length === 0 ? <li className="text-muted-foreground">Keine Einträge.</li> : null}
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
