import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { isOverdue } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ThirdPartiesTableClient } from "@/features/third-parties/table-client";
import type { ThirdPartyRow } from "@/features/third-parties/columns";

export const metadata = { title: "Third Parties" };
export const dynamic = "force-dynamic";

interface Search {
  critical?: string;
  expiringContracts?: string;
  missingAssessment?: string;
  concentration?: string;
  missingExit?: string;
  untestedExit?: string;
  overdueActions?: string;
}

const DAY_MS = 86400000;

export default async function ThirdPartiesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requirePermission("thirdparty:read");
  const sp = await searchParams;

  const thirdParties = await db.thirdParty.findMany({
    include: {
      contracts: { select: { endDate: true } },
      exitStrategy: true,
      risks: { select: { actions: { select: { status: true, dueDate: true } } } },
    },
    orderBy: { tpId: "asc" },
  });

  const now = Date.now();
  const in180Days = new Date(now + 180 * DAY_MS);

  let filtered = thirdParties;
  if (sp.critical === "1") {
    filtered = filtered.filter((t) => t.criticality === "CRITICAL" || t.supportsCriticalFunction);
  }
  if (sp.expiringContracts === "1") {
    filtered = filtered.filter((t) => t.contracts.some((c) => c.endDate && c.endDate < in180Days));
  }
  if (sp.missingAssessment === "1") {
    filtered = filtered.filter((t) => t.assessmentDate === null || isOverdue(t.nextReviewDate));
  }
  if (sp.concentration === "1") {
    filtered = filtered.filter((t) => t.concentrationRisk);
  }
  if (sp.missingExit === "1") {
    filtered = filtered.filter(
      (t) => !t.exitStrategy || ["MISSING", "DRAFT"].includes(t.exitStrategy.status),
    );
  }
  if (sp.untestedExit === "1") {
    filtered = filtered.filter(
      (t) =>
        t.exitStrategy != null &&
        (!t.exitStrategy.lastTestDate || t.exitStrategy.status !== "TESTED"),
    );
  }
  if (sp.overdueActions === "1") {
    filtered = filtered.filter((t) =>
      t.risks.some((r) =>
        r.actions.some((a) => !["COMPLETED", "CLOSED"].includes(a.status) && isOverdue(a.dueDate)),
      ),
    );
  }

  const rows: ThirdPartyRow[] = filtered.map((t) => {
    const nextEnd = t.contracts
      .map((c) => c.endDate)
      .filter((d): d is Date => d != null)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    return {
      id: t.id,
      tpId: t.tpId,
      name: t.name,
      providedService: t.providedService,
      criticality: t.criticality,
      supportsCriticalFunction: t.supportsCriticalFunction,
      residualRiskScore: t.residualRiskScore,
      status: t.status,
      concentrationRisk: t.concentrationRisk,
      nextReviewDate: t.nextReviewDate?.toISOString() ?? null,
      reviewOverdue: t.status !== "EXIT" && isOverdue(t.nextReviewDate),
      nextContractEnd: nextEnd?.toISOString() ?? null,
    };
  });

  return (
    <div>
      <PageHeader
        title="Third Party Register"
        description="Register aller ICT-Drittparteien inkl. Kritikalität, Verträgen und Exit-Strategien"
        crumbs={[{ label: "Overview", href: "/overview" }, { label: "Third Parties" }]}
        actions={
          hasPermission(user, "thirdparty:write") ? (
            <Link href="/third-parties/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden /> Neue Drittpartei
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-lg border bg-card p-3 text-xs">
        <FilterChip
          href="/third-parties?critical=1"
          active={sp.critical === "1"}
          label="Kritische Drittparteien"
        />
        <FilterChip
          href="/third-parties?expiringContracts=1"
          active={sp.expiringContracts === "1"}
          label="Auslaufende Verträge (< 180 Tage)"
        />
        <FilterChip
          href="/third-parties?missingAssessment=1"
          active={sp.missingAssessment === "1"}
          label="Fehlende Assessments"
        />
        <FilterChip
          href="/third-parties?concentration=1"
          active={sp.concentration === "1"}
          label="Konzentrationsrisiken"
        />
        <FilterChip
          href="/third-parties?missingExit=1"
          active={sp.missingExit === "1"}
          label="Fehlende Exit-Strategien"
        />
        <FilterChip
          href="/third-parties?untestedExit=1"
          active={sp.untestedExit === "1"}
          label="Ungeprüfte Exit-Pläne"
        />
        <FilterChip
          href="/third-parties?overdueActions=1"
          active={sp.overdueActions === "1"}
          label="Überfällige Maßnahmen"
        />
      </div>

      <ThirdPartiesTableClient rows={rows} />
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={active ? "/third-parties" : href}
      className={`rounded-full border px-2.5 py-1 ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
    >
      {label}
    </Link>
  );
}
