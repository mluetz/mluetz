import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDate, isOverdue } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";
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
  const locale = await getLocale();
  const m = OPS_MESSAGES[locale];
  const t = m.actions.list;
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
        title={t.title}
        description={t.description}
        crumbs={[{ label: m.common.overview, href: "/overview" }, { label: t.crumb }]}
        actions={
          hasPermission(user, "action:write") ? (
            <Link href="/actions/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden /> {t.newAction}
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
          <Label htmlFor="f-status">{t.statusLabel}</Label>
          <Select id="f-status" name="status" defaultValue={sp.status ?? ""}>
            <option value="">{m.common.all}</option>
            {Object.entries(m.labels.actionStatus).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-priority">{t.priorityLabel}</Label>
          <Select id="f-priority" name="priority" defaultValue={sp.priority ?? ""}>
            <option value="">{m.common.all}</option>
            {Object.entries(m.labels.priority).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-span-2 flex items-end gap-2">
          <Button type="submit" variant="secondary">
            {m.common.filter}
          </Button>
          <Link href="/actions">
            <Button type="button" variant="ghost">
              {m.common.reset}
            </Button>
          </Link>
        </div>
        <div className="col-span-full flex flex-wrap gap-2 text-xs">
          <FilterChip
            href="/actions?overdue=1"
            active={sp.overdue === "1"}
            label={t.chipOverdue}
          />
          <FilterChip
            href="/actions?escalated=1"
            active={sp.escalated === "1"}
            label={t.chipEscalated}
          />
        </div>
      </form>

      <ActionsTableClient rows={rows} locale={locale} />
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
