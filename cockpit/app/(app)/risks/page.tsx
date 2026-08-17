import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission } from "@/lib/authz";
import { hasPermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getRiskRows } from "@/features/risks/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Select, Label } from "@/components/ui/input";
import { RISK_CLASS, RISK_STATUS } from "@/lib/domain/enums";
import { RisksTableClient } from "@/features/risks/risks-table-client";

export const metadata = { title: "Risk Register" };
export const dynamic = "force-dynamic";

interface Search {
  status?: string;
  category?: string;
  klass?: string;
  aboveAppetite?: string;
  overdueReview?: string;
  noOwner?: string;
  noAssessment?: string;
  thirdPartyId?: string;
}

export default async function RisksPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requirePermission("risk:read");
  const sp = await searchParams;
  const categories = await db.riskCategory.findMany({ orderBy: { name: "asc" } });
  const rows = await getRiskRows({
    status: sp.status || undefined,
    category: sp.category || undefined,
    klass: sp.klass || undefined,
    aboveAppetite: sp.aboveAppetite === "1",
    overdueReview: sp.overdueReview === "1",
    noOwner: sp.noOwner === "1",
    noAssessment: sp.noAssessment === "1",
    thirdPartyId: sp.thirdPartyId || undefined,
  });

  return (
    <div>
      <PageHeader
        title="Risk Register"
        description="Operatives Register aller ICT- und Informationssicherheitsrisiken"
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Risks" }]}
        actions={
          hasPermission(user, "risk:write") ? (
            <Link href="/risks/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden /> Neues Risiko
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
            {Object.entries(RISK_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-cat">Risikokategorie</Label>
          <Select id="f-cat" name="category" defaultValue={sp.category ?? ""}>
            <option value="">Alle</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-class">Residual-Klasse</Label>
          <Select id="f-class" name="klass" defaultValue={sp.klass ?? ""}>
            <option value="">Alle</option>
            {Object.entries(RISK_CLASS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" variant="secondary">
            Filtern
          </Button>
          <Link href="/risks">
            <Button type="button" variant="ghost">
              Zurücksetzen
            </Button>
          </Link>
        </div>
        <div className="col-span-full flex flex-wrap gap-2 text-xs">
          <FilterChip
            href="/risks?aboveAppetite=1"
            active={sp.aboveAppetite === "1"}
            label="Über Risikoappetit"
          />
          <FilterChip
            href="/risks?overdueReview=1"
            active={sp.overdueReview === "1"}
            label="Review überfällig"
          />
          <FilterChip href="/risks?noOwner=1" active={sp.noOwner === "1"} label="Ohne Risk Owner" />
          <FilterChip
            href="/risks?noAssessment=1"
            active={sp.noAssessment === "1"}
            label="Ohne aktuelle Bewertung"
          />
        </div>
      </form>

      <RisksTableClient rows={rows} />
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={active ? "/risks" : href}
      className={`rounded-full border px-2.5 py-1 ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
    >
      {label}
    </Link>
  );
}
