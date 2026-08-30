"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";

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

/** Spalten-Factory: Beschriftungen gemäß UI-Sprache. */
export function createEvidenceColumns(locale: Locale): ColumnDef<EvidenceRow>[] {
  const m = OPS_MESSAGES[locale];
  const t = m.evidence.columns;
  return [
    {
      accessorKey: "evidenceId",
      header: t.evidenceId,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.evidenceId}</span>,
    },
    {
      accessorKey: "title",
      header: t.title,
      cell: ({ row }) => (
        <p className="max-w-[280px] truncate font-medium" title={row.original.title}>
          {row.original.title}
        </p>
      ),
    },
    {
      accessorKey: "docType",
      header: t.docType,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {m.labels.evidenceDocType[row.original.docType] ?? row.original.docType}
        </span>
      ),
    },
    {
      accessorKey: "ownerName",
      header: t.owner,
      cell: ({ row }) => <span className="text-xs">{row.original.ownerName ?? "–"}</span>,
    },
    {
      accessorKey: "assignedTo",
      header: t.assignedTo,
      cell: ({ row }) =>
        row.original.assignedTo ? (
          <span className="font-mono text-xs">{row.original.assignedTo}</span>
        ) : (
          <span className="text-xs text-muted-foreground">–</span>
        ),
    },
    {
      accessorKey: "validUntil",
      header: t.validUntil,
      cell: ({ row }) => (
        <span
          className={`whitespace-nowrap text-xs ${row.original.expired ? "font-medium text-risk-high" : ""}`}
        >
          {formatDate(row.original.validUntil)}
          {row.original.expired ? m.common.expiredSuffix : ""}
        </span>
      ),
    },
    {
      accessorKey: "classification",
      header: t.classification,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {m.labels.evidenceClassification[row.original.classification] ??
            row.original.classification}
        </span>
      ),
    },
    {
      accessorKey: "reviewStatus",
      header: t.reviewStatus,
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
          {m.labels.evidenceReviewStatus[row.original.reviewStatus] ?? row.original.reviewStatus}
        </Badge>
      ),
    },
    {
      accessorKey: "version",
      header: t.version,
      cell: ({ row }) => <span className="text-xs">{row.original.version}</span>,
    },
  ];
}
