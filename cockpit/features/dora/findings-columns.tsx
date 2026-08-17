"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/config";
import { DORA_MESSAGES } from "@/lib/i18n/messages/dora";
import { formatDate } from "@/lib/utils";

export interface DoraFindingRow {
  id: string;
  findingId: string;
  title: string;
  reqId: string | null;
  requirementDbId: string | null;
  source: string;
  severity: string;
  remediationDueAt: Date | null;
  overdue: boolean;
  status: string;
  actionDbId: string | null;
  actionId: string | null;
  escalatedTo: string | null;
}

/** Spalten-Factory: Beschriftungen abhängig von der UI-Sprache. */
export function findingsColumns(locale: Locale): ColumnDef<DoraFindingRow>[] {
  const t = DORA_MESSAGES[locale];
  return [
    {
      accessorKey: "findingId",
      header: t.findings.colFindingId,
      cell: ({ row }) => (
        <Link
          href={`/dora/findings/${row.original.id}`}
          className="font-mono text-xs text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.findingId}
        </Link>
      ),
    },
    {
      accessorKey: "title",
      header: t.findings.colTitle,
      cell: ({ row }) => (
        <div className="max-w-[320px]">
          <p className="truncate font-medium" title={row.original.title}>
            {row.original.title}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {row.original.reqId ?? t.findings.noRequirement}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "source",
      header: t.findings.colSource,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {t.enums.findingSource[row.original.source as keyof typeof t.enums.findingSource] ??
            row.original.source}
        </span>
      ),
    },
    {
      accessorKey: "severity",
      header: t.findings.colSeverity,
      cell: ({ row }) => (
        <Badge variant={riskClassVariant(row.original.severity)}>
          {t.enums.severity[row.original.severity] ?? row.original.severity}
        </Badge>
      ),
    },
    {
      accessorKey: "remediationDueAt",
      header: t.findings.colRemediationDue,
      cell: ({ row }) => (
        <span
          className={`whitespace-nowrap text-xs ${
            row.original.overdue ? "font-medium text-risk-critical" : ""
          }`}
        >
          {formatDate(row.original.remediationDueAt)}
          {row.original.overdue ? t.common.overdueSuffix : ""}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t.findings.colStatus,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {t.enums.findingStatus[row.original.status as keyof typeof t.enums.findingStatus] ??
            row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "actionId",
      header: t.findings.colCapa,
      cell: ({ row }) =>
        row.original.actionDbId ? (
          <Link
            href={`/actions/${row.original.actionDbId}`}
            className="font-mono text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.actionId}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">–</span>
        ),
    },
    {
      accessorKey: "escalatedTo",
      header: t.findings.colEscalation,
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.escalatedTo
            ? (t.enums.escalation[row.original.escalatedTo] ?? row.original.escalatedTo)
            : "–"}
        </span>
      ),
    },
  ];
}
