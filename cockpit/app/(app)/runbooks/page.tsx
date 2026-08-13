import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/authz";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const EXECUTION_STATUS: Record<string, string> = {
  IN_PROGRESS: "Laufend",
  COMPLETED: "Abgeschlossen",
  ABORTED: "Abgebrochen",
};

function truncate(s: string, n = 160): string {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

export default async function RunbooksPage() {
  await requirePermission("runbook:read");

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
    return `${done}/${total} Schritte`;
  };

  return (
    <div>
      <PageHeader
        title="Runbooks"
        description="Standardisierte Abläufe (Standard Operating Procedures) mit interaktiven Checklisten je Ausführung."
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Runbooks" }]}
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
                  {rb._count.steps} Schritte · Review-Zyklus: {rb.reviewCycle}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {runbooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Runbooks vorhanden.</p>
        ) : null}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Laufende Ausführungen</CardTitle>
          <CardDescription>Alle aktuell offenen Runbook-Ausführungen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Runbook</TH>
                <TH>Gestartet von</TH>
                <TH>Gestartet am</TH>
                <TH>Fortschritt</TH>
                <TH>Aktion</TH>
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
                      Öffnen
                    </Link>
                  </TD>
                </TR>
              ))}
              {running.length === 0 ? (
                <TR>
                  <TD colSpan={5} className="text-center text-muted-foreground">
                    Keine laufenden Ausführungen.
                  </TD>
                </TR>
              ) : null}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Abgeschlossene Ausführungen</CardTitle>
          <CardDescription>Die letzten 10 abgeschlossenen bzw. abgebrochenen Ausführungen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Runbook</TH>
                <TH>Gestartet von</TH>
                <TH>Gestartet am</TH>
                <TH>Beendet am</TH>
                <TH>Status</TH>
                <TH>Fortschritt</TH>
                <TH>Aktion</TH>
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
                      {EXECUTION_STATUS[e.status] ?? e.status}
                    </Badge>
                  </TD>
                  <TD className="text-xs">{progressOf(e)}</TD>
                  <TD>
                    <Link
                      href={`/runbooks/executions/${e.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Öffnen
                    </Link>
                  </TD>
                </TR>
              ))}
              {completed.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="text-center text-muted-foreground">
                    Noch keine abgeschlossenen Ausführungen.
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
