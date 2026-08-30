"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/config";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";

/** Angereicherte Maßnahmenzeile für die Listenansicht (serialisierbar). */
export interface ActionMgmtRow {
  id: string;
  actionId: string;
  title: string;
  riskRef: string; // fachliche Risiko-ID, z. B. RISK-2026-0001
  ownerName: string | null;
  priority: string;
  status: string;
  dueDate: string | null; // vorformatiert (formatDate)
  overdue: boolean;
  progress: number;
  escalationLevel: number;
}

function priorityVariant(priority: string): "low" | "medium" | "high" | "critical" | "secondary" {
  switch (priority) {
    case "LOW":
      return "low";
    case "MEDIUM":
      return "medium";
    case "HIGH":
      return "high";
    case "CRITICAL":
      return "critical";
    default:
      return "secondary";
  }
}

/** Spalten-Factory: Beschriftungen gemäß UI-Sprache. */
export function createActionColumns(locale: Locale): ColumnDef<ActionMgmtRow>[] {
  const m = OPS_MESSAGES[locale];
  const t = m.actions.columns;
  return [
    {
      accessorKey: "actionId",
      header: t.actionId,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.actionId}</span>,
    },
    {
      accessorKey: "title",
      header: t.title,
      cell: ({ row }) => (
        <div className="max-w-[320px]">
          <p className="truncate font-medium" title={row.original.title}>
            {row.original.title}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground">{row.original.riskRef}</p>
        </div>
      ),
    },
    {
      accessorKey: "ownerName",
      header: t.owner,
      cell: ({ row }) =>
        row.original.ownerName ?? (
          <span className="text-xs text-risk-high">{m.common.noOwner}</span>
        ),
    },
    {
      accessorKey: "priority",
      header: t.priority,
      cell: ({ row }) => (
        <Badge variant={priorityVariant(row.original.priority)}>
          {m.labels.priority[row.original.priority] ?? row.original.priority}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: t.status,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {m.labels.actionStatus[row.original.status] ?? row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: t.dueDate,
      cell: ({ row }) => (
        <span
          className={`whitespace-nowrap text-xs ${row.original.overdue ? "font-medium text-risk-high" : ""}`}
        >
          {row.original.dueDate ?? "–"}
          {row.original.overdue ? m.common.overdueSuffix : ""}
        </span>
      ),
    },
    {
      accessorKey: "progress",
      header: t.progress,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">{row.original.progress} %</span>
      ),
    },
    {
      accessorKey: "escalationLevel",
      header: t.escalation,
      cell: ({ row }) =>
        row.original.escalationLevel > 0 ? (
          <Badge variant={row.original.escalationLevel >= 3 ? "critical" : "high"}>
            {t.level(row.original.escalationLevel)}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">{m.common.none}</span>
        ),
    },
  ];
}
