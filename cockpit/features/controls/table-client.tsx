"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table";
import type { Locale } from "@/lib/i18n/config";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";
import { createControlColumns, type ControlRow } from "./columns";

export function ControlsTableClient({ rows, locale }: { rows: ControlRow[]; locale: Locale }) {
  const columns = React.useMemo(() => createControlColumns(locale), [locale]);
  const t = OPS_MESSAGES[locale].controls.list;
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder={t.searchPlaceholder}
      getRowHref={(r) => `/controls/${r.id}`}
      emptyMessage={t.empty}
      locale={locale}
    />
  );
}
