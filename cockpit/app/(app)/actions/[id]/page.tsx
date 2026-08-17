import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { ACTION_TRANSITIONS, type ActionStatus } from "@/lib/domain/enums";
import { getLocale } from "@/lib/i18n/server";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EscalationForm, ProgressForm, StatusForm } from "@/features/actions-mgmt/panels";

export const dynamic = "force-dynamic";

export default async function ActionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("action:read");
  const locale = await getLocale();
  const m = OPS_MESSAGES[locale];
  const t = m.actions.detail;
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
        description={t.description(action.risk.riskId)}
        crumbs={[
          { label: m.common.overview, href: "/overview" },
          { label: m.actions.list.crumb, href: "/actions" },
          { label: action.actionId },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{m.labels.actionStatus[status] ?? action.status}</Badge>
            {action.escalationLevel > 0 ? (
              <Badge variant={action.escalationLevel >= 3 ? "critical" : "high"}>
                {t.escalationBadge(
                  m.labels.escalationLevels[action.escalationLevel] ??
                    String(action.escalationLevel),
                )}
              </Badge>
            ) : null}
          </div>
        }
      />

      {/* KPI-Zeile */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi label={t.kpiStatus} value={m.labels.actionStatus[status] ?? action.status} />
        <Kpi label={t.kpiPriority} value={m.labels.priority[action.priority] ?? action.priority} />
        <Kpi
          label={t.kpiDue}
          value={formatDate(action.dueDate)}
          warn={overdue}
          warnSuffix={m.common.overdueSuffix}
        />
        <Kpi label={t.kpiProgress} value={`${action.progress} %`} />
        <Kpi
          label={t.kpiEscalation}
          value={m.labels.escalationLevels[action.escalationLevel] ?? String(action.escalationLevel)}
          warn={action.escalationLevel > 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.detailsCard}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label={t.descriptionLabel} value={action.description} />
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">{t.linkedRisk}</p>
              <Link href={`/risks/${action.risk.id}`} className="text-primary hover:underline">
                <span className="font-mono text-xs">{action.risk.riskId}</span> –{" "}
                {action.risk.title}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Info label={t.actionOwner} value={action.owner?.name ?? m.common.ownerNotNamed} />
              <Info label={t.startDate} value={formatDate(action.startDate)} />
              <Info label={t.budget} value={action.budget ?? "–"} />
              <Info label={t.dependencies} value={action.dependencies ?? "–"} />
              <Info label={t.expectedRiskReduction} value={action.expectedRiskReduction ?? "–"} />
              <Info
                label={t.validationStatus}
                value={m.labels.validationStatus[action.validationStatus] ?? action.validationStatus}
              />
              <Info label={t.effectivenessCheck} value={action.effectivenessCheck ?? "–"} />
              <Info label={t.evidenceNote} value={action.evidenceNote ?? "–"} />
              <Info label={m.common.createdAt} value={formatDate(action.createdAt)} />
              <Info label={m.common.lastModified} value={formatDateTime(action.updatedAt)} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.progressCard}</CardTitle>
              <CardDescription>{t.progressCardDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {canWrite ? (
                <ProgressForm
                  actionId={action.id}
                  currentProgress={action.progress}
                  locale={locale}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{m.common.noWritePermission}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.statusCard}</CardTitle>
              <CardDescription>{t.statusCardDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {canWrite ? (
                <StatusForm
                  actionId={action.id}
                  currentStatus={action.status}
                  allowedTargets={allowedTargets}
                  locale={locale}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{m.common.noWritePermission}</p>
              )}
            </CardContent>
          </Card>

          {canEscalate ? (
            <Card>
              <CardHeader>
                <CardTitle>{t.escalationCard}</CardTitle>
                <CardDescription>{t.escalationCardDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <EscalationForm
                  actionId={action.id}
                  currentLevel={action.escalationLevel}
                  locale={locale}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t.auditCard}</CardTitle>
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
              <li className="text-muted-foreground">{t.noEntries}</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  warn,
  warnSuffix,
}: {
  label: string;
  value: string;
  warn?: boolean;
  warnSuffix?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${warn ? "text-risk-high" : ""}`}>
        {value}
        {warn && warnSuffix ? warnSuffix : ""}
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
