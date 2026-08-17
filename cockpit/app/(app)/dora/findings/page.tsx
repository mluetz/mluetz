import Link from "next/link";
import { Plus } from "lucide-react";
import { hasPermission, requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { isOverdue } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FindingsTableClient } from "@/features/dora/findings-table-client";
import type { DoraFindingRow } from "@/features/dora/findings-columns";

export const metadata = { title: "DORA-Findings" };
export const dynamic = "force-dynamic";

interface Search {
  open?: string;
  overdue?: string;
  critical?: string;
}

export default async function DoraFindingsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requirePermission("compliance:read");
  const sp = await searchParams;
  const findings = await db.doraFinding.findMany({
    include: {
      requirement: { select: { id: true, reqId: true } },
      action: { select: { id: true, actionId: true } },
    },
    orderBy: { detectedAt: "desc" },
  });

  let rows: DoraFindingRow[] = findings.map((f) => ({
    id: f.id,
    findingId: f.findingId,
    title: f.title,
    reqId: f.requirement?.reqId ?? null,
    requirementDbId: f.requirement?.id ?? null,
    source: f.source,
    severity: f.severity,
    remediationDueAt: f.remediationDueAt,
    overdue: f.status !== "CLOSED" && isOverdue(f.remediationDueAt),
    status: f.status,
    actionDbId: f.action?.id ?? null,
    actionId: f.action?.actionId ?? null,
    escalatedTo: f.escalatedTo,
  }));

  if (sp.open === "1") rows = rows.filter((r) => r.status !== "CLOSED");
  if (sp.overdue === "1") rows = rows.filter((r) => r.overdue);
  if (sp.critical === "1") rows = rows.filter((r) => r.severity === "CRITICAL");

  return (
    <div>
      <PageHeader
        title="DORA-Findings"
        description="Feststellungen mit Fristen, Eskalation und CAPA-Verknüpfung (FRWK-DORA-001 Kap. 12)"
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "DORA", href: "/dora" },
          { label: "Findings" },
        ]}
        actions={
          hasPermission(user, "compliance:write") ? (
            <Link href="/dora/findings/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden /> Neues Finding
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-lg border bg-card p-3 text-xs">
        <FilterChip href="/dora/findings?open=1" active={sp.open === "1"} label="Offen" />
        <FilterChip href="/dora/findings?overdue=1" active={sp.overdue === "1"} label="Überfällig" />
        <FilterChip href="/dora/findings?critical=1" active={sp.critical === "1"} label="Kritisch" />
      </div>

      <FindingsTableClient rows={rows} />
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={active ? "/dora/findings" : href}
      className={`rounded-full border px-2.5 py-1 ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
    >
      {label}
    </Link>
  );
}
