import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { NewRiskForm } from "@/features/risks/new-risk-form";

export const metadata = { title: "Neues Risiko" };

export default async function NewRiskPage() {
  await requirePermission("risk:write");
  const [categories, owners, ous, locations] = await Promise.all([
    db.riskCategory.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: {
        active: true,
        roles: { some: { role: { key: { in: ["RISK_OWNER", "ICT_RISK_MANAGER", "ISO"] } } } },
      },
      orderBy: { name: "asc" },
    }),
    db.organizationalUnit.findMany({ orderBy: { name: "asc" } }),
    db.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Neues Risiko erfassen"
        description="Ersterfassung gemäß Runbook RB-01 – Ursache, Ereignis und Auswirkung getrennt beschreiben."
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Risks", href: "/risks" },
          { label: "Neues Risiko" },
        ]}
      />
      <NewRiskForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        owners={owners.map((o) => ({ id: o.id, name: o.name }))}
        ous={ous.map((o) => ({ id: o.id, name: o.name }))}
        locations={locations.map((l) => ({ id: l.id, name: l.name }))}
      />
    </div>
  );
}
