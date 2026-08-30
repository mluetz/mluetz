/**
 * Amtliche Liste der benannten kritischen IKT-Drittdienstleister (CTPP,
 * Art. 31 DORA) — gepflegte STAMMDATENDATEI (Meldeschicht Welle 5,
 * ADR-0009 Nr. 2), nicht hart kodiert und BEWUSST LEER ausgeliefert.
 *
 * Pflegehinweis: Einträge ausschließlich aus der offiziellen
 * ESA-Veröffentlichung übernehmen (Benennungsbeschlüsse der ESAs nach
 * Art. 31 Abs. 1 lit. a DORA) und Quelle samt Datum je Eintrag angeben.
 * Leitplanke des Auftrags: keine erfundenen Regulierungsfakten — lieber
 * eine leere Liste als eine falsche.
 */

export interface CtppListEntry {
  /** Offizieller Name des benannten Dienstleisters. */
  name: string;
  /** LEI, sofern in der Veröffentlichung angegeben (Abgleichsschlüssel). */
  lei: string | null;
  /** Datum des Benennungsbeschlusses (ISO 8601). */
  designatedAt: string;
  /** Fundstelle der Veröffentlichung (URL oder Aktenzeichen). */
  source: string;
}

export const CTPP_LIST_VERSION = "ungepflegt"; // beim Einpflegen auf das Veröffentlichungsdatum setzen

export const CTPP_LIST: CtppListEntry[] = [
  // TODO(verify): amtliche Einträge aus der ESA-Veröffentlichung einpflegen.
];
