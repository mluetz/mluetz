"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  ListChecks,
  ShieldCheck,
  Building2,
  ClipboardCheck,
  BookOpenCheck,
  Gauge,
  GraduationCap,
  Landmark,
  Swords,
  FileArchive,
  BarChart3,
  Scale,
  Settings,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof icons;
}

const icons = {
  overview: LayoutDashboard,
  risks: ShieldAlert,
  actions: ListChecks,
  controls: ShieldCheck,
  thirdparties: Building2,
  assessments: ClipboardCheck,
  runbooks: BookOpenCheck,
  playbooks: Swords,
  evidence: FileArchive,
  reports: BarChart3,
  governance: Scale,
  doraCompliance: Gauge,
  dora: GraduationCap,
  market: Landmark,
  admin: Settings,
  audit: ScrollText,
} as const;

export function AppNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Hauptnavigation" className="flex flex-col gap-0.5 p-2">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
