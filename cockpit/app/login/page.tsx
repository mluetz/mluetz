import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Anmeldung" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/overview");
  const demoEnabled = process.env.AUTH_DEMO_LOGIN === "true";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold">ICT &amp; TPRM Cockpit</h1>
          <p className="text-sm text-muted-foreground">
            Informationssicherheits-, ICT- und Third-Party-Risikomanagement
          </p>
        </div>
        <LoginForm demoEnabled={demoEnabled} />
        <p className="text-center text-xs text-muted-foreground">
          Demo-Umgebung mit ausschließlich synthetischen Daten. Demo-Zugänge: siehe README
          (z.&nbsp;B. <code>riskmanager@demo.example</code>).
        </p>
      </div>
    </main>
  );
}
