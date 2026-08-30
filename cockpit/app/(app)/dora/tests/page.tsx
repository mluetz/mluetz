import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Resilienz-Testprogramm" };
export const dynamic = "force-dynamic";

export default async function ResilienceTestsPage() {
  await requirePermission("risk:read");
  const locale = await getLocale();
  const de = locale === "de";

  const [tests, cfs] = await Promise.all([
    db.resilienceTest.findMany({
      include: { criticalFunctions: { select: { cfId: true } } },
      orderBy: { plannedFor: "asc" },
    }),
    db.criticalFunction.findMany({
      where: { isCritical: true },
      select: { id: true, cfId: true, name: true, resilienceTests: { select: { id: true, status: true } } },
      orderBy: { cfId: "asc" },
    }),
  ]);

  const tlpt = tests.filter((t) => t.testType === "THREAT_LED");
  const lastTlpt = tlpt
    .filter((t) => t.performedAt)
    .sort((a, b) => b.performedAt!.getTime() - a.performedAt!.getTime())[0];
  const tlptDue = lastTlpt
    ? new Date(lastTlpt.performedAt!.getTime() + 3 * 365 * 86400000)
    : null;

  return (
    <div>
      <PageHeader
        title={de ? "Resilienz-Testprogramm (Art. 24–27)" : "Resilience testing programme (Art. 24–27)"}
        description={
          de
            ? "Jahresplan, Testarten, Testabdeckung je kritischer Funktion und TLPT-Dreijahreszyklus inkl. Einbeziehung von CIF-Dienstleistern (Art. 26 Abs. 3)."
            : "Annual plan, test types, coverage per critical function and the three-year TLPT cycle including CIF providers (Art. 26(3))."
        }
        crumbs={[{ label: "Overview", href: "/overview" }, { label: de ? "Tests" : "Tests" }]}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{de ? "Testabdeckung je CIF" : "Test coverage per CIF"}</CardTitle>
          <CardDescription>
            {de
              ? "Kritische Funktionen ohne abgeschlossenen Test im Programm sind ein Kap.-IV-Knockout-Kandidat."
              : "Critical functions without a completed test in the programme are a Chapter IV knockout candidate."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {cfs.map((cf) => {
            const done = cf.resilienceTests.some((t) => t.status === "COMPLETED");
            const planned = cf.resilienceTests.length > 0;
            return (
              <Badge key={cf.id} variant={done ? "low" : planned ? "medium" : "critical"}>
                {cf.cfId} · {done ? (de ? "getestet" : "tested") : planned ? (de ? "geplant" : "planned") : de ? "ohne Test" : "untested"}
              </Badge>
            );
          })}
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            TLPT: {lastTlpt ? formatDate(lastTlpt.performedAt) : de ? "noch nie" : "never"} ·{" "}
            {de ? "nächster Zyklus bis" : "next cycle by"}{" "}
            {tlptDue ? formatDate(tlptDue) : de ? "sofort fällig" : "due now"}
          </span>
        </CardContent>
      </Card>

      <Table>
        <THead>
          <TR>
            <TH>ID</TH>
            <TH>{de ? "Titel" : "Title"}</TH>
            <TH>{de ? "Art" : "Type"}</TH>
            <TH>{de ? "Geplant" : "Planned"}</TH>
            <TH>{de ? "Durchgeführt" : "Performed"}</TH>
            <TH>Status</TH>
            <TH>{de ? "Ergebnis" : "Result"}</TH>
            <TH>{de ? "Tester" : "Tester"}</TH>
            <TH>CIF</TH>
            <TH>{de ? "Dienstleister einbezogen" : "Providers included"}</TH>
          </TR>
        </THead>
        <TBody>
          {tests.map((t) => (
            <TR key={t.id}>
              <TD className="whitespace-nowrap font-medium">{t.testId}</TD>
              <TD className="max-w-[280px] truncate" title={t.title}>
                {t.title}
              </TD>
              <TD className="whitespace-nowrap text-xs">{t.testType}</TD>
              <TD className="whitespace-nowrap text-xs">{formatDate(t.plannedFor)}</TD>
              <TD className="whitespace-nowrap text-xs">{formatDate(t.performedAt)}</TD>
              <TD>
                <Badge
                  variant={
                    t.status === "COMPLETED" ? "low" : t.status === "PLANNED" ? "secondary" : "medium"
                  }
                >
                  {t.status}
                </Badge>
              </TD>
              <TD>
                {t.result ? (
                  <Badge variant={t.result === "PASSED" ? "low" : t.result === "FAILED" ? "critical" : "medium"}>
                    {t.result}
                  </Badge>
                ) : (
                  "–"
                )}
              </TD>
              <TD className="text-xs">
                {t.tester ?? "–"}
                {t.testerExternal ? ` (${de ? "extern" : "external"})` : ""}
              </TD>
              <TD className="text-xs tabular-nums">
                {t.criticalFunctions.map((c) => c.cfId).join(", ") || "–"}
              </TD>
              <TD className="text-xs">{t.includesProviders ? (de ? "ja" : "yes") : de ? "nein" : "no"}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
