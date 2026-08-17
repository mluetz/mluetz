"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data-table";
import type { Locale } from "@/lib/i18n/config";
import { DORA_MESSAGES } from "@/lib/i18n/messages/dora";
import { catalogColumns } from "./catalog-columns";
import type { DoraRequirementRow } from "./queries";

export function CatalogTableClient({
  rows,
  locale = "de",
}: {
  rows: DoraRequirementRow[];
  locale?: Locale;
}) {
  const t = DORA_MESSAGES[locale];
  const columns = useMemo(() => catalogColumns(locale), [locale]);
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder={t.catalog.searchPlaceholder}
      getRowHref={(r) => `/dora/requirements/${r.id}`}
      emptyMessage={t.catalog.emptyMessage}
      locale={locale}
    />
  );
}
