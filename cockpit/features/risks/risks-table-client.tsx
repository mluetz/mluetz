"use client";

import { DataTable } from "@/components/data-table";
import { riskColumns } from "./columns";
import type { RiskRow } from "./queries";

export function RisksTableClient({ rows }: { rows: RiskRow[] }) {
  return (
    <DataTable
      columns={riskColumns}
      data={rows}
      searchPlaceholder="Risiken durchsuchen (ID, Titel, Owner …)"
      getRowHref={(r) => `/risks/${r.id}`}
      emptyMessage="Keine Risiken für die gewählten Filter."
    />
  );
}
