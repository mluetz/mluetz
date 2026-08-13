"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { EFFECTIVENESS_RATING } from "@/lib/domain/enums";
import {
  AUTOMATION_LABELS,
  CONTROL_TYPE_LABELS,
  FREQUENCY_LABELS,
  effectivenessVariant,
} from "./labels";

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

function EffectivenessBadge({ rating }: { rating: string }) {
  return (
    <Badge variant={effectivenessVariant(rating)}>
      {EFFECTIVENESS_RATING[rating as keyof typeof EFFECTIVENESS_RATING] ?? rating}
    </Badge>
  );
}

export const controlColumns: ColumnDef<ControlRow>[] = [
  {
    accessorKey: "controlId",
    header: "Control ID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.controlId}</span>,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <p className="max-w-[280px] truncate font-medium" title={row.original.name}>
        {row.original.name}
      </p>
    ),
  },
  {
    accessorKey: "controlType",
    header: "Typ",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {CONTROL_TYPE_LABELS[row.original.controlType as keyof typeof CONTROL_TYPE_LABELS] ??
          row.original.controlType}
      </span>
    ),
  },
  {
    accessorKey: "automation",
    header: "Automatisierung",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {AUTOMATION_LABELS[row.original.automation as keyof typeof AUTOMATION_LABELS] ??
          row.original.automation}
      </span>
    ),
  },
  {
    accessorKey: "frequency",
    header: "Frequenz",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs">
        {FREQUENCY_LABELS[row.original.frequency as keyof typeof FREQUENCY_LABELS] ??
          row.original.frequency}
      </span>
    ),
  },
  {
    accessorKey: "ownerName",
    header: "Owner",
    cell: ({ row }) =>
      row.original.ownerName ?? <span className="text-xs text-risk-high">ohne Owner</span>,
  },
  {
    accessorKey: "designEffectiveness",
    header: "Design",
    cell: ({ row }) => <EffectivenessBadge rating={row.original.designEffectiveness} />,
  },
  {
    accessorKey: "operatingEffectiveness",
    header: "Operativ",
    cell: ({ row }) => <EffectivenessBadge rating={row.original.operatingEffectiveness} />,
  },
  {
    accessorKey: "nextTestDate",
    header: "Nächster Test",
    cell: ({ row }) => (
      <span
        className={`whitespace-nowrap text-xs ${row.original.testOverdue ? "font-medium text-risk-high" : ""}`}
      >
        {row.original.nextTestDate ?? "–"}
        {row.original.testOverdue ? " (überfällig)" : ""}
      </span>
    ),
  },
  {
    accessorKey: "riskCount",
    header: "Risiken",
    cell: ({ row }) => <span className="text-xs">{row.original.riskCount}</span>,
  },
];
