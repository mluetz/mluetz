"use client";

import { DataTable } from "@/components/data-table";
import { controlColumns, type ControlRow } from "./columns";

export function ControlsTableClient({ rows }: { rows: ControlRow[] }) {
  return (
    <DataTable
      columns={controlColumns}
      data={rows}
      searchPlaceholder="Kontrollen durchsuchen (ID, Name, Owner …)"
      getRowHref={(r) => `/controls/${r.id}`}
      emptyMessage="Keine Kontrollen für die gewählten Filter."
    />
  );
}
