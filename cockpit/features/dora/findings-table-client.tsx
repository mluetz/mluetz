"use client";

import { DataTable } from "@/components/data-table";
import { findingsColumns, type DoraFindingRow } from "./findings-columns";

export function FindingsTableClient({ rows }: { rows: DoraFindingRow[] }) {
  return (
    <DataTable
      columns={findingsColumns}
      data={rows}
      searchPlaceholder="Findings durchsuchen (ID, Titel, Anforderung …)"
      getRowHref={(r) => `/dora/findings/${r.id}`}
      emptyMessage="Keine Findings für die gewählten Filter."
    />
  );
}
