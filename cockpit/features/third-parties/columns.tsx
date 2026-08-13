"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { TP_STATUS, type TpStatus } from "@/lib/domain/enums";
import { formatDate } from "@/lib/utils";
import { TP_CRITICALITY_LABELS } from "./labels";

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

export const thirdPartyColumns: ColumnDef<ThirdPartyRow>[] = [
  {
    accessorKey: "tpId",
    header: "TP ID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.tpId}</span>,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="max-w-[280px]">
        <p className="truncate font-medium" title={row.original.name}>
          {row.original.name}
        </p>
        <p className="truncate text-xs text-muted-foreground" title={row.original.providedService}>
          {row.original.providedService}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "criticality",
    header: "Kritikalität",
    cell: ({ row }) => (
      <Badge variant={riskClassVariant(row.original.criticality)}>
        {TP_CRITICALITY_LABELS[row.original.criticality] ?? row.original.criticality}
      </Badge>
    ),
  },
  {
    accessorKey: "supportsCriticalFunction",
    header: "Krit. Funktion",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.supportsCriticalFunction ? "Ja" : "Nein"}</span>
    ),
  },
  {
    accessorKey: "residualRiskScore",
    header: "Residual",
    cell: ({ row }) =>
      row.original.residualRiskScore != null ? (
        <span className="text-xs">{row.original.residualRiskScore}</span>
      ) : (
        <span className="text-xs text-muted-foreground">nicht bewertet</span>
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {TP_STATUS[row.original.status as TpStatus] ?? row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "concentrationRisk",
    header: "Konzentration",
    cell: ({ row }) =>
      row.original.concentrationRisk ? (
        <span className="text-xs font-medium text-risk-high">Ja</span>
      ) : (
        <span className="text-xs text-muted-foreground">–</span>
      ),
  },
  {
    accessorKey: "nextReviewDate",
    header: "Nächstes Review",
    cell: ({ row }) => (
      <span
        className={`whitespace-nowrap text-xs ${row.original.reviewOverdue ? "font-medium text-risk-high" : ""}`}
      >
        {formatDate(row.original.nextReviewDate)}
        {row.original.reviewOverdue ? " (überfällig)" : ""}
      </span>
    ),
  },
  {
    accessorKey: "nextContractEnd",
    header: "Vertragsende",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">{formatDate(row.original.nextContractEnd)}</span>
    ),
  },
];
