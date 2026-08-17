"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/config";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";
import { effectivenessVariant } from "./labels";

/** Angereicherte Kontrollzeile für die Control Library (serialisierbar). */
export interface ControlRow {
  id: string;
  controlId: string;
  name: string;
  controlType: string;
  automation: string;
  frequency: string;
  ownerName: string | null;
  designEffectiveness: string;
  operatingEffectiveness: string;
  nextTestDate: string | null; // vorformatiert (formatDate)
  testOverdue: boolean;
  riskCount: number;
}

function EffectivenessBadge({ rating, locale }: { rating: string; locale: Locale }) {
  return (
    <Badge variant={effectivenessVariant(rating)}>
      {OPS_MESSAGES[locale].labels.effectiveness[rating] ?? rating}
    </Badge>
  );
}

/** Spalten-Factory: Beschriftungen gemäß UI-Sprache. */
export function createControlColumns(locale: Locale): ColumnDef<ControlRow>[] {
  const m = OPS_MESSAGES[locale];
  const t = m.controls.columns;
  return [
    {
      accessorKey: "controlId",
      header: t.controlId,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.controlId}</span>,
    },
    {
      accessorKey: "name",
      header: t.name,
      cell: ({ row }) => (
        <p className="max-w-[280px] truncate font-medium" title={row.original.name}>
          {row.original.name}
        </p>
      ),
    },
    {
      accessorKey: "controlType",
      header: t.type,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {m.labels.controlType[row.original.controlType] ?? row.original.controlType}
        </span>
      ),
    },
    {
      accessorKey: "automation",
      header: t.automation,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {m.labels.automation[row.original.automation] ?? row.original.automation}
        </span>
      ),
    },
    {
      accessorKey: "frequency",
      header: t.frequency,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs">
          {m.labels.frequency[row.original.frequency] ?? row.original.frequency}
        </span>
      ),
    },
    {
      accessorKey: "ownerName",
      header: t.owner,
      cell: ({ row }) =>
        row.original.ownerName ?? <span className="text-xs text-risk-high">{m.common.noOwner}</span>,
    },
    {
      accessorKey: "designEffectiveness",
      header: t.design,
      cell: ({ row }) => (
        <EffectivenessBadge rating={row.original.designEffectiveness} locale={locale} />
      ),
    },
    {
      accessorKey: "operatingEffectiveness",
      header: t.operating,
      cell: ({ row }) => (
        <EffectivenessBadge rating={row.original.operatingEffectiveness} locale={locale} />
      ),
    },
    {
      accessorKey: "nextTestDate",
      header: t.nextTest,
      cell: ({ row }) => (
        <span
          className={`whitespace-nowrap text-xs ${row.original.testOverdue ? "font-medium text-risk-high" : ""}`}
        >
          {row.original.nextTestDate ?? "–"}
          {row.original.testOverdue ? m.common.overdueSuffix : ""}
        </span>
      ),
    },
    {
      accessorKey: "riskCount",
      header: t.risks,
      cell: ({ row }) => <span className="text-xs">{row.original.riskCount}</span>,
    },
  ];
}
