"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  EVIDENCE_CLASSIFICATION_LABELS,
  EVIDENCE_DOC_TYPE_LABELS,
  EVIDENCE_REVIEW_STATUS_LABELS,
} from "./labels";

/** Angereicherte Nachweis-Zeile für die Listenansicht. */
export interface EvidenceRow {
  id: string;
  evidenceId: string;
  title: string;
  docType: string;
  ownerName: string | null;
  /** Fachliche IDs der Verknüpfungen (Risk-ID / Control-ID / TP-ID) als Text. */
  assignedTo: string;
  validUntil: string | null;
  expired: boolean;
  classification: string;
  reviewStatus: string;
  version: string;
}

export const evidenceColumns: ColumnDef<EvidenceRow>[] = [
  {
    accessorKey: "evidenceId",
    header: "Evidence ID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.evidenceId}</span>,
  },
  {
    accessorKey: "title",
    header: "Titel",
    cell: ({ row }) => (
      <p className="max-w-[280px] truncate font-medium" title={row.original.title}>
        {row.original.title}
      </p>
    ),
  },
  {
    accessorKey: "docType",
    header: "Dokumentart",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {EVIDENCE_DOC_TYPE_LABELS[row.original.docType] ?? row.original.docType}
      </span>
    ),
  },
  {
    accessorKey: "ownerName",
    header: "Owner",
    cell: ({ row }) => <span className="text-xs">{row.original.ownerName ?? "–"}</span>,
  },
  {
    accessorKey: "assignedTo",
    header: "Zugeordnet zu",
    cell: ({ row }) =>
      row.original.assignedTo ? (
        <span className="font-mono text-xs">{row.original.assignedTo}</span>
      ) : (
        <span className="text-xs text-muted-foreground">–</span>
      ),
  },
  {
    accessorKey: "validUntil",
    header: "Gültig bis",
    cell: ({ row }) => (
      <span
        className={`whitespace-nowrap text-xs ${row.original.expired ? "font-medium text-risk-high" : ""}`}
      >
        {formatDate(row.original.validUntil)}
        {row.original.expired ? " (abgelaufen)" : ""}
      </span>
    ),
  },
  {
    accessorKey: "classification",
    header: "Klassifikation",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {EVIDENCE_CLASSIFICATION_LABELS[row.original.classification] ?? row.original.classification}
      </span>
    ),
  },
  {
    accessorKey: "reviewStatus",
    header: "Reviewstatus",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.reviewStatus === "REVIEWED"
            ? "low"
            : row.original.reviewStatus === "NOT_REVIEWED"
              ? "secondary"
              : row.original.reviewStatus === "EXPIRED"
                ? "high"
                : "critical"
        }
      >
        {EVIDENCE_REVIEW_STATUS_LABELS[row.original.reviewStatus] ?? row.original.reviewStatus}
      </Badge>
    ),
  },
  {
    accessorKey: "version",
    header: "Version",
    cell: ({ row }) => <span className="text-xs">{row.original.version}</span>,
  },
];
