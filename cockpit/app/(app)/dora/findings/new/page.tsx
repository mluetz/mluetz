import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { NewFindingForm } from "@/features/dora/findings-panels";

export const metadata = { title: "Neues Finding" };
export const dynamic = "force-dynamic";

export default async function NewDoraFindingPage() {
  await requirePermission("compliance:write");
  const [requirements, actions] = await Promise.all([
    db.doraRequirement.findMany({
      select: { id: true, reqId: true, title: true },
      orderBy: { reqId: "asc" },
    }),
    db.action.findMany({
      where: { status: { notIn: ["CLOSED", "COMPLETED"] } },
      select: { id: true, actionId: true, title: true },
      orderBy: { actionId: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Neues Finding erfassen"
        description="Feststellung aus Selbstbewertung, Test, Vorfall, Dienstleisterprüfung oder Audit – Fristen werden aus dem Schweregrad abgeleitet."
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "DORA", href: "/dora" },
          { label: "Findings", href: "/dora/findings" },
          { label: "Neues Finding" },
        ]}
      />
      <NewFindingForm
        requirements={requirements.map((r) => ({
          id: r.id,
          label: `${r.reqId} – ${r.title.length > 60 ? `${r.title.slice(0, 60)}…` : r.title}`,
        }))}
        actions={actions.map((a) => ({
          id: a.id,
          label: `${a.actionId} – ${a.title.length > 60 ? `${a.title.slice(0, 60)}…` : a.title}`,
        }))}
      />
    </div>
  );
}
