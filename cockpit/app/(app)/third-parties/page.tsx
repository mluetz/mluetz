import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/authz";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/server";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";
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
  const locale = await getLocale();
  const t = TPRM_MESSAGES[locale];
  const sp = await searchParams;

  const thirdParties = await db.thirdParty.findMany({
    include: {
      contracts: { select: { endDate: true } },
      exitStrategy: true,
      risks: { select: { actions: { select: { status: true, dueDate: true } } } },
      _count: { select: { criticalFunctions: true } },
    },
    orderBy: { tpId: "asc" },
  });

  const now = Date.now();
  const in180Days = new Date(now + 180 * DAY_MS);

  let filtered = thirdParties;
  if (sp.critical === "1") {
    filtered = filtered.filter(
      (t) => t.criticality === "CRITICAL" || t._count.criticalFunctions > 0,
    );
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
      supportsCriticalFunction: t._count.criticalFunctions > 0,
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
        title={t.tp.list.title}
        description={t.tp.list.description}
        crumbs={[
          { label: t.tp.list.crumbOverview, href: "/overview" },
          { label: t.tp.list.crumbThirdParties },
        ]}
        actions={
          hasPermission(user, "thirdparty:write") ? (
            <Link href="/third-parties/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden /> {t.tp.list.newButton}
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-lg border bg-card p-3 text-xs">
        <FilterChip
          href="/third-parties?critical=1"
          active={sp.critical === "1"}
          label={t.tp.list.filterCritical}
        />
        <FilterChip
          href="/third-parties?expiringContracts=1"
          active={sp.expiringContracts === "1"}
          label={t.tp.list.filterExpiringContracts}
        />
        <FilterChip
          href="/third-parties?missingAssessment=1"
          active={sp.missingAssessment === "1"}
          label={t.tp.list.filterMissingAssessment}
        />
        <FilterChip
          href="/third-parties?concentration=1"
          active={sp.concentration === "1"}
          label={t.tp.list.filterConcentration}
        />
        <FilterChip
          href="/third-parties?missingExit=1"
          active={sp.missingExit === "1"}
          label={t.tp.list.filterMissingExit}
        />
        <FilterChip
          href="/third-parties?untestedExit=1"
          active={sp.untestedExit === "1"}
          label={t.tp.list.filterUntestedExit}
        />
        <FilterChip
          href="/third-parties?overdueActions=1"
          active={sp.overdueActions === "1"}
          label={t.tp.list.filterOverdueActions}
        />
      </div>

      <ThirdPartiesTableClient rows={rows} locale={locale} />
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
