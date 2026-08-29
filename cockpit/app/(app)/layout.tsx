import Link from "next/link";
import { ShieldCheck, LogOut } from "lucide-react";
import { requireUser } from "@/lib/authz";
import { hasPermission } from "@/lib/authz";
import { logout } from "@/lib/auth/actions";
import { getLocale } from "@/lib/i18n/server";
import { CHROME_MESSAGES } from "@/lib/i18n/messages/chrome";
import { AppNav, type NavItem } from "@/components/app-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { ROLES } from "@/lib/domain/enums";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const locale = await getLocale();
  const t = CHROME_MESSAGES[locale];

  const items: NavItem[] = [
    { href: "/overview", label: t.nav.overview, icon: "overview" },
    { href: "/risks", label: t.nav.risks, icon: "risks" },
    { href: "/actions", label: t.nav.actions, icon: "actions" },
    { href: "/controls", label: t.nav.controls, icon: "controls" },
    { href: "/third-parties", label: t.nav.thirdParties, icon: "thirdparties" },
    { href: "/cif", label: locale === "de" ? "Kritische Funktionen" : "Critical Functions", icon: "cif" },
    { href: "/assessments", label: t.nav.assessments, icon: "assessments" },
    { href: "/runbooks", label: t.nav.runbooks, icon: "runbooks" },
    { href: "/playbooks", label: t.nav.playbooks, icon: "playbooks" },
    { href: "/evidence", label: t.nav.evidence, icon: "evidence" },
    { href: "/reports", label: t.nav.reports, icon: "reports" },
    { href: "/governance", label: t.nav.governance, icon: "governance" },
    { href: "/dora", label: t.nav.doraCompliance, icon: "doraCompliance" },
    { href: "/dora-knowledge", label: t.nav.doraKnowledge, icon: "dora" },
  ];
  if (hasPermission(user, "audit:read")) {
    items.push({ href: "/audit-log", label: t.nav.auditTrail, icon: "audit" });
  }
  if (hasPermission(user, "admin")) {
    items.push({ href: "/admin", label: t.nav.admin, icon: "admin" });
  }

  const roleLabels = user.roles.map((r) => ROLES[r]).join(", ");

  return (
    <div className="flex min-h-screen">
      <aside className="no-print hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
        <Link href="/overview" className="flex items-center gap-2 border-b px-4 py-3.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-semibold leading-tight">
            ICT &amp; TPRM
            <br />
            <span className="text-xs font-normal text-muted-foreground">{t.brand.subtitle}</span>
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <AppNav items={items} />
        </div>
        <div className="border-t p-3 text-xs">
          <p className="font-medium">{user.name}</p>
          <p className="truncate text-muted-foreground" title={roleLabels}>
            {roleLabels}
          </p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <p className="truncate text-xs text-muted-foreground">{t.header.demoBanner}</p>
          <div className="flex items-center gap-1.5">
            <LanguageToggle locale={locale} />
            <ThemeToggle />
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4" aria-hidden />
                {t.header.logout}
              </Button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
