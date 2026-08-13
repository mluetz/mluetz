import Link from "next/link";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatDate, isOverdue } from "@/lib/utils";
import { EFFECTIVENESS_RATING } from "@/lib/domain/enums";
import { AUTOMATION_LABELS, CONTROL_TYPE_LABELS } from "@/features/controls/labels";
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
}

export default async function ControlsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requirePermission("control:read");
  const sp = await searchParams;

  const controls = await db.control.findMany({
    where: {
      ...(sp.type ? { controlType: sp.type } : {}),
      ...(sp.automation ? { automation: sp.automation } : {}),
      ...(sp.effectiveness ? { operatingEffectiveness: sp.effectiveness } : {}),
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
        title="Control Library"
        description="Zentrale Bibliothek aller Kontrollen mit Wirksamkeit und Testplanung"
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Controls" }]}
      />

      <form method="GET" className="mb-4 grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 md:grid-cols-5">
        <div>
          <Label htmlFor="f-type">Typ</Label>
          <Select id="f-type" name="type" defaultValue={sp.type ?? ""}>
            <option value="">Alle</option>
            {Object.entries(CONTROL_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-automation">Automatisierung</Label>
          <Select id="f-automation" name="automation" defaultValue={sp.automation ?? ""}>
            <option value="">Alle</option>
            {Object.entries(AUTOMATION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-effectiveness">Operative Wirksamkeit</Label>
          <Select id="f-effectiveness" name="effectiveness" defaultValue={sp.effectiveness ?? ""}>
            <option value="">Alle</option>
            {Object.entries(EFFECTIVENESS_RATING).map(([k, v]) => (
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
          <Link href="/controls">
            <Button type="button" variant="ghost">
              Zurücksetzen
            </Button>
          </Link>
        </div>
        <div className="col-span-full flex flex-wrap gap-2 text-xs">
          <FilterChip
            href="/controls?testOverdue=1"
            active={sp.testOverdue === "1"}
            label="Test überfällig"
          />
        </div>
      </form>

      <ControlsTableClient rows={rows} />
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
