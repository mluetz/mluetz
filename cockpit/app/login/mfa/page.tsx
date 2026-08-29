import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getMfaContext } from "@/lib/auth/actions";
import { getLocale } from "@/lib/i18n/server";
import { MfaForm } from "./mfa-form";

export const metadata = { title: "Zwei-Faktor-Authentifizierung" };
export const dynamic = "force-dynamic";

export default async function MfaPage() {
  const ctx = await getMfaContext();
  if (!ctx) redirect("/login");
  const locale = await getLocale();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold">ICT &amp; TPRM Cockpit</h1>
        </div>
        <MfaForm
          mode={ctx.mode}
          email={ctx.email}
          secret={ctx.secret}
          otpauthUri={ctx.otpauthUri}
          locale={locale}
        />
      </div>
    </main>
  );
}
