import Link from "next/link";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Kritische Funktionen (CIF)" };
export const dynamic = "force-dynamic";

const TEXT = {
  de: {
    title: "Kritische / wichtige Funktionen (CIF)",
    description:
      "Register nach Art. 3 Nr. 22 DORA mit Bewertungsverfahren, Wiederanlaufkenngrößen und Abhängigkeiten. Die CIF-Einstufung von Drittparteien wird ausschließlich aus diesen Verknüpfungen abgeleitet.",
    crumbOverview: "Overview",
    colId: "ID",
    colName: "Funktion",
    colClass: "Einstufung",
    colOwner: "Eigentümer",
    colRto: "RTO / RPO (h)",
    colProviders: "Drittparteien",
    colServices: "ICT-Services",
    colNext: "Nächste Bewertung",
    critical: "kritisch",
    important: "wichtig",
    spof: "SPOF",
  },
  en: {
    title: "Critical / important functions (CIF)",
    description:
      "Register per Art. 3(22) DORA with assessment procedure, recovery parameters and dependencies. Third-party CIF classification is derived exclusively from these links.",
    crumbOverview: "Overview",
    colId: "ID",
    colName: "Function",
    colClass: "Classification",
    colOwner: "Owner",
    colRto: "RTO / RPO (h)",
    colProviders: "Third parties",
    colServices: "ICT services",
    colNext: "Next assessment",
    critical: "critical",
    important: "important",
    spof: "SPOF",
  },
} as const;

export default async function CifListPage() {
  await requirePermission("thirdparty:read");
  const locale = await getLocale();
  const t = TEXT[locale];

  const cfs = await db.criticalFunction.findMany({
    include: {
      owner: { select: { name: true } },
      _count: { select: { thirdParties: true, ictServices: true, risks: true } },
    },
    orderBy: { cfId: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        crumbs={[{ label: t.crumbOverview, href: "/overview" }, { label: "CIF" }]}
      />
      <Table>
        <THead>
          <TR>
            <TH>{t.colId}</TH>
            <TH>{t.colName}</TH>
            <TH>{t.colClass}</TH>
            <TH>{t.colOwner}</TH>
            <TH>{t.colRto}</TH>
            <TH>{t.colProviders}</TH>
            <TH>{t.colServices}</TH>
            <TH>{t.colNext}</TH>
          </TR>
        </THead>
        <TBody>
          {cfs.map((cf) => (
            <TR key={cf.id}>
              <TD className="whitespace-nowrap font-medium tabular-nums">
                <Link href={`/cif/${cf.id}`} className="text-primary hover:underline">
                  {cf.cfId}
                </Link>
              </TD>
              <TD>{cf.name}</TD>
              <TD>
                <Badge variant={cf.isCritical ? "critical" : "medium"}>
                  {cf.isCritical ? t.critical : t.important}
                </Badge>
                {cf.isCritical && cf._count.thirdParties === 1 ? (
                  <Badge variant="high" className="ml-1">
                    {t.spof}
                  </Badge>
                ) : null}
              </TD>
              <TD className="whitespace-nowrap">{cf.owner?.name ?? "–"}</TD>
              <TD className="whitespace-nowrap tabular-nums">
                {cf.rtoHours ?? "–"} / {cf.rpoHours ?? "–"}
              </TD>
              <TD className="tabular-nums">{cf._count.thirdParties}</TD>
              <TD className="tabular-nums">{cf._count.ictServices}</TD>
              <TD className="whitespace-nowrap tabular-nums">
                {formatDate(cf.nextAssessmentDate)}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
