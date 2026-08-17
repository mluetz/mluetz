import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/server";
import { CHROME_MESSAGES } from "@/lib/i18n/messages/chrome";
import { LanguageToggle } from "@/components/language-toggle";
import { LoginForm } from "./login-form";

export const metadata = { title: "Anmeldung" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/overview");
  const demoEnabled = process.env.AUTH_DEMO_LOGIN === "true";
  const locale = await getLocale();
  const t = CHROME_MESSAGES[locale].login;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-end">
          <LanguageToggle locale={locale} />
        </div>
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold">ICT &amp; TPRM Cockpit</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <LoginForm demoEnabled={demoEnabled} locale={locale} />
        <p className="text-center text-xs text-muted-foreground">{t.demoNote}</p>
      </div>
    </main>
  );
}
