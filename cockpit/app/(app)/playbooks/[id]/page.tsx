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
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StartPlaybookForm } from "@/features/playbooks/panels";

export const dynamic = "force-dynamic";

export default async function PlaybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("runbook:read");
  const locale = await getLocale();
  const t = TPRM_MESSAGES[locale];
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

  const pd = t.pb.detail;
  const sections: Array<{ title: string; value: string }> = [
    { title: pd.scenario, value: playbook.scenario },
    { title: pd.objective, value: playbook.objective },
    { title: pd.activationCriteria, value: playbook.activationCriteria },
    { title: pd.severityGuidance, value: playbook.severityGuidance },
    { title: pd.rolesRaci, value: playbook.rolesRaci },
    { title: pd.initialAssessment, value: playbook.initialAssessment },
    { title: pd.immediateActions, value: playbook.immediateActions },
    { title: pd.riskAnalysis, value: playbook.riskAnalysis },
    { title: pd.decisionTree, value: playbook.decisionTree },
    { title: pd.communication, value: playbook.communication },
    { title: pd.regulatoryCheck, value: playbook.regulatoryCheck },
    { title: pd.measures, value: playbook.measures },
    { title: pd.evidenceRequired, value: playbook.evidenceRequired },
    { title: pd.closureCriteria, value: playbook.closureCriteria },
    { title: pd.postEventReview, value: playbook.postEventReview },
  ];

  return (
    <div>
      <PageHeader
        title={`${playbook.code} – ${playbook.scenario}`}
        description={playbook.objective}
        crumbs={[
          { label: t.tp.list.crumbOverview, href: "/overview" },
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
              <CardTitle>{pd.lessonsLearned}</CardTitle>
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
            <CardTitle>{pd.activateTitle}</CardTitle>
            <CardDescription>{pd.activateDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <StartPlaybookForm
              playbookId={playbook.id}
              locale={locale}
              risks={risks.map((r) => ({ id: r.id, label: `${r.riskId} – ${r.title}` }))}
              controls={controls.map((c) => ({ id: c.id, label: `${c.controlId} – ${c.name}` }))}
              thirdParties={thirdParties.map((tp) => ({
                id: tp.id,
                label: `${tp.tpId} – ${tp.name}`,
              }))}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            {t.common.executionHistory} ({playbook.executions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.common.status}</TH>
                <TH>{t.pb.list.colSeverity}</TH>
                <TH>{t.pb.list.colReference}</TH>
                <TH>{t.common.startedBy}</TH>
                <TH>{t.common.startedAt}</TH>
                <TH>{t.common.closedAt}</TH>
                <TH>{t.common.action}</TH>
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
                      {t.labels.pbExecutionStatus[e.status] ?? e.status}
                    </Badge>
                  </TD>
                  <TD>
                    <Badge variant={riskClassVariant(e.severity)}>
                      {t.labels.severity[e.severity] ?? e.severity}
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
                      {t.common.open}
                    </Link>
                  </TD>
                </TR>
              ))}
              {playbook.executions.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="text-center text-muted-foreground">
                    {pd.notActivatedYet}
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
