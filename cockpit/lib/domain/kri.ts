/**
 * KRI-Berechnungen mit expliziter "nicht berechenbar"-Semantik
 * (Review v3, B-2/P1-02): Eine leere Datenbasis liefert null — niemals 0
 * mit Zielerreichung. Das falsche Entlastungssignal von KRI-K5-04 war der
 * schwerwiegendste Einzelbefund des Reviews.
 */

/** Max. CIF-Abhängigkeit je Provider; null = keine CIF-Drittparteien -> nicht berechenbar. */
export function maxCifDependency(cifCountsPerProvider: number[]): number | null {
  if (cifCountsPerProvider.length === 0) return null;
  return Math.max(...cifCountsPerProvider);
}
