import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/authz";
import { getLocale } from "@/lib/i18n/server";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

function truncate(s: string, n = 160): string {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

export default async function PlaybooksPage() {
  await requirePermission("runbook:read");
  const locale = await getLocale();
  const t = TPRM_MESSAGES[locale];

  const [playbooks, active, closed] = await Promise.all([
    db.playbook.findMany({ orderBy: { code: "asc" } }),
    db.playbookExecution.findMany({
      where: { status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
      include: { playbook: true, startedBy: true, risk: true, thirdParty: true },
    }),
    db.playbookExecution.findMany({
      where: { status: { in: ["CLOSED", "ABORTED"] } },
      orderBy: { closedAt: "desc" },
      take: 10,
      include: { playbook: true, startedBy: true, risk: true, thirdParty: true },
    }),
  ]);

  const linkedRef = (e: (typeof active)[number]) => {
    const parts: string[] = [];
    if (e.risk) parts.push(`${e.risk.riskId}`);
    if (e.thirdParty) parts.push(`${e.thirdParty.tpId} ${e.thirdParty.name}`);
    return parts.length ? parts.join(" · ") : "–";
  };

  return (
    <div>
      <PageHeader
        title={t.pb.list.title}
        description={t.pb.list.description}
        crumbs={[{ label: t.tp.list.crumbOverview, href: "/overview" }, { label: "Playbooks" }]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {playbooks.map((pb) => (
          <Link key={pb.id} href={`/playbooks/${pb.id}`} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardHeader>
                <div>
                  <Badge variant="outline" className="font-mono">
                    {pb.code}
                  </Badge>
                </div>
                <CardTitle className="pt-1 group-hover:underline">{pb.scenario}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>{truncate(pb.objective)}</p>
                <p>
                  <span className="font-medium text-foreground">
                    {t.pb.list.severityGuidance}:
                  </span>{" "}
                  {truncate(pb.severityGuidance, 120)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {playbooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.pb.list.noPlaybooks}</p>
        ) : null}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t.pb.list.activeTitle}</CardTitle>
          <CardDescription>{t.pb.list.activeDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.pb.list.colPlaybook}</TH>
                <TH>{t.pb.list.colSeverity}</TH>
                <TH>{t.pb.list.colReference}</TH>
                <TH>{t.common.startedBy}</TH>
                <TH>{t.common.startedAt}</TH>
                <TH>{t.common.action}</TH>
              </TR>
            </THead>
            <TBody>
              {active.map((e) => (
                <TR key={e.id}>
                  <TD className="text-xs">
                    <span className="font-mono">{e.playbook.code}</span> – {e.playbook.scenario}
                  </TD>
                  <TD>
                    <Badge variant={riskClassVariant(e.severity)}>
                      {t.labels.severity[e.severity] ?? e.severity}
                    </Badge>
                  </TD>
                  <TD className="text-xs">{linkedRef(e)}</TD>
                  <TD className="text-xs">{e.startedBy.name}</TD>
                  <TD className="whitespace-nowrap text-xs">{formatDateTime(e.startedAt)}</TD>
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
              {active.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="text-center text-muted-foreground">
                    {t.pb.list.noActive}
                  </TD>
                </TR>
              ) : null}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t.pb.list.closedTitle}</CardTitle>
          <CardDescription>{t.pb.list.closedDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.pb.list.colPlaybook}</TH>
                <TH>{t.pb.list.colSeverity}</TH>
                <TH>{t.common.status}</TH>
                <TH>{t.pb.list.colReference}</TH>
                <TH>{t.common.startedBy}</TH>
                <TH>{t.common.closedAt}</TH>
                <TH>{t.common.action}</TH>
              </TR>
            </THead>
            <TBody>
              {closed.map((e) => (
                <TR key={e.id}>
                  <TD className="text-xs">
                    <span className="font-mono">{e.playbook.code}</span> – {e.playbook.scenario}
                  </TD>
                  <TD>
                    <Badge variant={riskClassVariant(e.severity)}>
                      {t.labels.severity[e.severity] ?? e.severity}
                    </Badge>
                  </TD>
                  <TD>
                    <Badge variant={e.status === "CLOSED" ? "low" : "critical"}>
                      {t.labels.pbExecutionStatus[e.status] ?? e.status}
                    </Badge>
                  </TD>
                  <TD className="text-xs">{linkedRef(e)}</TD>
                  <TD className="text-xs">{e.startedBy.name}</TD>
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
              {closed.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="text-center text-muted-foreground">
                    {t.pb.list.noClosed}
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
