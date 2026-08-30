import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, hasPermission } from "@/lib/authz";
import { getLocale } from "@/lib/i18n/server";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UpdateExecutionForm, ClosePlaybookForm } from "@/features/playbooks/panels";

export const dynamic = "force-dynamic";

export default async function PlaybookExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("runbook:read");
  const locale = await getLocale();
  const t = TPRM_MESSAGES[locale];
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
  const pd = t.pb.detail;
  const px = t.pb.execution;

  const guideSections: Array<{ title: string; value: string }> = [
    { title: pd.activationCriteria, value: pb.activationCriteria },
    { title: pd.severityGuidance, value: pb.severityGuidance },
    { title: pd.rolesRaci, value: pb.rolesRaci },
    { title: pd.initialAssessment, value: pb.initialAssessment },
    { title: pd.immediateActions, value: pb.immediateActions },
    { title: pd.riskAnalysis, value: pb.riskAnalysis },
    { title: pd.decisionTree, value: pb.decisionTree },
    { title: pd.communication, value: pb.communication },
    { title: pd.regulatoryCheck, value: pb.regulatoryCheck },
    { title: pd.measures, value: pb.measures },
    { title: pd.evidenceRequired, value: pb.evidenceRequired },
    { title: pd.closureCriteria, value: pb.closureCriteria },
    { title: pd.postEventReview, value: pb.postEventReview },
  ];

  return (
    <div>
      <PageHeader
        title={`${px.titlePrefix}: ${pb.code} – ${pb.scenario}`}
        crumbs={[
          { label: t.tp.list.crumbOverview, href: "/overview" },
          { label: "Playbooks", href: "/playbooks" },
          { label: pb.code, href: `/playbooks/${execution.playbookId}` },
          { label: px.crumbExecution },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={riskClassVariant(execution.severity)}>
              {px.severityPrefix}: {t.labels.severity[execution.severity] ?? execution.severity}
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
              {t.labels.pbExecutionStatus[execution.status] ?? execution.status}
            </Badge>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{px.infoTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <Info
            label={px.playbook}
            value={`${pb.code} – ${pb.scenario}`}
            link={`/playbooks/${execution.playbookId}`}
          />
          <Info
            label={px.startedByAt}
            value={`${execution.startedBy.name} · ${formatDateTime(execution.startedAt)}`}
          />
          <Info label={px.objective} value={pb.objective} />
          <Info
            label={t.common.closedAt}
            value={execution.closedAt ? formatDateTime(execution.closedAt) : "–"}
          />
          <Info
            label={px.linkedRisk}
            value={execution.risk ? `${execution.risk.riskId} – ${execution.risk.title}` : "–"}
            link={execution.risk ? `/risks/${execution.risk.id}` : undefined}
          />
          <Info
            label={px.linkedThirdParty}
            value={
              execution.thirdParty
                ? `${execution.thirdParty.tpId} – ${execution.thirdParty.name}`
                : "–"
            }
            link={execution.thirdParty ? `/third-parties/${execution.thirdParty.id}` : undefined}
          />
          <Info
            label={px.linkedControl}
            value={
              execution.control ? `${execution.control.controlId} – ${execution.control.name}` : "–"
            }
            link={execution.control ? `/controls/${execution.control.id}` : undefined}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{px.notesTitle}</CardTitle>
          <CardDescription>{editable ? px.notesEditable : px.notesReadonly}</CardDescription>
        </CardHeader>
        <CardContent>
          {editable ? (
            <UpdateExecutionForm
              executionId={execution.id}
              severity={execution.severity}
              notes={execution.notes}
              locale={locale}
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm">{execution.notes ?? "–"}</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{px.guideTitle}</CardTitle>
          <CardDescription>{px.guideDescription}</CardDescription>
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
          <CardTitle>{px.closureTitle}</CardTitle>
          <CardDescription>{px.closureDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {editable ? (
            <ClosePlaybookForm executionId={execution.id} locale={locale} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {execution.status === "ACTIVE"
                ? px.noClosePermission
                : t.common.executionEndedAt(
                    formatDateTime(execution.closedAt),
                    t.labels.pbExecutionStatus[execution.status] ?? execution.status,
                  )}
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
