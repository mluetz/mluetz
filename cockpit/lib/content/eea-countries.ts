/**
 * EU-/EWR-Länderliste (ISO 3166-1 alpha-2) als Stammdaten für das
 * Drittstaatenkennzeichen der Konzentrationsanalytik (Meldeschicht Welle 5,
 * ADR-0009 Nr. 3). Stand: EU-27 plus EWR-Staaten Island, Liechtenstein,
 * Norwegen (Stand 2026-08; bei Erweiterungen/Austritten pflegen).
 */

export const EEA_COUNTRIES: ReadonlySet<string> = new Set([
  // EU-27
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  // EWR
  "IS",
  "LI",
  "NO",
]);

/** Drittstaat = Land außerhalb von EU/EWR (leer/unbekannt zählt nicht). */
export function isThirdCountry(code: string | null | undefined): boolean {
  if (!code) return false;
  return !EEA_COUNTRIES.has(code.trim().toUpperCase());
}
