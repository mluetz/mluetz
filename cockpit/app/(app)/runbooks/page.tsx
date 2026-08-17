import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/authz";
import { getLocale } from "@/lib/i18n/server";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

function truncate(s: string, n = 160): string {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

export default async function RunbooksPage() {
  await requirePermission("runbook:read");
  const locale = await getLocale();
  const t = TPRM_MESSAGES[locale];

  const [runbooks, running, completed] = await Promise.all([
    db.runbook.findMany({
      orderBy: { code: "asc" },
      include: { _count: { select: { steps: true } } },
    }),
    db.runbookExecution.findMany({
      where: { status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
      include: {
        runbook: { include: { _count: { select: { steps: true } } } },
        startedBy: true,
        stepResults: true,
      },
    }),
    db.runbookExecution.findMany({
      where: { status: { in: ["COMPLETED", "ABORTED"] } },
      orderBy: { completedAt: "desc" },
      take: 10,
      include: {
        runbook: { include: { _count: { select: { steps: true } } } },
        startedBy: true,
        stepResults: true,
      },
    }),
  ]);

  const progressOf = (e: (typeof running)[number]) => {
    const total = e.runbook._count.steps;
    const done = e.stepResults.filter((r) => r.status === "DONE" || r.status === "SKIPPED").length;
    return `${done}/${total} ${t.rb.list.stepsWord}`;
  };

  return (
    <div>
      <PageHeader
        title={t.rb.list.title}
        description={t.rb.list.description}
        crumbs={[{ label: t.tp.list.crumbOverview, href: "/overview" }, { label: "Runbooks" }]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {runbooks.map((rb) => (
          <Link key={rb.id} href={`/runbooks/${rb.id}`} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="font-mono">
                    {rb.code}
                  </Badge>
                  <Badge variant="secondary">v{rb.version}</Badge>
                </div>
                <CardTitle className="pt-1 group-hover:underline">{rb.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>{truncate(rb.purpose)}</p>
                <p>
                  {rb._count.steps} {t.rb.list.stepsWord} · {t.rb.list.reviewCycle}:{" "}
                  {rb.reviewCycle}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {runbooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.rb.list.noRunbooks}</p>
        ) : null}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t.rb.list.runningTitle}</CardTitle>
          <CardDescription>{t.rb.list.runningDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.rb.list.colRunbook}</TH>
                <TH>{t.common.startedBy}</TH>
                <TH>{t.common.startedAt}</TH>
                <TH>{t.common.progress}</TH>
                <TH>{t.common.action}</TH>
              </TR>
            </THead>
            <TBody>
              {running.map((e) => (
                <TR key={e.id}>
                  <TD className="text-xs">
                    <span className="font-mono">{e.runbook.code}</span> – {e.runbook.title}
                  </TD>
                  <TD className="text-xs">{e.startedBy.name}</TD>
                  <TD className="whitespace-nowrap text-xs">{formatDateTime(e.startedAt)}</TD>
                  <TD className="text-xs">{progressOf(e)}</TD>
                  <TD>
                    <Link
                      href={`/runbooks/executions/${e.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {t.common.open}
                    </Link>
                  </TD>
                </TR>
              ))}
              {running.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-muted-foreground">
                    {t.rb.list.noRunning}
                  </TD>
                </TR>
              ) : null}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t.rb.list.completedTitle}</CardTitle>
          <CardDescription>{t.rb.list.completedDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.rb.list.colRunbook}</TH>
                <TH>{t.common.startedBy}</TH>
                <TH>{t.common.startedAt}</TH>
                <TH>{t.common.endedAt}</TH>
                <TH>{t.common.status}</TH>
                <TH>{t.common.progress}</TH>
                <TH>{t.common.action}</TH>
              </TR>
            </THead>
            <TBody>
              {completed.map((e) => (
                <TR key={e.id}>
                  <TD className="text-xs">
                    <span className="font-mono">{e.runbook.code}</span> – {e.runbook.title}
                  </TD>
                  <TD className="text-xs">{e.startedBy.name}</TD>
                  <TD className="whitespace-nowrap text-xs">{formatDateTime(e.startedAt)}</TD>
                  <TD className="whitespace-nowrap text-xs">{formatDateTime(e.completedAt)}</TD>
                  <TD>
                    <Badge variant={e.status === "COMPLETED" ? "low" : "critical"}>
                      {t.labels.rbExecutionStatus[e.status] ?? e.status}
                    </Badge>
                  </TD>
                  <TD className="text-xs">{progressOf(e)}</TD>
                  <TD>
                    <Link
                      href={`/runbooks/executions/${e.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {t.common.open}
                    </Link>
                  </TD>
                </TR>
              ))}
              {completed.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="text-center text-muted-foreground">
                    {t.rb.list.noCompleted}
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
