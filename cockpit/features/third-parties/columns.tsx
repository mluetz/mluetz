"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/config";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";
import { formatDate } from "@/lib/utils";

/** Angereicherte Drittpartei-Zeile für die Listenansicht. */
export interface ThirdPartyRow {
  id: string;
  tpId: string;
  name: string;
  providedService: string;
  criticality: string;
  supportsCriticalFunction: boolean;
  residualRiskScore: number | null;
  status: string;
  concentrationRisk: boolean;
  nextReviewDate: string | null;
  reviewOverdue: boolean;
  /** Nächstes endendes Vertrags-Enddatum (ISO) oder null. */
  nextContractEnd: string | null;
}

export function createThirdPartyColumns(locale: Locale): ColumnDef<ThirdPartyRow>[] {
  const t = TPRM_MESSAGES[locale];
  return [
    {
      accessorKey: "tpId",
      header: t.tp.columns.tpId,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.tpId}</span>,
    },
    {
      accessorKey: "name",
      header: t.tp.columns.name,
      cell: ({ row }) => (
        <div className="max-w-[280px]">
          <p className="truncate font-medium" title={row.original.name}>
            {row.original.name}
          </p>
          <p
            className="truncate text-xs text-muted-foreground"
            title={row.original.providedService}
          >
            {row.original.providedService}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "criticality",
      header: t.tp.columns.criticality,
      cell: ({ row }) => (
        <Badge variant={riskClassVariant(row.original.criticality)}>
          {t.labels.tpCriticality[row.original.criticality] ?? row.original.criticality}
        </Badge>
      ),
    },
    {
      accessorKey: "supportsCriticalFunction",
      header: t.tp.columns.criticalFunction,
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.supportsCriticalFunction ? t.common.yes : t.common.no}
        </span>
      ),
    },
    {
      accessorKey: "residualRiskScore",
      header: t.tp.columns.residual,
      cell: ({ row }) =>
        row.original.residualRiskScore != null ? (
          <span className="text-xs">{row.original.residualRiskScore}</span>
        ) : (
          <span className="text-xs text-muted-foreground">{t.tp.columns.notAssessed}</span>
        ),
    },
    {
      accessorKey: "status",
      header: t.tp.columns.status,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {t.labels.tpStatus[row.original.status] ?? row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "concentrationRisk",
      header: t.tp.columns.concentration,
      cell: ({ row }) =>
        row.original.concentrationRisk ? (
          <span className="text-xs font-medium text-risk-high">{t.common.yes}</span>
        ) : (
          <span className="text-xs text-muted-foreground">–</span>
        ),
    },
    {
      accessorKey: "nextReviewDate",
      header: t.tp.columns.nextReview,
      cell: ({ row }) => (
        <span
          className={`whitespace-nowrap text-xs ${row.original.reviewOverdue ? "font-medium text-risk-high" : ""}`}
        >
          {formatDate(row.original.nextReviewDate)}
          {row.original.reviewOverdue ? t.common.overdueSuffix : ""}
        </span>
      ),
    },
    {
      accessorKey: "nextContractEnd",
      header: t.tp.columns.contractEnd,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {formatDate(row.original.nextContractEnd)}
        </span>
      ),
    },
  ];
}
