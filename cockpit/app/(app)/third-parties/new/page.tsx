import { requirePermission } from "@/lib/authz";
import { getLocale } from "@/lib/i18n/server";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";
import { PageHeader } from "@/components/page-header";
import { NewThirdPartyForm } from "@/features/third-parties/panels";

export const metadata = { title: "Neue Drittpartei" };
export const dynamic = "force-dynamic";

export default async function NewThirdPartyPage() {
  await requirePermission("thirdparty:write");
  const locale = await getLocale();
  const t = TPRM_MESSAGES[locale];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={t.tp.new.title}
        description={t.tp.new.description}
        crumbs={[
          { label: t.tp.list.crumbOverview, href: "/overview" },
          { label: t.tp.list.crumbThirdParties, href: "/third-parties" },
          { label: t.tp.new.crumb },
        ]}
      />
      <NewThirdPartyForm locale={locale} />
    </div>
  );
}
