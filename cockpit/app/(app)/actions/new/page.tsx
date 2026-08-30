import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { NewActionForm } from "@/features/actions-mgmt/new-action-form";

export const metadata = { title: "Neue Maßnahme" };
export const dynamic = "force-dynamic";

export default async function NewActionPage({
  searchParams,
}: {
  searchParams: Promise<{ riskId?: string }>;
}) {
  await requirePermission("action:write");
  const sp = await searchParams;
  const [risks, owners] = await Promise.all([
    db.risk.findMany({
      where: { status: { notIn: ["CLOSED", "REJECTED"] } },
      select: { id: true, riskId: true, title: true },
      orderBy: { riskId: "asc" },
    }),
    db.user.findMany({
      where: {
        active: true,
        roles: { some: { role: { key: { in: ["ACTION_OWNER", "ICT_RISK_MANAGER"] } } } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Neue Maßnahme erfassen"
        description="Risikomindernde Maßnahme anlegen – Status startet als Planned und folgt dem Maßnahmen-Workflow."
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Maßnahmen", href: "/actions" },
          { label: "Neue Maßnahme" },
        ]}
      />
      <NewActionForm
        risks={risks.map((r) => ({ id: r.id, name: `${r.riskId} – ${r.title}` }))}
        owners={owners.map((o) => ({ id: o.id, name: o.name }))}
        presetRiskId={sp.riskId}
      />
    </div>
  );
}
