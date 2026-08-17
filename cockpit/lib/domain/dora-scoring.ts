/**
 * DORA-Reifegrad- und Scoring-Modell nach FRWK-DORA-001, Kapitel 11.
 *
 * Bewusst deterministisch und nebenwirkungsfrei, damit jede Kennzahl im
 * Prüfungsfall nachvollzogen werden kann (Kap. 15.6). Alle Regeln sind
 * hier zentral implementiert und durch Unit-Tests abgesichert:
 *
 *  - Gewicht je Anforderung: MUSS = 3, SOLL = 2, KANN = 1
 *  - Score je Anforderung = wirksamer Reifegrad (0–5) × Gewicht
 *  - Nachweissperre: ohne gültigen, geprüften Nachweis ist der wirksame
 *    Reifegrad auf höchstens 2 begrenzt (Kap. 11.1 / 15.6 Regel 1)
 *  - Kapitel-Score % = Σ Scores ÷ Σ Maximalscores (5 × Gewicht) × 100
 *  - DORA Resilience Index = Σ (Kapitel-Score × Kapitelgewicht) ÷ 100
 *  - Knockout-Übersteuerung: KO-Anforderung mit wirksamem Reifegrad < 3
 *    → Kapitelstatus ROT, unabhängig vom Score
 *  - Ampellogik: GRÜN ≥ 85 % ohne offenen Knockout und ohne überfällige
 *    kritische Maßnahme; GELB 60–84 %; ROT < 60 % oder offener Knockout
 */

export const EVIDENCE_MATURITY_CAP = 2;
export const KNOCKOUT_MATURITY_THRESHOLD = 3;
export const GREEN_MIN_SCORE = 85;
export const YELLOW_MIN_SCORE = 60;

export type TrafficLight = "GREEN" | "YELLOW" | "RED";

export interface RequirementInput {
  reqId: string;
  weight: number; // 3 | 2 | 1
  knockout: boolean;
  /** Roh-Reifegrad 0–5 der aktuellen Bewertung; null = noch nicht bewertet (zählt als 0). */
  maturity: number | null;
  /** Existiert ein verknüpfter Nachweis, der gültig (nicht abgelaufen) und geprüft ist? */
  hasValidEvidence: boolean;
}

export interface ChapterResult {
  scorePercent: number; // 0–100, gerundet auf 1 Nachkommastelle
  openKnockouts: string[]; // reqIds der KO-Anforderungen mit wirksamem Reifegrad < 3
  status: TrafficLight;
  assessedCount: number;
  totalCount: number;
}

/** Wirksamer Reifegrad inkl. Nachweissperre. */
export function effectiveMaturity(maturity: number | null, hasValidEvidence: boolean): number {
  const raw = maturity ?? 0;
  if (!Number.isInteger(raw) || raw < 0 || raw > 5) {
    throw new RangeError(`Reifegrad muss ganzzahlig 0–5 sein, erhalten: ${raw}`);
  }
  return hasValidEvidence ? raw : Math.min(raw, EVIDENCE_MATURITY_CAP);
}

export function chapterScore(
  requirements: RequirementInput[],
  opts: { hasOverdueCriticalCapa?: boolean } = {},
): ChapterResult {
  let sum = 0;
  let max = 0;
  const openKnockouts: string[] = [];
  let assessedCount = 0;

  for (const r of requirements) {
    const eff = effectiveMaturity(r.maturity, r.hasValidEvidence);
    sum += eff * r.weight;
    max += 5 * r.weight;
    if (r.maturity !== null) assessedCount += 1;
    if (r.knockout && eff < KNOCKOUT_MATURITY_THRESHOLD) openKnockouts.push(r.reqId);
  }

  const scorePercent = max === 0 ? 0 : Math.round((sum / max) * 1000) / 10;
  return {
    scorePercent,
    openKnockouts,
    status: trafficLight(scorePercent, openKnockouts.length, opts.hasOverdueCriticalCapa ?? false),
    assessedCount,
    totalCount: requirements.length,
  };
}

/** Ampellogik nach Tabelle 23; Knockout und überfällige kritische CAPA übersteuern den Score. */
export function trafficLight(
  scorePercent: number,
  openKnockouts: number,
  hasOverdueCriticalCapa: boolean,
): TrafficLight {
  if (openKnockouts > 0 || scorePercent < YELLOW_MIN_SCORE) return "RED";
  if (scorePercent >= GREEN_MIN_SCORE && !hasOverdueCriticalCapa) return "GREEN";
  return "YELLOW";
}

export interface ChapterWeight {
  key: string; // K2 … K6
  weightPercent: number;
  result: ChapterResult;
}

/** DORA Resilience Index: gewichteter Mittelwert der Kapitel-Scores mit Knockout-Übersteuerung. */
export function resilienceIndex(chapters: ChapterWeight[]): {
  indexPercent: number;
  totalOpenKnockouts: number;
  status: TrafficLight;
} {
  const totalWeight = chapters.reduce((s, c) => s + c.weightPercent, 0);
  const weighted =
    totalWeight === 0
      ? 0
      : chapters.reduce((s, c) => s + c.result.scorePercent * c.weightPercent, 0) / totalWeight;
  const totalOpenKnockouts = chapters.reduce((s, c) => s + c.result.openKnockouts.length, 0);
  const anyOverdueCritical = chapters.some((c) => c.result.status === "YELLOW" && c.result.scorePercent >= GREEN_MIN_SCORE);
  const indexPercent = Math.round(weighted * 10) / 10;
  return {
    indexPercent,
    totalOpenKnockouts,
    status: trafficLight(indexPercent, totalOpenKnockouts, anyOverdueCritical),
  };
}

/** Schweregrad-Systematik für Findings nach Tabelle 24 (Fristen in Arbeitstagen ≈ Kalendertage konservativ gerechnet). */
export const FINDING_SEVERITY_RULES: Record<
  string,
  { label: string; responseDays: number; remediationDays: number; escalateTo: string }
> = {
  CRITICAL: { label: "Kritisch", responseDays: 0, remediationDays: 14, escalateTo: "Leitungsorgan" },
  HIGH: { label: "Hoch", responseDays: 7, remediationDays: 42, escalateTo: "CISO" },
  MEDIUM: { label: "Mittel", responseDays: 14, remediationDays: 126, escalateTo: "Fachbereichsleitung" },
  LOW: { label: "Gering", responseDays: 28, remediationDays: 252, escalateTo: "Prozessverantwortlicher" },
};
