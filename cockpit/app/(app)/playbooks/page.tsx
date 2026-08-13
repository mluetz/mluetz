import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/authz";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const SEVERITY_LABELS: Record<string, string> = {
  LOW: "Niedrig",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
  CRITICAL: "Kritisch",
};

const PB_EXECUTION_STATUS: Record<string, string> = {
  ACTIVE: "Aktiv",
  CLOSED: "Geschlossen",
  ABORTED: "Abgebrochen",
};

function truncate(s: string, n = 160): string {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

export default async function PlaybooksPage() {
  await requirePermission("runbook:read");

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
        title="Playbooks"
        description="Ereignisgesteuerte Reaktionsleitfäden für definierte Szenarien – Aktivierung mit Severity und optionaler Verknüpfung zu Risiko, Drittpartei oder Kontrolle."
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Playbooks" }]}
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
                  <span className="font-medium text-foreground">Severity-Leitlinie:</span>{" "}
                  {truncate(pb.severityGuidance, 120)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {playbooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Playbooks vorhanden.</p>
        ) : null}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Aktive Playbook-Ausführungen</CardTitle>
          <CardDescription>Alle aktuell aktivierten Playbooks.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Playbook</TH>
                <TH>Severity</TH>
                <TH>Bezug (Risiko / Drittpartei)</TH>
                <TH>Gestartet von</TH>
                <TH>Gestartet am</TH>
                <TH>Aktion</TH>
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
                      {SEVERITY_LABELS[e.severity] ?? e.severity}
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
                      Öffnen
                    </Link>
                  </TD>
                </TR>
              ))}
              {active.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="text-center text-muted-foreground">
                    Keine aktiven Ausführungen.
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
          <CardDescription>Die letzten 10 geschlossenen bzw. abgebrochenen Ausführungen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Playbook</TH>
                <TH>Severity</TH>
                <TH>Status</TH>
                <TH>Bezug (Risiko / Drittpartei)</TH>
                <TH>Gestartet von</TH>
                <TH>Geschlossen am</TH>
                <TH>Aktion</TH>
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
                      {SEVERITY_LABELS[e.severity] ?? e.severity}
                    </Badge>
                  </TD>
                  <TD>
                    <Badge variant={e.status === "CLOSED" ? "low" : "critical"}>
                      {PB_EXECUTION_STATUS[e.status] ?? e.status}
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
                      Öffnen
                    </Link>
                  </TD>
                </TR>
              ))}
              {closed.length === 0 ? (
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
