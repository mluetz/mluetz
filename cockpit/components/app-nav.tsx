"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  ListChecks,
  ShieldCheck,
  Building2,
  Network,
  BookMarked,
  ClipboardCheck,
  BookOpenCheck,
  Gauge,
  GraduationCap,
  Swords,
  FileArchive,
  BarChart3,
  Scale,
  Settings,
  ScrollText,
  Siren,
  SearchCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof icons;
  /** Anzahl offener/überfälliger Posten; > 0 mit alert=true wird rot. */
  badge?: number;
  alert?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

const icons = {
  overview: LayoutDashboard,
  risks: ShieldAlert,
  actions: ListChecks,
  controls: ShieldCheck,
  thirdparties: Building2,
  cif: Network,
  register: BookMarked,
  assessments: ClipboardCheck,
  runbooks: BookOpenCheck,
  playbooks: Swords,
  evidence: FileArchive,
  reports: BarChart3,
  governance: Scale,
  doraCompliance: Gauge,
  dora: GraduationCap,
  incidents: Siren,
  findings: SearchCheck,
  admin: Settings,
  audit: ScrollText,
} as const;

/**
 * Gruppierte Navigation (Redesign Welle 4, D-04): vier Gruppen mit
 * Überschrift und Badge-Zahlen für offene/überfällige Posten — die
 * Navigation ersetzt damit die halbe Dashboard-Arbeit.
 */
export function AppNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Hauptnavigation" className="flex flex-col gap-0.5 p-2">
      {groups.map((group) => (
        <div key={group.title}>
          <h3 className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:pt-1">
            {group.title}
          </h3>
          {group.items.map((item) => {
            const Icon = icons[item.icon];
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge != null && item.badge > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums leading-none",
                      item.alert
                        ? "bg-status-overdue-bg text-status-overdue"
                        : "bg-status-muted-bg text-status-muted",
                      active && "bg-primary-foreground/20 text-primary-foreground",
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
