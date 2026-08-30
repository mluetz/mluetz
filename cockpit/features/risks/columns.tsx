"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Clock } from "lucide-react";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { RISK_CLASS, RISK_STATUS, type RiskClass, type RiskStatus } from "@/lib/domain/enums";
import type { Locale } from "@/lib/i18n/config";
import { CORE_MESSAGES } from "@/lib/i18n/messages/core";
import type { RiskRow } from "./queries";

export function createRiskColumns(locale: Locale): ColumnDef<RiskRow>[] {
  const t = CORE_MESSAGES[locale].riskColumns;
  return [
    {
      accessorKey: "riskId",
      header: t.riskId,
      cell: ({ row }) => (
        <Link
          href={`/risks/${row.original.id}`}
          className="font-mono text-xs text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.riskId}
        </Link>
      ),
    },
    {
      accessorKey: "title",
      header: t.title,
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
      header: t.status,
      cell: ({ row }) => (
        <span className="flex items-center gap-1 whitespace-nowrap text-xs">
          {RISK_STATUS[row.original.status as RiskStatus] ?? row.original.status}
          {row.original.reviewOverdue ? (
            <span title={t.reviewOverdue} className="text-risk-high">
              <Clock className="h-3.5 w-3.5" aria-label={t.reviewOverdue} />
            </span>
          ) : null}
        </span>
      ),
    },
    {
      accessorKey: "inherentScore",
      header: t.inherent,
      cell: ({ row }) =>
        row.original.inherentScore != null ? (
          <Badge variant={riskClassVariant(row.original.inherentClass ?? "")}>
            {row.original.inherentScore} ·{" "}
            {RISK_CLASS[row.original.inherentClass as RiskClass] ?? "?"}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">{t.notAssessed}</span>
        ),
    },
    {
      accessorKey: "residualScore",
      header: t.residual,
      cell: ({ row }) =>
        row.original.residualScore != null ? (
          <span className="flex items-center gap-1">
            <Badge variant={riskClassVariant(row.original.residualClass ?? "")}>
              {row.original.residualScore} ·{" "}
              {RISK_CLASS[row.original.residualClass as RiskClass] ?? "?"}
            </Badge>
            {row.original.aboveAppetite ? (
              <span
                title={t.aboveAppetiteWithThreshold(row.original.appetiteThreshold)}
                className="text-risk-critical"
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-label={t.aboveAppetite} />
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">–</span>
        ),
    },
    {
      accessorKey: "ownerName",
      header: t.owner,
      cell: ({ row }) =>
        row.original.ownerName ?? <span className="text-xs text-risk-high">{t.noOwner}</span>,
    },
    {
      accessorKey: "openActions",
      header: t.actions,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {t.openCount(row.original.openActions)}
          {row.original.overdueActions > 0 ? (
            <span className="text-risk-high">{t.overdueCount(row.original.overdueActions)}</span>
          ) : null}
        </span>
      ),
    },
    {
      accessorKey: "ouName",
      header: t.ou,
      cell: ({ row }) => <span className="text-xs">{row.original.ouName ?? "–"}</span>,
    },
  ];
}
