"use client";

import { DataTable } from "@/components/data-table";
import { evidenceColumns, type EvidenceRow } from "./columns";

export function EvidenceTableClient({ rows }: { rows: EvidenceRow[] }) {
  return (
    <DataTable
      columns={evidenceColumns}
      data={rows}
      searchPlaceholder="Nachweise durchsuchen (ID, Titel, Owner …)"
      getRowHref={(r) => `/evidence/${r.id}`}
      emptyMessage="Keine Nachweise für die gewählten Filter."
    />
  );
}
