import Link from "next/link";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDate, isOverdue } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { ControlsTableClient } from "@/features/controls/table-client";
import type { ControlRow } from "@/features/controls/columns";

export const metadata = { title: "Control Library" };
export const dynamic = "force-dynamic";

interface Search {
  type?: string;
  automation?: string;
  effectiveness?: string;
  testOverdue?: string;
  weak?: string;
}

export default async function ControlsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requirePermission("control:read");
  const locale = await getLocale();
  const m = OPS_MESSAGES[locale];
  const t = m.controls.list;
  const sp = await searchParams;

  const controls = await db.control.findMany({
    where: {
      ...(sp.type ? { controlType: sp.type } : {}),
      ...(sp.automation ? { automation: sp.automation } : {}),
      ...(sp.effectiveness ? { operatingEffectiveness: sp.effectiveness } : {}),
      ...(sp.weak === "1"
        ? { operatingEffectiveness: { in: ["INEFFECTIVE", "PARTIALLY_EFFECTIVE"] } }
        : {}),
    },
    include: {
      owner: { select: { name: true } },
      _count: { select: { risks: true } },
    },
    orderBy: { controlId: "asc" },
  });

  let rows: ControlRow[] = controls.map((c) => ({
    id: c.id,
    controlId: c.controlId,
    name: c.name,
    controlType: c.controlType,
    automation: c.automation,
    frequency: c.frequency,
    ownerName: c.owner?.name ?? null,
    designEffectiveness: c.designEffectiveness,
    operatingEffectiveness: c.operatingEffectiveness,
    nextTestDate: c.nextTestDate ? formatDate(c.nextTestDate) : null,
    testOverdue: isOverdue(c.nextTestDate),
    riskCount: c._count.risks,
  }));
  if (sp.testOverdue === "1") rows = rows.filter((r) => r.testOverdue);

  return (
    <div>
      <PageHeader
        title={t.title}
        description={t.description}
        crumbs={[{ label: m.common.overview, href: "/overview" }, { label: t.crumb }]}
      />

      <form
        method="GET"
        className="mb-4 grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 md:grid-cols-5"
      >
        <div>
          <Label htmlFor="f-type">{t.typeLabel}</Label>
          <Select id="f-type" name="type" defaultValue={sp.type ?? ""}>
            <option value="">{m.common.all}</option>
            {Object.entries(m.labels.controlType).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-automation">{t.automationLabel}</Label>
          <Select id="f-automation" name="automation" defaultValue={sp.automation ?? ""}>
            <option value="">{m.common.all}</option>
            {Object.entries(m.labels.automation).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-effectiveness">{t.effectivenessLabel}</Label>
          <Select id="f-effectiveness" name="effectiveness" defaultValue={sp.effectiveness ?? ""}>
            <option value="">{m.common.all}</option>
            {Object.entries(m.labels.effectiveness).map(([k, v]) => (
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
          <Link href="/controls">
            <Button type="button" variant="ghost">
              {m.common.reset}
            </Button>
          </Link>
        </div>
        <div className="col-span-full flex flex-wrap gap-2 text-xs">
          <FilterChip
            href="/controls?testOverdue=1"
            active={sp.testOverdue === "1"}
            label={t.chipTestOverdue}
          />
        </div>
      </form>

      <ControlsTableClient rows={rows} locale={locale} />
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={active ? "/controls" : href}
      className={`rounded-full border px-2.5 py-1 ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
    >
      {label}
    </Link>
  );
}
