"use client";

import { DataTable } from "@/components/data-table";
import { catalogColumns } from "./catalog-columns";
import type { DoraRequirementRow } from "./queries";

export function CatalogTableClient({ rows }: { rows: DoraRequirementRow[] }) {
  return (
    <DataTable
      columns={catalogColumns}
      data={rows}
      searchPlaceholder="Anforderungen durchsuchen (ID, Titel, Artikel, Rolle …)"
      getRowHref={(r) => `/dora/requirements/${r.id}`}
      emptyMessage="Keine Anforderungen für die gewählten Filter."
    />
  );
}
