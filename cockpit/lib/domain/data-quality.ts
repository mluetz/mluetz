/**
 * Pflichtfeldlogik je Statusübergang und Datenqualitäts-Score
 * (Review v3, P3-02). Bewusst als reine Funktionen gehalten, damit sie
 * ohne DB testbar sind; die Server Actions rufen sie blockierend auf.
 */

export interface RiskFieldSnapshot {
  ownerId: string | null;
  categoryId: string | null;
  hasCurrentAssessment: boolean;
  treatmentStrategy: string | null;
  description: string;
  cifRelated: boolean;
  /** Nur bei CIF-Bezug Pflicht (CIF-abhängige Zusatzpflichtfelder). */
  hasLinkedControl: boolean;
}

export interface MissingField {
  field: string;
  reason: "always" | "transition" | "cif";
}

/**
 * Pflichtfelder, die für den ZIELSTATUS erfüllt sein müssen. Ergebnis leer =
 * Übergang zulässig. Regeln aus Review v3:
 *  - ab IN_ASSESSMENT: Owner und Kategorie
 *  - ab OPEN (inkl. TREATMENT/MONITORING): aktuelle Bewertung
 *  - TREATMENT: Behandlungsstrategie gesetzt
 *  - CIF-Bezug: mindestens eine verknüpfte Kontrolle ab TREATMENT
 */
export function missingRiskFieldsForTransition(
  to: string,
  r: RiskFieldSnapshot,
): MissingField[] {
  const missing: MissingField[] = [];
  const needsOwner = to !== "DRAFT" && to !== "REJECTED";
  if (needsOwner && !r.ownerId) missing.push({ field: "ownerId", reason: "always" });
  if (needsOwner && !r.categoryId) missing.push({ field: "categoryId", reason: "always" });

  const assessedStates = [
    "OPEN",
    "TREATMENT",
    "MONITORING",
    "ACCEPTED",
    "CLOSURE_REVIEW",
    "CLOSED",
  ];
  if (assessedStates.includes(to) && !r.hasCurrentAssessment)
    missing.push({ field: "assessment", reason: "transition" });

  if ((to === "TREATMENT" || to === "MONITORING") && !r.treatmentStrategy)
    missing.push({ field: "treatmentStrategy", reason: "transition" });

  if (r.cifRelated && (to === "TREATMENT" || to === "MONITORING") && !r.hasLinkedControl)
    missing.push({ field: "linkedControl", reason: "cif" });

  return missing;
}

// ------------------------------------------------------------------
// Datenqualitäts-Score je Datensatz: Anteil gefüllter Soll-Felder (0–100).
// ------------------------------------------------------------------

export interface DqField {
  name: string;
  filled: boolean;
  /** Gewicht, Default 1. */
  weight?: number;
}

export function dataQualityScore(fields: DqField[]): {
  score: number;
  missing: string[];
} {
  if (fields.length === 0) return { score: 100, missing: [] };
  let total = 0;
  let got = 0;
  const missing: string[] = [];
  for (const f of fields) {
    const w = f.weight ?? 1;
    total += w;
    if (f.filled) got += w;
    else missing.push(f.name);
  }
  return { score: Math.round((got / total) * 100), missing };
}

export function riskDqFields(r: {
  ownerId: string | null;
  categoryId: string | null;
  hasCurrentAssessment: boolean;
  treatmentStrategy: string | null;
  description: string;
  nextReviewDate: Date | null;
}): DqField[] {
  return [
    { name: "owner", filled: r.ownerId !== null, weight: 2 },
    { name: "category", filled: r.categoryId !== null },
    { name: "currentAssessment", filled: r.hasCurrentAssessment, weight: 2 },
    { name: "treatmentStrategy", filled: r.treatmentStrategy !== null },
    { name: "description", filled: r.description.trim().length >= 20 },
    { name: "nextReviewDate", filled: r.nextReviewDate !== null },
  ];
}

export function thirdPartyDqFields(t: {
  businessOwnerId: string | null;
  contractOwnerId: string | null;
  assessmentDate: Date | null;
  nextReviewDate: Date | null;
  contractCount: number;
  cifCount: number;
  hasExitStrategy: boolean;
  substitutability: string;
}): DqField[] {
  const fields: DqField[] = [
    { name: "businessOwner", filled: t.businessOwnerId !== null },
    { name: "contractOwner", filled: t.contractOwnerId !== null },
    { name: "assessment", filled: t.assessmentDate !== null, weight: 2 },
    { name: "nextReviewDate", filled: t.nextReviewDate !== null },
    { name: "contract", filled: t.contractCount > 0 },
    { name: "substitutability", filled: t.substitutability !== "NOT_ASSESSED" },
  ];
  // CIF-abhängige Zusatzpflicht: Exit-Strategie
  if (t.cifCount > 0) fields.push({ name: "exitStrategy", filled: t.hasExitStrategy, weight: 2 });
  return fields;
}
