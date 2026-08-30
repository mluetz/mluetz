import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { DORA_MESSAGES } from "@/lib/i18n/messages/dora";
import { PageHeader } from "@/components/page-header";
import { NewIncidentForm } from "@/features/dora/incident-panels";

export const metadata = { title: "Vorfall erfassen" };
export const dynamic = "force-dynamic";

export default async function NewIncidentPage() {
  await requirePermission("incident:write");
  const locale = await getLocale();
  const t = DORA_MESSAGES[locale];
  const [criticalFunctions, thirdParties] = await Promise.all([
    db.criticalFunction.findMany({ orderBy: { name: "asc" } }),
    db.thirdParty.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={t.incidents.newTitle}
        description={t.incidents.newDescription}
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Incidents", href: "/dora/incidents" },
          { label: t.incidents.newTitle },
        ]}
      />
      <NewIncidentForm
        criticalFunctions={criticalFunctions.map((f) => ({ id: f.id, name: f.name }))}
        thirdParties={thirdParties.map((t2) => ({ id: t2.id, name: `${t2.tpId} ${t2.name}` }))}
        locale={locale}
      />
    </div>
  );
}
