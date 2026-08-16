import Link from "next/link";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DoraKnowledgeBase, GlossaryIndex } from "@/features/dora/knowledge-client";
import { COMPLIANCE_DISCLAIMER } from "@/lib/domain/enums";

export const metadata = { title: "DORA Wissensbasis" };
export const dynamic = "force-dynamic";

export default async function DoraKnowledgePage() {
  await requirePermission("risk:read");

  // Live-Bezug zum eigenen Umsetzungsstand (DORA-Mappings aus dem Governance-Modul)
  const doraMappings = await db.complianceMapping.findMany({
    where: { requirement: { framework: { in: ["DORA", "DORA_RTS"] } } },
    select: { status: true },
  });
  const total = doraMappings.length;
  const positive = doraMappings.filter((m) =>
    ["IMPLEMENTED", "EFFECTIVE"].includes(m.status),
  ).length;
  const remediation = doraMappings.filter((m) =>
    ["INEFFECTIVE", "REMEDIATION_REQUIRED"].includes(m.status),
  ).length;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="DORA ISRM Wissensbasis"
        description="Die fünf Kernsäulen der Verordnung (EU) 2022/2554 – aufbereitet für das Informationssicherheits-Risikomanagement einer Bank. Markierte Fachbegriffe sind anklickbar und öffnen eine Kurzerklärung."
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "DORA Wissensbasis" }]}
      />

      <div className="mb-4 rounded-lg border bg-accent/40 p-3 text-xs">
        <p>
          <span className="font-semibold">Eigener Umsetzungsstand:</span> {total} DORA-Anforderungen
          im Mapping erfasst, davon {positive} umgesetzt/wirksam und {remediation} mit
          Remediation-Bedarf –{" "}
          <Link href="/governance?framework=DORA" className="text-primary underline">
            zum Governance-Mapping
          </Link>{" "}
          ·{" "}
          <Link href="/reports/DORA_READINESS" className="text-primary underline">
            DORA-Readiness-Report
          </Link>
        </p>
      </div>

      <DoraKnowledgeBase />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Glossar – alle Fachbegriffe</CardTitle>
          <CardDescription>
            Alphabetischer Schnellzugriff auf alle in den Texten erklärten Begriffe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GlossaryIndex />
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">{COMPLIANCE_DISCLAIMER}</p>
    </div>
  );
}
