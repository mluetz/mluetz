import Link from "next/link";
import { ShieldCheck, LogOut } from "lucide-react";
import { requireUser } from "@/lib/authz";
import { hasPermission } from "@/lib/authz";
import { logout } from "@/lib/auth/actions";
import { AppNav, type NavItem } from "@/components/app-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLES } from "@/lib/domain/enums";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const items: NavItem[] = [
    { href: "/overview", label: "Overview", icon: "overview" },
    { href: "/risks", label: "Risks", icon: "risks" },
    { href: "/actions", label: "Actions", icon: "actions" },
    { href: "/controls", label: "Controls", icon: "controls" },
    { href: "/third-parties", label: "Third Parties", icon: "thirdparties" },
    { href: "/assessments", label: "Assessments", icon: "assessments" },
    { href: "/runbooks", label: "Runbooks", icon: "runbooks" },
    { href: "/playbooks", label: "Playbooks", icon: "playbooks" },
    { href: "/evidence", label: "Evidence", icon: "evidence" },
    { href: "/reports", label: "Reports", icon: "reports" },
    { href: "/governance", label: "Governance", icon: "governance" },
    { href: "/dora", label: "DORA Compliance", icon: "doraCompliance" },
    { href: "/dora-knowledge", label: "DORA Wissensbasis", icon: "dora" },
  ];
  if (hasPermission(user, "audit:read")) {
    items.push({ href: "/audit-log", label: "Audit Trail", icon: "audit" });
  }
  if (hasPermission(user, "admin")) {
    items.push({ href: "/admin", label: "Administration", icon: "admin" });
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
            <span className="text-xs font-normal text-muted-foreground">Risk Cockpit</span>
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
          <p className="truncate text-xs text-muted-foreground">
            Demo-Umgebung – ausschließlich synthetische Daten. Kein freigegebenes GRC-System.
          </p>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4" aria-hidden />
                Abmelden
              </Button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
