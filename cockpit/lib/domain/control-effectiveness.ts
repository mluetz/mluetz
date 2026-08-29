/**
 * Wirksame Kontrollbewertung mit Nachweisverfall (Review v3, P2-04,
 * verifizierter Befund 3): Eine Kontrolle darf nicht "Effective" oder
 * "Largely Effective" ausweisen, wenn kein GÜLTIGER, reviewter Nachweis
 * verknüpft ist — der wirksame Wert wird auf PARTIALLY_EFFECTIVE gekappt
 * und die Kappung als Grund ausgewiesen (Anzeige + Finding-Erzeugung).
 */

export interface EvidenceLike {
  validUntil: Date | null;
  reviewStatus: string;
}

export function evidenceIsValid(e: EvidenceLike, now: Date = new Date()): boolean {
  return e.reviewStatus === "REVIEWED" && (!e.validUntil || e.validUntil.getTime() >= now.getTime());
}

export interface EffectiveRating {
  rating: string;
  capped: boolean;
  reason: "EVIDENCE_EXPIRED" | "NO_EVIDENCE" | null;
}

const HIGH_RATINGS = ["EFFECTIVE", "LARGELY_EFFECTIVE"];

export function effectiveOperatingRating(
  declaredRating: string,
  evidence: EvidenceLike[],
  now: Date = new Date(),
): EffectiveRating {
  if (!HIGH_RATINGS.includes(declaredRating)) {
    return { rating: declaredRating, capped: false, reason: null };
  }
  if (evidence.length === 0) {
    return { rating: "PARTIALLY_EFFECTIVE", capped: true, reason: "NO_EVIDENCE" };
  }
  const hasValid = evidence.some((e) => evidenceIsValid(e, now));
  if (!hasValid) {
    return { rating: "PARTIALLY_EFFECTIVE", capped: true, reason: "EVIDENCE_EXPIRED" };
  }
  return { rating: declaredRating, capped: false, reason: null };
}
