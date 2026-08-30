"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data-table";
import type { Locale } from "@/lib/i18n/config";
import { DORA_MESSAGES } from "@/lib/i18n/messages/dora";
import { findingsColumns, type DoraFindingRow } from "./findings-columns";

export function FindingsTableClient({
  rows,
  locale = "de",
}: {
  rows: DoraFindingRow[];
  locale?: Locale;
}) {
  const t = DORA_MESSAGES[locale];
  const columns = useMemo(() => findingsColumns(locale), [locale]);
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder={t.findings.searchPlaceholder}
      getRowHref={(r) => `/dora/findings/${r.id}`}
      emptyMessage={t.findings.emptyMessage}
      locale={locale}
    />
  );
}
