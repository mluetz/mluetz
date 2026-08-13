import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { isOverdue } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EvidenceTableClient } from "@/features/evidence/table-client";
import type { EvidenceRow } from "@/features/evidence/columns";

export const metadata = { title: "Nachweise" };
export const dynamic = "force-dynamic";

interface Search {
  expired?: string;
  expiring60?: string;
  notReviewed?: string;
}

const DAY_MS = 86400000;

export default async function EvidencePage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requirePermission("evidence:read");
  const sp = await searchParams;

  const entries = await db.evidence.findMany({
    include: {
      owner: true,
      risk: { select: { riskId: true } },
      control: { select: { controlId: true } },
      thirdParty: { select: { tpId: true } },
    },
    orderBy: { evidenceId: "asc" },
  });

  const now = Date.now();
  const in60Days = new Date(now + 60 * DAY_MS);

  let filtered = entries;
  if (sp.expired === "1") {
    filtered = filtered.filter((e) => isOverdue(e.validUntil));
  }
  if (sp.expiring60 === "1") {
    filtered = filtered.filter(
      (e) => e.validUntil != null && !isOverdue(e.validUntil) && e.validUntil < in60Days,
    );
  }
  if (sp.notReviewed === "1") {
    filtered = filtered.filter((e) => e.reviewStatus === "NOT_REVIEWED");
  }

  const rows: EvidenceRow[] = filtered.map((e) => ({
    id: e.id,
    evidenceId: e.evidenceId,
    title: e.title,
    docType: e.docType,
    ownerName: e.owner?.name ?? null,
    assignedTo: [e.risk?.riskId, e.control?.controlId, e.thirdParty?.tpId]
      .filter(Boolean)
      .join(" · "),
    validUntil: e.validUntil?.toISOString() ?? null,
    expired: isOverdue(e.validUntil),
    classification: e.classification,
    reviewStatus: e.reviewStatus,
    version: e.version,
  }));

  return (
    <div>
      <PageHeader
        title="Nachweisregister"
        description="Metadaten- und Linkregister – es werden keine Dokumente gespeichert."
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Nachweise" }]}
        actions={
          hasPermission(user, "evidence:write") ? (
            <Link href="/evidence/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden /> Neuer Nachweis
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-lg border bg-card p-3 text-xs">
        <FilterChip href="/evidence?expired=1" active={sp.expired === "1"} label="Abgelaufen" />
        <FilterChip
          href="/evidence?expiring60=1"
          active={sp.expiring60 === "1"}
          label="Läuft in 60 Tagen ab"
        />
        <FilterChip
          href="/evidence?notReviewed=1"
          active={sp.notReviewed === "1"}
          label="Nicht reviewt"
        />
      </div>

      <EvidenceTableClient rows={rows} />
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={active ? "/evidence" : href}
      className={`rounded-full border px-2.5 py-1 ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
    >
      {label}
    </Link>
  );
}
