/**
 * Meldepaket des DORA-Informationsregisters (Meldeschicht Welle 3, ADR-0007):
 * reine Funktionen — CSV je Meldebogen, Filing Indicators, Metadaten und
 * menschenlesbarer Prüfbericht; Paketierung als Store-only-ZIP (zip.ts).
 *
 * Paketkonvention (ADR-0007 Nr. 2, TODO(verify) gegen die verbindliche
 * xBRL-CSV-Konvention der EBA-Filing-Rules — hier bewusst in einer Datei
 * gekapselt):
 *   report/B_xx.yy.csv            eine Datei je Meldebogen, UTF-8, ';'
 *   META-INF/report.json          Taxonomieversion, Stichtag, Meldeebene, LEI
 *   META-INF/filing-indicators.csv  je Meldebogen belegt/nicht belegt
 *   pruefbericht.csv              Befundliste auf Feldebene
 */

import { ROI_TEMPLATES, type RoiTemplateId } from "@/lib/content/roi-taxonomies";
import type { RoiRegister, RoiRow } from "@/lib/domain/roi-build";
import type { RoiFinding, RoiValidationSummary } from "@/lib/domain/roi-validation";
import { buildZip, type ZipEntry } from "@/lib/domain/zip";

const SEP = ";";

/** CSV-Escaping: Quoting bei Trennzeichen, Anführungszeichen, Zeilenumbruch. */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s =
    v instanceof Date
      ? v.toISOString().slice(0, 10)
      : typeof v === "boolean"
        ? v
          ? "true"
          : "false"
        : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV eines Meldebogens: Spaltenreihenfolge = Schlüsselreihenfolge der ersten
 * Zeile (deterministisch aus roi-build); jede Zeile erhält exakt diese
 * Spaltenzahl.
 */
export function templateCsv(rows: RoiRow[]): string {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]!);
  const header = columns.map(csvCell).join(SEP);
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(SEP)).join("\n");
  return `${header}\n${body}\n`;
}

/** Prüfbericht: ein Befund je Zeile, Feldebene (ADR-0007 Nr. 3). */
export function findingsCsv(findings: RoiFinding[], locale: "de" | "en" = "de"): string {
  const header = ["ruleId", "severity", "template", "record", "field", "message"]
    .map(csvCell)
    .join(SEP);
  const body = findings
    .map((f) =>
      [
        f.ruleId,
        f.severity,
        f.template,
        f.recordRef,
        f.field,
        locale === "de" ? f.messageDe : f.messageEn,
      ]
        .map(csvCell)
        .join(SEP),
    )
    .join("\n");
  return body ? `${header}\n${body}\n` : `${header}\n`;
}

export interface RoiPackageMeta {
  taxonomyVersion: string;
  referenceDate: Date;
  reportingLevel: string;
  entityLei: string | null;
  entityName: string | null;
  generatedAt: Date;
  generatedBy: string;
  validationSummary: RoiValidationSummary;
}

export interface RoiPackage {
  zip: Buffer;
  /** Dateiliste des Pakets (für Tests und Anzeige). */
  files: string[];
  /** Serialisierter Registerinhalt (Payload des RoiSnapshot). */
  payload: string;
}

/** Baut das vollständige Meldepaket aus Register, Befunden und Metadaten. */
export function buildRoiPackage(
  register: RoiRegister,
  findings: RoiFinding[],
  meta: RoiPackageMeta,
): RoiPackage {
  const entries: ZipEntry[] = [];

  for (const template of ROI_TEMPLATES) {
    const rows = register[template];
    if (rows.length > 0) {
      entries.push({ name: `report/${template}.csv`, data: templateCsv(rows) });
    }
  }

  const indicators = [
    ["template", "reported"].map(csvCell).join(SEP),
    ...ROI_TEMPLATES.map((tpl: RoiTemplateId) =>
      [tpl, register[tpl].length > 0 ? "true" : "false"].map(csvCell).join(SEP),
    ),
  ].join("\n");
  entries.push({ name: "META-INF/filing-indicators.csv", data: `${indicators}\n` });

  entries.push({
    name: "META-INF/report.json",
    data: `${JSON.stringify(
      {
        standard: "DORA Register of Information (DVO (EU) 2024/2956)",
        note: "Meldeentwurf aus dem ICT & TPRM Cockpit — keine aufsichtliche Abgabe",
        taxonomyVersion: meta.taxonomyVersion,
        referenceDate: meta.referenceDate.toISOString().slice(0, 10),
        reportingLevel: meta.reportingLevel,
        entityLei: meta.entityLei,
        entityName: meta.entityName,
        generatedAt: meta.generatedAt.toISOString(),
        generatedBy: meta.generatedBy,
        validation: meta.validationSummary,
      },
      null,
      2,
    )}\n`,
  });

  entries.push({ name: "pruefbericht.csv", data: findingsCsv(findings) });

  const payload = JSON.stringify(register);
  return {
    zip: buildZip(entries, meta.generatedAt),
    files: entries.map((e) => e.name),
    payload,
  };
}

/** Dateiname des Pakets nach Konvention (ADR-0007 Nr. 2). */
export function packageFileName(
  referenceDate: Date,
  reportingLevel: string,
  version: number,
): string {
  return `roi_${referenceDate.toISOString().slice(0, 10)}_${reportingLevel.toLowerCase()}_v${version}.zip`;
}
