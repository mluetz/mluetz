import Link from "next/link";
import { ShieldCheck, LogOut } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { hasPermission } from "@/lib/authz";
import { logout } from "@/lib/auth/actions";
import { getLocale } from "@/lib/i18n/server";
import { CHROME_MESSAGES } from "@/lib/i18n/messages/chrome";
import { AppNav, type NavGroup } from "@/components/app-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { ROLES } from "@/lib/domain/enums";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const locale = await getLocale();
  const t = CHROME_MESSAGES[locale];
  const de = locale === "de";
  const now = new Date();

  // Badge-Zahlen (D-04): offene/überfällige Posten je Navigationseintrag.
  const [
    overdueActions,
    overdueRiskReviews,
    weakControls,
    overdueTpReviews,
    openIncidents,
    openFindings,
    expiredEvidence,
  ] = await Promise.all([
    db.action.count({
      where: { status: { notIn: ["COMPLETED", "CLOSED"] }, dueDate: { lt: now } },
    }),
    db.risk.count({
      where: { status: { notIn: ["CLOSED", "REJECTED"] }, nextReviewDate: { lt: now } },
    }),
    db.control.count({
      where: { operatingEffectiveness: { in: ["INEFFECTIVE", "PARTIALLY_EFFECTIVE"] } },
    }),
    db.thirdParty.count({ where: { status: { not: "EXIT" }, nextReviewDate: { lt: now } } }),
    db.incident.count({ where: { status: { not: "CLOSED" } } }),
    db.doraFinding.count({ where: { status: { not: "CLOSED" } } }),
    db.evidence.count({ where: { validUntil: { lt: now } } }),
  ]);

  // Vier Gruppen (Redesign Welle 4, D-04)
  const groups: NavGroup[] = [
    {
      title: de ? "Steuerung" : "Steering",
      items: [
        { href: "/overview", label: t.nav.overview, icon: "overview" },
        { href: "/risks", label: t.nav.risks, icon: "risks", badge: overdueRiskReviews, alert: true },
        { href: "/actions", label: t.nav.actions, icon: "actions", badge: overdueActions, alert: true },
        { href: "/controls", label: t.nav.controls, icon: "controls", badge: weakControls },
        { href: "/assessments", label: t.nav.assessments, icon: "assessments" },
      ],
    },
    {
      title: de ? "Drittparteien" : "Third Parties",
      items: [
        {
          href: "/third-parties",
          label: t.nav.thirdParties,
          icon: "thirdparties",
          badge: overdueTpReviews,
          alert: true,
        },
        {
          href: "/cif",
          label: de ? "Kritische Funktionen" : "Critical Functions",
          icon: "cif",
        },
        {
          href: "/register",
          label: de ? "Informationsregister" : "Register of Information",
          icon: "register",
        },
      ],
    },
    {
      title: "DORA",
      items: [
        { href: "/dora", label: t.nav.doraCompliance, icon: "doraCompliance" },
        {
          href: "/dora/incidents",
          label: de ? "Vorfälle" : "Incidents",
          icon: "incidents",
          badge: openIncidents,
          alert: true,
        },
        {
          href: "/dora/findings",
          label: "Findings",
          icon: "findings",
          badge: openFindings,
        },
        { href: "/dora/tests", label: de ? "Testprogramm" : "Testing", icon: "assessments" },
        {
          href: "/dora/threat-intel",
          label: "Threat Intel",
          icon: "findings",
        },
        { href: "/dora-knowledge", label: t.nav.doraKnowledge, icon: "dora" },
        { href: "/runbooks", label: t.nav.runbooks, icon: "runbooks" },
        { href: "/playbooks", label: t.nav.playbooks, icon: "playbooks" },
      ],
    },
    {
      title: de ? "Nachweis & Betrieb" : "Evidence & Operations",
      items: [
        {
          href: "/evidence",
          label: t.nav.evidence,
          icon: "evidence",
          badge: expiredEvidence,
          alert: true,
        },
        { href: "/reports", label: t.nav.reports, icon: "reports" },
        { href: "/governance", label: t.nav.governance, icon: "governance" },
      ],
    },
  ];
  if (hasPermission(user, "audit:read")) {
    groups[3]!.items.push({ href: "/audit-log", label: t.nav.auditTrail, icon: "audit" });
  }
  if (hasPermission(user, "admin")) {
    groups[3]!.items.push({ href: "/admin", label: t.nav.admin, icon: "admin" });
  }

  const roleLabels = user.roles.map((r) => ROLES[r]).join(", ");
  // Umgebungskennzeichen aus der Konfiguration (D-14), schmal statt Banner.
  const environment = (process.env.APP_ENVIRONMENT ?? "demo").toLowerCase();
  const tenant = process.env.APP_TENANT_NAME ?? "Nordlicht Bank AG";
  const envStyles: Record<string, string> = {
    demo: "bg-status-due-soon-bg text-status-due-soon",
    test: "bg-status-muted-bg text-status-muted",
    prod: "bg-status-ok-bg text-status-ok",
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Umgebungsband: schmal, aus der Konfiguration (D-14) */}
      <div
        className={`no-print px-2 py-0.5 text-center text-[11px] font-semibold uppercase tracking-wider ${envStyles[environment] ?? envStyles.demo}`}
      >
        {environment === "prod"
          ? de
            ? "Produktivumgebung"
            : "Production"
          : environment === "test"
            ? de
              ? "Testumgebung"
              : "Test environment"
            : de
              ? "Demo-Umgebung · Synthetikdaten"
              : "Demo environment · synthetic data"}
      </div>

      {/* Druck-/Nachweiskopf (D-12): nur im Druck sichtbar */}
      <div className="print-only border-b pb-2 text-xs">
        <strong>ICT &amp; TPRM Cockpit</strong> · {tenant} · {de ? "Datenstand" : "Data as of"}:{" "}
        {formatDateTime(now)} · {de ? "Benutzer" : "User"}: {user.name} ({roleLabels})
      </div>

      <div className="flex min-h-0 flex-1">
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
            <AppNav groups={groups} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Kopfzeile (D-14): Mandant, Datenstand, Benutzer mit Rolle */}
          <header className="no-print sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur">
            <div className="flex min-w-0 items-baseline gap-4">
              <span className="truncate text-sm font-semibold">{tenant}</span>
              <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                {de ? "Datenstand" : "Data as of"} {formatDateTime(now)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-xs font-semibold leading-tight">{user.name}</p>
                <p
                  className="max-w-56 truncate text-[11px] leading-tight text-muted-foreground"
                  title={roleLabels}
                >
                  {roleLabels}
                </p>
              </div>
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
    </div>
  );
}
