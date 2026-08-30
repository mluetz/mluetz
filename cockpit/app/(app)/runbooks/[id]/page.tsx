import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { getLocale } from "@/lib/i18n/server";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StartRunbookForm } from "@/features/runbooks/start-form";

export const dynamic = "force-dynamic";

export default async function RunbookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("runbook:read");
  const locale = await getLocale();
  const t = TPRM_MESSAGES[locale];
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
  const rd = t.rb.detail;

  return (
    <div>
      <PageHeader
        title={`${runbook.code} – ${runbook.title}`}
        description={runbook.purpose}
        crumbs={[
          { label: t.tp.list.crumbOverview, href: "/overview" },
          { label: "Runbooks", href: "/runbooks" },
          { label: runbook.code },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {rd.version} {runbook.version}
            </Badge>
            <Badge variant={runbook.approvalStatus === "APPROVED" ? "low" : "medium"}>
              {runbook.approvalStatus === "APPROVED" ? rd.approved : runbook.approvalStatus}
            </Badge>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{rd.descriptionFrame}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label={rd.purpose} value={runbook.purpose} />
            <Info label={rd.scope} value={runbook.scope} />
            <Info label={rd.trigger} value={runbook.triggerText} />
            <Info label={rd.prerequisites} value={runbook.prerequisites} />
            <Info label={rd.input} value={runbook.input} />
            <Info label={rd.roles} value={runbook.rolesText} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{rd.governanceTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info label={rd.sla} value={runbook.sla} />
            <Info label={rd.escalationRules} value={runbook.escalationRules} />
            <Info label={rd.output} value={runbook.output} />
            <Info label={rd.kpi} value={runbook.kpi} />
            <Info label={rd.controlPoints} value={runbook.controlPoints} />
            <div className="grid grid-cols-2 gap-3">
              <Info label={rd.reviewCycle} value={runbook.reviewCycle} />
              <Info
                label={rd.versionApproval}
                value={`v${runbook.version} · ${runbook.approvalStatus === "APPROVED" ? rd.approved : runbook.approvalStatus}`}
              />
            </div>
            {runbook.lessonsLearned ? (
              <Info label={rd.lessonsLearned} value={runbook.lessonsLearned} />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            {rd.stepsTitle} ({totalSteps})
          </CardTitle>
          <CardDescription>{rd.stepsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {runbook.steps.map((s) => (
              <li key={s.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {s.sortOrder}. {s.title}
                  {s.isDecisionPoint ? (
                    <span className="ml-2 text-xs font-semibold text-risk-medium">
                      {rd.decisionPoint}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">
                  {s.description}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {rd.role}: {s.responsibleRole}
                  {s.requiredEvidence ? ` · ${rd.requiredEvidence}: ${s.requiredEvidence}` : ""}
                </p>
              </li>
            ))}
            {runbook.steps.length === 0 ? (
              <li className="text-sm text-muted-foreground">{rd.noSteps}</li>
            ) : null}
          </ol>
        </CardContent>
      </Card>

      {canExecute ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{rd.startTitle}</CardTitle>
            <CardDescription>{rd.startDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <StartRunbookForm runbookId={runbook.id} locale={locale} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            {t.common.executionHistory} ({runbook.executions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.common.status}</TH>
                <TH>{t.common.startedBy}</TH>
                <TH>{t.common.startedAt}</TH>
                <TH>{t.common.endedAt}</TH>
                <TH>{t.common.progress}</TH>
                <TH>{rd.context}</TH>
                <TH>{t.common.action}</TH>
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
                        {t.labels.rbExecutionStatus[e.status] ?? e.status}
                      </Badge>
                    </TD>
                    <TD className="text-xs">{e.startedBy.name}</TD>
                    <TD className="whitespace-nowrap text-xs">{formatDateTime(e.startedAt)}</TD>
                    <TD className="whitespace-nowrap text-xs">{formatDateTime(e.completedAt)}</TD>
                    <TD className="text-xs">
                      {done}/{totalSteps} {t.rb.list.stepsWord}
                    </TD>
                    <TD className="max-w-[280px] truncate text-xs">{e.contextNote ?? "–"}</TD>
                    <TD>
                      <Link
                        href={`/runbooks/executions/${e.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {t.common.open}
                      </Link>
                    </TD>
                  </TR>
                );
              })}
              {runbook.executions.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="text-center text-muted-foreground">
                    {rd.notExecutedYet}
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
