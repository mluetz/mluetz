import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDate, isOverdue } from "@/lib/utils";
import { ACTION_STATUS, PRIORITY } from "@/lib/domain/enums";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { ActionsTableClient } from "@/features/actions-mgmt/table-client";
import type { ActionMgmtRow } from "@/features/actions-mgmt/columns";

export const metadata = { title: "Maßnahmen" };
export const dynamic = "force-dynamic";

interface Search {
  status?: string;
  priority?: string;
  overdue?: string;
  escalated?: string;
}

export default async function ActionsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requirePermission("action:read");
  const sp = await searchParams;

  const actions = await db.action.findMany({
    where: {
      ...(sp.status ? { status: sp.status } : {}),
      ...(sp.priority ? { priority: sp.priority } : {}),
      ...(sp.escalated === "1" ? { escalationLevel: { gt: 0 } } : {}),
    },
    include: {
      risk: { select: { riskId: true } },
      owner: { select: { name: true } },
    },
    orderBy: { actionId: "asc" },
  });

  let rows: ActionMgmtRow[] = actions.map((a) => {
    const overdue = isOverdue(a.dueDate) && !["COMPLETED", "CLOSED"].includes(a.status);
    return {
      id: a.id,
      actionId: a.actionId,
      title: a.title,
      riskRef: a.risk.riskId,
      ownerName: a.owner?.name ?? null,
      priority: a.priority,
      status: a.status,
      dueDate: a.dueDate ? formatDate(a.dueDate) : null,
      overdue,
      progress: a.progress,
      escalationLevel: a.escalationLevel,
    };
  });
  if (sp.overdue === "1") rows = rows.filter((r) => r.overdue);

  return (
    <div>
      <PageHeader
        title="Maßnahmen"
        description="Alle risikomindernden Maßnahmen mit Status, Fortschritt und Eskalation"
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Maßnahmen" }]}
        actions={
          hasPermission(user, "action:write") ? (
            <Link href="/actions/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden /> Neue Maßnahme
              </Button>
            </Link>
          ) : null
        }
      />

      <form
        method="GET"
        className="mb-4 grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 md:grid-cols-4"
      >
        <div>
          <Label htmlFor="f-status">Status</Label>
          <Select id="f-status" name="status" defaultValue={sp.status ?? ""}>
            <option value="">Alle</option>
            {Object.entries(ACTION_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-priority">Priorität</Label>
          <Select id="f-priority" name="priority" defaultValue={sp.priority ?? ""}>
            <option value="">Alle</option>
            {Object.entries(PRIORITY).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-span-2 flex items-end gap-2">
          <Button type="submit" variant="secondary">
            Filtern
          </Button>
          <Link href="/actions">
            <Button type="button" variant="ghost">
              Zurücksetzen
            </Button>
          </Link>
        </div>
        <div className="col-span-full flex flex-wrap gap-2 text-xs">
          <FilterChip
            href="/actions?overdue=1"
            active={sp.overdue === "1"}
            label="Nur überfällige"
          />
          <FilterChip
            href="/actions?escalated=1"
            active={sp.escalated === "1"}
            label="Eskalationsstufe > 0"
          />
        </div>
      </form>

      <ActionsTableClient rows={rows} />
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={active ? "/actions" : href}
      className={`rounded-full border px-2.5 py-1 ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
    >
      {label}
    </Link>
  );
}
