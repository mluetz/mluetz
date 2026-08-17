"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { DoraRequirementRow } from "./queries";

export const catalogColumns: ColumnDef<DoraRequirementRow>[] = [
  {
    accessorKey: "reqId",
    header: "Req.-ID",
    cell: ({ row }) => (
      <Link
        href={`/dora/requirements/${row.original.id}`}
        className="font-mono text-xs text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.reqId}
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
        <p className="truncate text-xs text-muted-foreground">
          Kapitel {row.original.chapterRoman}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "article",
    header: "Artikel",
    cell: ({ row }) => <span className="whitespace-nowrap text-xs">{row.original.article}</span>,
  },
  {
    accessorKey: "bindingness",
    header: "Verbindlichkeit",
    cell: ({ row }) => (
      <Badge variant={row.original.bindingness === "MUSS" ? "secondary" : "outline"}>
        {row.original.bindingness}
      </Badge>
    ),
  },
  {
    accessorKey: "knockout",
    header: "KO",
    cell: ({ row }) =>
      row.original.knockout ? (
        <Badge
          variant={row.original.isOpenKnockout ? "critical" : "outline"}
          title={
            row.original.isOpenKnockout
              ? "Knockout offen (wirksamer Reifegrad < 3)"
              : "Knockout-Anforderung erfüllt"
          }
        >
          KO
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">–</span>
      ),
  },
  {
    accessorKey: "effectiveMaturity",
    header: "Reifegrad",
    cell: ({ row }) => {
      const r = row.original;
      if (r.maturity === null) return <span className="text-xs text-muted-foreground">–</span>;
      if (r.evidenceCapped) {
        return (
          <span className="whitespace-nowrap text-xs font-medium text-risk-high">
            {r.maturity} → {r.effectiveMaturity} (Nachweissperre)
          </span>
        );
      }
      return <span className="text-xs font-medium">{r.maturity}</span>;
    },
  },
  {
    accessorKey: "hasValidEvidence",
    header: "Nachweis",
    cell: ({ row }) =>
      row.original.hasValidEvidence ? (
        <span className="whitespace-nowrap text-xs text-risk-low">✓ gültig</span>
      ) : (
        <span className="whitespace-nowrap text-xs text-risk-high">✗ fehlt</span>
      ),
  },
  {
    accessorKey: "openFindings",
    header: "Offene Findings",
    cell: ({ row }) =>
      row.original.openFindings > 0 ? (
        <span className="text-xs font-medium text-risk-high">{row.original.openFindings}</span>
      ) : (
        <span className="text-xs text-muted-foreground">0</span>
      ),
  },
  {
    accessorKey: "ownerRole",
    header: "Owner-Rolle",
    cell: ({ row }) => <span className="text-xs">{row.original.ownerRole}</span>,
  },
];
