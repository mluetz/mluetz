"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ACTION_STATUS, PRIORITY, type ActionStatus } from "@/lib/domain/enums";

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

export const actionColumns: ColumnDef<ActionMgmtRow>[] = [
  {
    accessorKey: "actionId",
    header: "Action ID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.actionId}</span>,
  },
  {
    accessorKey: "title",
    header: "Titel",
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
    header: "Owner",
    cell: ({ row }) =>
      row.original.ownerName ?? <span className="text-xs text-risk-high">ohne Owner</span>,
  },
  {
    accessorKey: "priority",
    header: "Priorität",
    cell: ({ row }) => (
      <Badge variant={priorityVariant(row.original.priority)}>
        {PRIORITY[row.original.priority as keyof typeof PRIORITY] ?? row.original.priority}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {ACTION_STATUS[row.original.status as ActionStatus] ?? row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "dueDate",
    header: "Fälligkeit",
    cell: ({ row }) => (
      <span
        className={`whitespace-nowrap text-xs ${row.original.overdue ? "font-medium text-risk-high" : ""}`}
      >
        {row.original.dueDate ?? "–"}
        {row.original.overdue ? " (überfällig)" : ""}
      </span>
    ),
  },
  {
    accessorKey: "progress",
    header: "Fortschritt",
    cell: ({ row }) => <span className="whitespace-nowrap text-xs">{row.original.progress} %</span>,
  },
  {
    accessorKey: "escalationLevel",
    header: "Eskalation",
    cell: ({ row }) =>
      row.original.escalationLevel > 0 ? (
        <Badge variant={row.original.escalationLevel >= 3 ? "critical" : "high"}>
          Stufe {row.original.escalationLevel}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">keine</span>
      ),
  },
];
