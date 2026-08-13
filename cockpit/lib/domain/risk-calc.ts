import type { RiskClass } from "./enums";

/**
 * Risikoberechnung (transparent dokumentiert in docs/governance/risk-methodology.md).
 *
 *   Inherent Risk  = Likelihood × Impact                       (1–25)
 *   Residual Risk  = round(Inherent × (1 − e × mitigationCap)) (min. 1)
 *
 * e            = Kontrollwirksamkeit als Anteil (0 … 1)
 * mitigationCap = maximal anrechenbare Risikominderung (Default 0,9):
 *                 auch eine zu 100 % wirksame Kontrolle eliminiert ein
 *                 Risiko nie vollständig (Restrisiko-Prinzip).
 *
 * Alle Parameter sind über AppSetting konfigurierbar (lib/settings.ts).
 */

export interface RiskThresholds {
  lowMax: number; // Default 4
  mediumMax: number; // Default 9
  highMax: number; // Default 16
  // > highMax = CRITICAL (bis 25)
}

export const DEFAULT_THRESHOLDS: RiskThresholds = { lowMax: 4, mediumMax: 9, highMax: 16 };
export const DEFAULT_MITIGATION_CAP = 0.9;

export function inherentRisk(likelihood: number, impact: number): number {
  assertScale(likelihood, "likelihood");
  assertScale(impact, "impact");
  return likelihood * impact;
}

export function residualRisk(
  inherent: number,
  effectivenessPercent: number,
  mitigationCap: number = DEFAULT_MITIGATION_CAP,
): number {
  if (inherent < 1 || inherent > 25) throw new RangeError(`inherent out of range: ${inherent}`);
  if (effectivenessPercent < 0 || effectivenessPercent > 100)
    throw new RangeError(`effectiveness out of range: ${effectivenessPercent}`);
  const e = effectivenessPercent / 100;
  // Fließkomma-stabil runden (z. B. 20 × 0,325 = 6.4999… → 6.5 → 7),
  // damit das Ergebnis exakt der dokumentierten Methodik entspricht.
  const raw = Number((inherent * (1 - e * mitigationCap)).toFixed(6));
  return Math.max(1, Math.round(raw));
}

export function classify(
  score: number,
  t: RiskThresholds = DEFAULT_THRESHOLDS,
): RiskClass {
  if (score <= t.lowMax) return "LOW";
  if (score <= t.mediumMax) return "MEDIUM";
  if (score <= t.highMax) return "HIGH";
  return "CRITICAL";
}

/** Überschreitet der Residual-Score den Risikoappetit? */
export function isAboveAppetite(residual: number, appetiteThreshold: number): boolean {
  return residual > appetiteThreshold;
}

function assertScale(v: number, name: string): void {
  if (!Number.isInteger(v) || v < 1 || v > 5)
    throw new RangeError(`${name} must be an integer 1–5, got ${v}`);
}
