"use client";

import { DataTable } from "@/components/data-table";
import type { Locale } from "@/lib/i18n/config";
import { TPRM_MESSAGES } from "@/lib/i18n/messages/tprm";
import { createThirdPartyColumns, type ThirdPartyRow } from "./columns";

export function ThirdPartiesTableClient({
  rows,
  locale,
}: {
  rows: ThirdPartyRow[];
  locale: Locale;
}) {
  const t = TPRM_MESSAGES[locale];
  return (
    <DataTable
      columns={createThirdPartyColumns(locale)}
      data={rows}
      searchPlaceholder={t.tp.list.searchPlaceholder}
      getRowHref={(r) => `/third-parties/${r.id}`}
      emptyMessage={t.tp.list.emptyMessage}
      locale={locale}
    />
  );
}
