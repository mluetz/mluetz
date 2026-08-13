import "server-only";
import { db } from "@/lib/db";
import { classify } from "@/lib/domain/risk-calc";
import { getRiskThresholds } from "@/lib/settings";
import { isOverdue } from "@/lib/utils";

/** Angereicherte Risikozeile für Listen, Dashboard und Reports. */
export interface RiskRow {
  id: string;
  riskId: string;
  title: string;
  status: string;
  category: string;
  categoryKey: string;
  ownerName: string | null;
  ouName: string | null;
  locationName: string | null;
  likelihood: number | null;
  impact: number | null;
  inherentScore: number | null;
  residualScore: number | null;
  inherentClass: string | null;
  residualClass: string | null;
  appetiteThreshold: number;
  aboveAppetite: boolean;
  reviewOverdue: boolean;
  nextReviewDate: string | null;
  treatmentStrategy: string | null;
  openActions: number;
  overdueActions: number;
  thirdParties: string[];
  updatedAt: string;
}

export interface RiskFilters {
  status?: string;
  category?: string;
  klass?: string;
  aboveAppetite?: boolean;
  overdueReview?: boolean;
  noOwner?: boolean;
  noAssessment?: boolean;
  thirdPartyId?: string;
  ouId?: string;
  locationId?: string;
}

export async function getRiskRows(filters: RiskFilters = {}): Promise<RiskRow[]> {
  const thresholds = await getRiskThresholds();
  const risks = await db.risk.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.category ? { category: { key: filters.category } } : {}),
      ...(filters.thirdPartyId ? { thirdParties: { some: { id: filters.thirdPartyId } } } : {}),
      ...(filters.ouId ? { ouId: filters.ouId } : {}),
      ...(filters.locationId ? { locationId: filters.locationId } : {}),
      ...(filters.noOwner ? { riskOwnerId: null } : {}),
    },
    include: {
      category: true,
      riskOwner: true,
      ou: true,
      location: true,
      assessments: { where: { isCurrent: true }, take: 1 },
      actions: { select: { status: true, dueDate: true } },
      thirdParties: { select: { name: true } },
    },
    orderBy: { riskId: "asc" },
  });

  let rows = risks.map((r): RiskRow => {
    const a = r.assessments[0] ?? null;
    const appetite = r.appetiteOverride ?? r.category.appetiteThreshold;
    const openActions = r.actions.filter((x) => !["CLOSED", "COMPLETED"].includes(x.status)).length;
    const overdueActions = r.actions.filter(
      (x) => !["CLOSED", "COMPLETED"].includes(x.status) && isOverdue(x.dueDate),
    ).length;
    return {
      id: r.id,
      riskId: r.riskId,
      title: r.title,
      status: r.status,
      category: r.category.name,
      categoryKey: r.category.key,
      ownerName: r.riskOwner?.name ?? null,
      ouName: r.ou?.name ?? null,
      locationName: r.location?.name ?? null,
      likelihood: a?.likelihood ?? null,
      impact: a?.impact ?? null,
      inherentScore: a?.inherentScore ?? null,
      residualScore: a?.residualScore ?? null,
      inherentClass: a ? classify(a.inherentScore, thresholds) : null,
      residualClass: a ? classify(a.residualScore, thresholds) : null,
      appetiteThreshold: appetite,
      aboveAppetite: a ? a.residualScore > appetite : false,
      reviewOverdue: r.status !== "CLOSED" && r.status !== "DRAFT" && isOverdue(r.nextReviewDate),
      nextReviewDate: r.nextReviewDate?.toISOString() ?? null,
      treatmentStrategy: r.treatmentStrategy,
      openActions,
      overdueActions,
      thirdParties: r.thirdParties.map((t) => t.name),
      updatedAt: r.updatedAt.toISOString(),
    };
  });

  if (filters.klass) rows = rows.filter((r) => r.residualClass === filters.klass);
  if (filters.aboveAppetite) rows = rows.filter((r) => r.aboveAppetite);
  if (filters.overdueReview) rows = rows.filter((r) => r.reviewOverdue);
  if (filters.noAssessment) rows = rows.filter((r) => r.residualScore === null);
  return rows;
}
