"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, riskClassVariant } from "@/components/ui/badge";
import { DORA_FINDING_SOURCE, DORA_FINDING_STATUS } from "@/lib/domain/enums";
import { FINDING_SEVERITY_RULES } from "@/lib/domain/dora-scoring";
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

export const findingsColumns: ColumnDef<DoraFindingRow>[] = [
  {
    accessorKey: "findingId",
    header: "Finding-ID",
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
    header: "Titel",
    cell: ({ row }) => (
      <div className="max-w-[320px]">
        <p className="truncate font-medium" title={row.original.title}>
          {row.original.title}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {row.original.reqId ?? "ohne Anforderungsbezug"}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "source",
    header: "Quelle",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {DORA_FINDING_SOURCE[row.original.source as keyof typeof DORA_FINDING_SOURCE] ??
          row.original.source}
      </span>
    ),
  },
  {
    accessorKey: "severity",
    header: "Schweregrad",
    cell: ({ row }) => (
      <Badge variant={riskClassVariant(row.original.severity)}>
        {FINDING_SEVERITY_RULES[row.original.severity]?.label ?? row.original.severity}
      </Badge>
    ),
  },
  {
    accessorKey: "remediationDueAt",
    header: "Behebung fällig",
    cell: ({ row }) => (
      <span
        className={`whitespace-nowrap text-xs ${
          row.original.overdue ? "font-medium text-risk-critical" : ""
        }`}
      >
        {formatDate(row.original.remediationDueAt)}
        {row.original.overdue ? " (überfällig)" : ""}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {DORA_FINDING_STATUS[row.original.status as keyof typeof DORA_FINDING_STATUS] ??
          row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "actionId",
    header: "CAPA",
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
    header: "Eskalation",
    cell: ({ row }) => <span className="text-xs">{row.original.escalatedTo ?? "–"}</span>,
  },
];
