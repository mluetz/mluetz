import Link from "next/link";
import { requirePermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getDoraRows } from "@/features/dora/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { DORA_BINDINGNESS } from "@/lib/domain/enums";
import { CatalogTableClient } from "@/features/dora/catalog-table-client";

export const metadata = { title: "DORA-Anforderungskatalog" };
export const dynamic = "force-dynamic";

interface Search {
  chapter?: string;
  bindingness?: string;
  openKnockouts?: string;
  evidenceCapped?: string;
  notAssessed?: string;
  withFindings?: string;
}

export default async function DoraRequirementsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requirePermission("compliance:read");
  const sp = await searchParams;
  const [chapters, allRows] = await Promise.all([
    db.doraChapter.findMany({ orderBy: { key: "asc" } }),
    getDoraRows(),
  ]);

  let rows = allRows;
  if (sp.chapter) rows = rows.filter((r) => r.chapterKey === sp.chapter);
  if (sp.bindingness) rows = rows.filter((r) => r.bindingness === sp.bindingness);
  if (sp.openKnockouts === "1") rows = rows.filter((r) => r.isOpenKnockout);
  if (sp.evidenceCapped === "1") rows = rows.filter((r) => r.evidenceCapped);
  if (sp.notAssessed === "1") rows = rows.filter((r) => r.maturity === null);
  if (sp.withFindings === "1") rows = rows.filter((r) => r.openFindings > 0);

  return (
    <div>
      <PageHeader
        title="DORA-Anforderungskatalog"
        description="Alle Anforderungen nach FRWK-DORA-001 mit Reifegrad, Nachweisstatus und offenen Findings"
        crumbs={[
          { label: "Overview", href: "/overview" },
          { label: "DORA", href: "/dora" },
          { label: "Anforderungen" },
        ]}
      />

      <form
        method="GET"
        className="mb-4 grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 md:grid-cols-4"
      >
        <div>
          <Label htmlFor="f-chapter">Kapitel</Label>
          <Select id="f-chapter" name="chapter" defaultValue={sp.chapter ?? ""}>
            <option value="">Alle</option>
            {chapters.map((c) => (
              <option key={c.key} value={c.key}>
                {c.roman} – {c.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="f-bindingness">Verbindlichkeit</Label>
          <Select id="f-bindingness" name="bindingness" defaultValue={sp.bindingness ?? ""}>
            <option value="">Alle</option>
            {Object.entries(DORA_BINDINGNESS).map(([k, v]) => (
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
          <Link href="/dora/requirements">
            <Button type="button" variant="ghost">
              Zurücksetzen
            </Button>
          </Link>
        </div>
        <div className="col-span-full flex flex-wrap gap-2 text-xs">
          <FilterChip
            href="/dora/requirements?openKnockouts=1"
            active={sp.openKnockouts === "1"}
            label="Offene Knockouts"
          />
          <FilterChip
            href="/dora/requirements?evidenceCapped=1"
            active={sp.evidenceCapped === "1"}
            label="Nachweissperre aktiv"
          />
          <FilterChip
            href="/dora/requirements?notAssessed=1"
            active={sp.notAssessed === "1"}
            label="Nicht bewertet"
          />
          <FilterChip
            href="/dora/requirements?withFindings=1"
            active={sp.withFindings === "1"}
            label="Mit offenen Findings"
          />
        </div>
      </form>

      <CatalogTableClient rows={rows} />
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={active ? "/dora/requirements" : href}
      className={`rounded-full border px-2.5 py-1 ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
    >
      {label}
    </Link>
  );
}
