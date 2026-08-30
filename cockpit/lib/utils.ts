import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Lokalisierte Datumsformatierung (Standard: de-DE). */
export function formatDate(d: Date | string | null | undefined, locale = "de-DE"): string {
  if (!d) return "–";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export function formatDateTime(d: Date | string | null | undefined, locale = "de-DE"): string {
  if (!d) return "–";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function isOverdue(d: Date | string | null | undefined): boolean {
  if (!d) return false;
  return new Date(d).getTime() < Date.now();
}

/** CSV-sicheres Escaping inkl. Schutz vor Formel-Injection in Tabellenkalkulationen. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[";\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(";"), ...rows.map((r) => r.map(csvCell).join(";"))];
  // BOM für Excel-Kompatibilität (Umlaute)
  return "﻿" + lines.join("\r\n");
}
