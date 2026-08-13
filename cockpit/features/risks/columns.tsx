"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Clock } from "lucide-react";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { RISK_CLASS, RISK_STATUS, type RiskClass, type RiskStatus } from "@/lib/domain/enums";
import type { RiskRow } from "./queries";

export const riskColumns: ColumnDef<RiskRow>[] = [
  {
    accessorKey: "riskId",
    header: "Risk ID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.riskId}</span>,
  },
  {
    accessorKey: "title",
    header: "Titel",
    cell: ({ row }) => (
      <div className="max-w-[320px]">
        <p className="truncate font-medium" title={row.original.title}>
          {row.original.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{row.original.category}</p>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="flex items-center gap-1 whitespace-nowrap text-xs">
        {RISK_STATUS[row.original.status as RiskStatus] ?? row.original.status}
        {row.original.reviewOverdue ? (
          <span title="Review überfällig" className="text-risk-high">
            <Clock className="h-3.5 w-3.5" aria-label="Review überfällig" />
          </span>
        ) : null}
      </span>
    ),
  },
  {
    accessorKey: "inherentScore",
    header: "Inherent",
    cell: ({ row }) =>
      row.original.inherentScore != null ? (
        <Badge variant={riskClassVariant(row.original.inherentClass ?? "")}>
          {row.original.inherentScore} · {RISK_CLASS[row.original.inherentClass as RiskClass] ?? "?"}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">nicht bewertet</span>
      ),
  },
  {
    accessorKey: "residualScore",
    header: "Residual",
    cell: ({ row }) =>
      row.original.residualScore != null ? (
        <span className="flex items-center gap-1">
          <Badge variant={riskClassVariant(row.original.residualClass ?? "")}>
            {row.original.residualScore} · {RISK_CLASS[row.original.residualClass as RiskClass] ?? "?"}
          </Badge>
          {row.original.aboveAppetite ? (
            <span title={`Über Risikoappetit (${row.original.appetiteThreshold})`} className="text-risk-critical">
              <AlertTriangle className="h-3.5 w-3.5" aria-label="Über Risikoappetit" />
            </span>
          ) : null}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">–</span>
      ),
  },
  {
    accessorKey: "ownerName",
    header: "Risk Owner",
    cell: ({ row }) =>
      row.original.ownerName ?? <span className="text-xs text-risk-high">ohne Owner</span>,
  },
  {
    accessorKey: "openActions",
    header: "Maßnahmen",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {row.original.openActions} offen
        {row.original.overdueActions > 0 ? (
          <span className="text-risk-high"> · {row.original.overdueActions} überfällig</span>
        ) : null}
      </span>
    ),
  },
  {
    accessorKey: "ouName",
    header: "Bereich",
    cell: ({ row }) => <span className="text-xs">{row.original.ouName ?? "–"}</span>,
  },
];
