"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/lib/i18n/config";
import { DORA_MESSAGES } from "@/lib/i18n/messages/dora";
import type { DoraRequirementRow } from "./queries";

/** Spalten-Factory: Beschriftungen abhängig von der UI-Sprache. */
export function catalogColumns(locale: Locale): ColumnDef<DoraRequirementRow>[] {
  const t = DORA_MESSAGES[locale];
  return [
    {
      accessorKey: "reqId",
      header: t.catalog.colReqId,
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
      header: t.catalog.colTitle,
      cell: ({ row }) => (
        <div className="max-w-[320px]">
          <p className="truncate font-medium" title={row.original.title}>
            {row.original.title}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {t.dashboard.chapter(row.original.chapterRoman)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "article",
      header: t.catalog.colArticle,
      cell: ({ row }) => <span className="whitespace-nowrap text-xs">{row.original.article}</span>,
    },
    {
      accessorKey: "bindingness",
      header: t.catalog.colBindingness,
      cell: ({ row }) => (
        <Badge variant={row.original.bindingness === "MUSS" ? "secondary" : "outline"}>
          {t.enums.bindingness[row.original.bindingness as keyof typeof t.enums.bindingness] ??
            row.original.bindingness}
        </Badge>
      ),
    },
    {
      accessorKey: "knockout",
      header: t.catalog.colKnockout,
      cell: ({ row }) =>
        row.original.knockout ? (
          <Badge
            variant={row.original.isOpenKnockout ? "critical" : "outline"}
            title={row.original.isOpenKnockout ? t.catalog.koOpenTitle : t.catalog.koMetTitle}
          >
            KO
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">–</span>
        ),
    },
    {
      accessorKey: "effectiveMaturity",
      header: t.catalog.colMaturity,
      cell: ({ row }) => {
        const r = row.original;
        if (r.maturity === null) return <span className="text-xs text-muted-foreground">–</span>;
        if (r.evidenceCapped) {
          return (
            <span className="whitespace-nowrap text-xs font-medium text-risk-high">
              {t.catalog.evidenceCappedCell(r.maturity, r.effectiveMaturity)}
            </span>
          );
        }
        return <span className="text-xs font-medium">{r.maturity}</span>;
      },
    },
    {
      accessorKey: "hasValidEvidence",
      header: t.catalog.colEvidence,
      cell: ({ row }) =>
        row.original.hasValidEvidence ? (
          <span className="whitespace-nowrap text-xs text-risk-low">{t.catalog.evidenceValid}</span>
        ) : (
          <span className="whitespace-nowrap text-xs text-risk-high">
            {t.catalog.evidenceMissing}
          </span>
        ),
    },
    {
      accessorKey: "openFindings",
      header: t.catalog.colOpenFindings,
      cell: ({ row }) =>
        row.original.openFindings > 0 ? (
          <span className="text-xs font-medium text-risk-high">{row.original.openFindings}</span>
        ) : (
          <span className="text-xs text-muted-foreground">0</span>
        ),
    },
    {
      accessorKey: "ownerRole",
      header: t.catalog.colOwnerRole,
      cell: ({ row }) => <span className="text-xs">{row.original.ownerRole}</span>,
    },
  ];
}
