import { requirePermission } from "@/lib/authz";
import { getLocale } from "@/lib/i18n/server";
import { PageHeader } from "@/components/page-header";
import { AnalysisFrame } from "@/components/analysis-frame";
import { ODDO_BHF_VERGLEICH_HTML } from "@/lib/content/analyses/oddo-bhf-vergleich";

export const metadata = { title: "ODDO BHF Vergleich" };
export const dynamic = "force-dynamic";

/**
 * Marktanalyse "ODDO BHF im Privatbanken-Vergleich" als eingebettetes
 * Dokument. Der Inhalt liegt versioniert in lib/content/analyses/ und
 * ist nur für angemeldete Benutzer mit Leserecht erreichbar.
 */
export default async function OddoBhfVergleichPage() {
  await requirePermission("risk:read");
  const locale = await getLocale();
  const de = locale === "de";

  return (
    <div>
      <PageHeader
        title={de ? "ODDO BHF Vergleich" : "ODDO BHF Comparison"}
        description={
          de
            ? "Marktanalyse: ODDO BHF im europäischen Privatbanken-Vergleich (Stand 04.09.2026, Dokument in deutscher Sprache)."
            : "Market analysis: ODDO BHF compared with European private banks (as of 2026-09-04, document in German)."
        }
      />
      <AnalysisFrame html={ODDO_BHF_VERGLEICH_HTML} title="ODDO BHF im Privatbanken-Vergleich" />
    </div>
  );
}
