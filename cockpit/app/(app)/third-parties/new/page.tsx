import { requirePermission } from "@/lib/authz";
import { PageHeader } from "@/components/page-header";
import { NewThirdPartyForm } from "@/features/third-parties/panels";

export const metadata = { title: "Neue Drittpartei" };
export const dynamic = "force-dynamic";

export default async function NewThirdPartyPage() {
  await requirePermission("thirdparty:write");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Neue Drittpartei erfassen"
        description="Ersterfassung im TPRM-Workflow – die Drittpartei startet im Status Initial Screening."
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "Third Parties", href: "/third-parties" },
          { label: "Neue Drittpartei" },
        ]}
      />
      <NewThirdPartyForm />
    </div>
  );
}
