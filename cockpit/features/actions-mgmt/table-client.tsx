"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table";
import type { Locale } from "@/lib/i18n/config";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";
import { createActionColumns, type ActionMgmtRow } from "./columns";

export function ActionsTableClient({ rows, locale }: { rows: ActionMgmtRow[]; locale: Locale }) {
  const columns = React.useMemo(() => createActionColumns(locale), [locale]);
  const t = OPS_MESSAGES[locale].actions.list;
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder={t.searchPlaceholder}
      getRowHref={(r) => `/actions/${r.id}`}
      emptyMessage={t.empty}
      locale={locale}
    />
  );
}
