"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data-table";
import type { Locale } from "@/lib/i18n/config";
import { CORE_MESSAGES } from "@/lib/i18n/messages/core";
import { createRiskColumns } from "./columns";
import type { RiskRow } from "./queries";

export function RisksTableClient({ rows, locale }: { rows: RiskRow[]; locale: Locale }) {
  const t = CORE_MESSAGES[locale].risks;
  const columns = useMemo(() => createRiskColumns(locale), [locale]);
  return (
    <DataTable
      columns={columns}
      data={rows}
      locale={locale}
      searchPlaceholder={t.searchPlaceholder}
      getRowHref={(r) => `/risks/${r.id}`}
      emptyMessage={t.emptyMessage}
    />
  );
}
