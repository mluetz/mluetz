"use client";

import { DataTable } from "@/components/data-table";
import { actionColumns, type ActionMgmtRow } from "./columns";

export function ActionsTableClient({ rows }: { rows: ActionMgmtRow[] }) {
  return (
    <DataTable
      columns={actionColumns}
      data={rows}
      searchPlaceholder="Maßnahmen durchsuchen (ID, Titel, Owner …)"
      getRowHref={(r) => `/actions/${r.id}`}
      emptyMessage="Keine Maßnahmen für die gewählten Filter."
    />
  );
}
