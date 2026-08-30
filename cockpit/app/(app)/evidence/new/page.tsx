import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";
import { PageHeader } from "@/components/page-header";
import { NewEvidenceForm } from "@/features/evidence/panels";

export const metadata = { title: "Neuer Nachweis" };
export const dynamic = "force-dynamic";

export default async function NewEvidencePage() {
  await requirePermission("evidence:write");
  const locale = await getLocale();
  const m = OPS_MESSAGES[locale];
  const [risks, controls, thirdParties] = await Promise.all([
    db.risk.findMany({
      select: { id: true, riskId: true, title: true },
      orderBy: { riskId: "asc" },
    }),
    db.control.findMany({
      select: { id: true, controlId: true, name: true },
      orderBy: { controlId: "asc" },
    }),
    db.thirdParty.findMany({
      select: { id: true, tpId: true, name: true },
      orderBy: { tpId: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={m.evidence.newPage.title}
        description={m.evidence.list.registerNote}
        crumbs={[
          { label: m.common.overview, href: "/overview" },
          { label: m.evidence.list.crumb, href: "/evidence" },
          { label: m.evidence.newPage.crumbNew },
        ]}
      />
      <NewEvidenceForm
        risks={risks.map((r) => ({ id: r.id, label: `${r.riskId} – ${r.title}` }))}
        controls={controls.map((c) => ({ id: c.id, label: `${c.controlId} – ${c.name}` }))}
        thirdParties={thirdParties.map((t) => ({ id: t.id, label: `${t.tpId} – ${t.name}` }))}
        locale={locale}
      />
    </div>
  );
}
