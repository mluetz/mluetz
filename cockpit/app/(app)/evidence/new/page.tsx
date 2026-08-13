import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { NewEvidenceForm } from "@/features/evidence/panels";

export const metadata = { title: "Neuer Nachweis" };
export const dynamic = "force-dynamic";

export default async function NewEvidencePage() {
  await requirePermission("evidence:write");
  const [risks, controls, thirdParties] = await Promise.all([
    db.risk.findMany({ select: { id: true, riskId: true, title: true }, orderBy: { riskId: "asc" } }),
    db.control.findMany({ select: { id: true, controlId: true, name: true }, orderBy: { controlId: "asc" } }),
    db.thirdParty.findMany({ select: { id: true, tpId: true, name: true }, orderBy: { tpId: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Neuen Nachweis erfassen"
        description="Metadaten- und Linkregister – es werden keine Dokumente gespeichert."
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Nachweise", href: "/evidence" },
          { label: "Neuer Nachweis" },
        ]}
      />
      <NewEvidenceForm
        risks={risks.map((r) => ({ id: r.id, label: `${r.riskId} – ${r.title}` }))}
        controls={controls.map((c) => ({ id: c.id, label: `${c.controlId} – ${c.name}` }))}
        thirdParties={thirdParties.map((t) => ({ id: t.id, label: `${t.tpId} – ${t.name}` }))}
      />
    </div>
  );
}
