import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { NewIncidentForm } from "@/features/dora/incident-panels";

export const metadata = { title: "Vorfall erfassen" };
export const dynamic = "force-dynamic";

export default async function NewIncidentPage() {
  await requirePermission("incident:write");
  const [criticalFunctions, thirdParties] = await Promise.all([
    db.criticalFunction.findMany({ orderBy: { name: "asc" } }),
    db.thirdParty.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Vorfall erfassen"
        description="Die Kenntniserlangung startet alle Fristen (RB-21). Erstmeldung: 4 h nach Klassifizierung, spätestens 24 h nach Kenntnis."
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Incidents", href: "/dora/incidents" },
          { label: "Vorfall erfassen" },
        ]}
      />
      <NewIncidentForm
        criticalFunctions={criticalFunctions.map((f) => ({ id: f.id, name: f.name }))}
        thirdParties={thirdParties.map((t) => ({ id: t.id, name: `${t.tpId} ${t.name}` }))}
      />
    </div>
  );
}
