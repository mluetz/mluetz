"use client";

import * as React from "react";
import { DataTable } from "@/components/data-table";
import type { Locale } from "@/lib/i18n/config";
import { OPS_MESSAGES } from "@/lib/i18n/messages/ops";
import { createEvidenceColumns, type EvidenceRow } from "./columns";

export function EvidenceTableClient({ rows, locale }: { rows: EvidenceRow[]; locale: Locale }) {
  const columns = React.useMemo(() => createEvidenceColumns(locale), [locale]);
  const t = OPS_MESSAGES[locale].evidence.list;
  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder={t.searchPlaceholder}
      getRowHref={(r) => `/evidence/${r.id}`}
      emptyMessage={t.empty}
      locale={locale}
    />
  );
}
