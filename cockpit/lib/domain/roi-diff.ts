/**
 * Differenzbericht zwischen zwei Meldeständen (Meldeschicht Welle 3,
 * ADR-0007 Nr. 6): je Meldebogen neu / geändert / entfallen, verglichen über
 * fachliche Zeilenschlüssel (nicht über DB-IDs — die Payload ist ein
 * eingefrorener Registerabzug).
 */

import { ROI_TEMPLATES, type RoiTemplateId } from "@/lib/content/roi-taxonomies";
import type { RoiRegister, RoiRow } from "@/lib/domain/roi-build";

/** Fachlicher Zeilenschlüssel je Meldebogen. */
const KEY_FIELDS: Record<RoiTemplateId, string[]> = {
  "B_01.01": ["entity.lei", "entity.name"],
  "B_01.02": ["entity.lei", "entity.name"],
  "B_01.03": ["entity.lei", "branch.code"],
  "B_02.01": ["contract.ref"],
  "B_02.02": ["contract.ref", "service.ictServiceType"],
  "B_02.03": ["contract.ref"],
  "B_03.01": ["contract.ref", "entity.lei", "entity.name"],
  "B_03.02": ["contract.ref", "tp.tpId"],
  "B_03.03": ["contract.ref", "entity.lei", "entity.name"],
  "B_04.01": ["contract.ref", "entity.lei", "entity.name"],
  "B_05.01": ["tp.tpId"],
  "B_05.02": ["contract.ref", "chain.rank", "chain.name"],
  "B_06.01": ["function.cfId"],
  "B_07.01": ["contract.ref", "service.ictServiceType"],
  "B_99.01": ["definition.field"],
};

export function rowKey(template: RoiTemplateId, row: RoiRow): string {
  return KEY_FIELDS[template].map((f) => String(row[f] ?? "")).join("|");
}

export interface RoiTemplateDiff {
  template: RoiTemplateId;
  added: string[];
  changed: string[];
  removed: string[];
}

export interface RoiDiff {
  templates: RoiTemplateDiff[];
  totalAdded: number;
  totalChanged: number;
  totalRemoved: number;
}

const normalize = (row: RoiRow): string => JSON.stringify(row, Object.keys(row).sort());

/**
 * Vergleicht den Vorstand (previous) mit dem aktuellen Stand (current).
 * Duplizierte Schlüssel innerhalb eines Meldebogens (durch die Validierung
 * ohnehin REJECT) werden über den letzten Eintrag verglichen.
 */
export function diffRegisters(previous: RoiRegister, current: RoiRegister): RoiDiff {
  const templates: RoiTemplateDiff[] = [];
  let totalAdded = 0;
  let totalChanged = 0;
  let totalRemoved = 0;

  for (const template of ROI_TEMPLATES) {
    const prev = new Map<string, string>(
      (previous[template] ?? []).map((r) => [rowKey(template, r), normalize(r)]),
    );
    const curr = new Map<string, string>(
      (current[template] ?? []).map((r) => [rowKey(template, r), normalize(r)]),
    );

    const added: string[] = [];
    const changed: string[] = [];
    const removed: string[] = [];

    for (const [key, value] of curr) {
      const before = prev.get(key);
      if (before === undefined) added.push(key);
      else if (before !== value) changed.push(key);
    }
    for (const key of prev.keys()) {
      if (!curr.has(key)) removed.push(key);
    }

    if (added.length || changed.length || removed.length) {
      templates.push({ template, added, changed, removed });
      totalAdded += added.length;
      totalChanged += changed.length;
      totalRemoved += removed.length;
    }
  }

  return { templates, totalAdded, totalChanged, totalRemoved };
}

/** Parst die Snapshot-Payload zurück in ein Register (tolerant gegen Lücken). */
export function parseRegisterPayload(payload: string): RoiRegister {
  const raw: unknown = JSON.parse(payload);
  const out = {} as RoiRegister;
  for (const template of ROI_TEMPLATES) {
    const rows = (raw as Record<string, unknown>)[template];
    out[template] = Array.isArray(rows) ? (rows as RoiRow[]) : [];
  }
  return out;
}
