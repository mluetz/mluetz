"use client";

import { DataTable } from "@/components/data-table";
import { thirdPartyColumns, type ThirdPartyRow } from "./columns";

export function ThirdPartiesTableClient({ rows }: { rows: ThirdPartyRow[] }) {
  return (
    <DataTable
      columns={thirdPartyColumns}
      data={rows}
      searchPlaceholder="Drittparteien durchsuchen (ID, Name, Leistung …)"
      getRowHref={(r) => `/third-parties/${r.id}`}
      emptyMessage="Keine Drittparteien für die gewählten Filter."
    />
  );
}
