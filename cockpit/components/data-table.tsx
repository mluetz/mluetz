"use client";

import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  /** Optionaler Link je Zeile (Detailansicht). */
  getRowHref?: (row: TData) => string;
  pageSize?: number;
  emptyMessage?: string;
  /** UI-Sprache für die eingebauten Beschriftungen (Standard: Deutsch). */
  locale?: "de" | "en";
  /** Erste Spalte fixieren (D-05): horizontaler Scroll statt Clipping. */
  stickyFirstColumn?: boolean;
}

const TABLE_TEXT = {
  de: {
    search: "Suchen…",
    searchAria: "Tabelle durchsuchen",
    empty: "Keine Einträge gefunden.",
    ofEntries: (shown: number, total: number) => `${shown} von ${total} Einträgen`,
    page: (current: number, total: number) => `Seite ${current} von ${total}`,
    prev: "Vorherige Seite",
    next: "Nächste Seite",
  },
  en: {
    search: "Search…",
    searchAria: "Search table",
    empty: "No entries found.",
    ofEntries: (shown: number, total: number) => `${shown} of ${total} entries`,
    page: (current: number, total: number) => `Page ${current} of ${total}`,
    prev: "Previous page",
    next: "Next page",
  },
} as const;

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder,
  getRowHref,
  pageSize = 25,
  emptyMessage,
  locale = "de",
  stickyFirstColumn = false,
}: DataTableProps<TData, TValue>) {
  const text = TABLE_TEXT[locale];
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder ?? text.search}
          className="max-w-xs"
          aria-label={text.searchAria}
        />
        <span className="text-xs text-muted-foreground">
          {text.ofEntries(table.getFilteredRowModel().rows.length, data.length)}
        </span>
      </div>
      <Table className={stickyFirstColumn ? "tbl-sticky-first" : undefined}>
        <THead>
          {table.getHeaderGroups().map((hg) => (
            <TR key={hg.id}>
              {hg.headers.map((header) => (
                <TH key={header.id}>
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TH>
              ))}
            </TR>
          ))}
        </THead>
        <TBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TR
                key={row.id}
                className={getRowHref ? "cursor-pointer" : undefined}
                onClick={
                  getRowHref
                    ? () => {
                        window.location.href = getRowHref(row.original);
                      }
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TD key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TD>
                ))}
              </TR>
            ))
          ) : (
            <TR>
              <TD colSpan={columns.length} className="h-20 text-center text-muted-foreground">
                {emptyMessage ?? text.empty}
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
      {table.getPageCount() > 1 ? (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          {text.page(table.getState().pagination.pageIndex + 1, table.getPageCount())}
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={text.prev}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={text.next}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
