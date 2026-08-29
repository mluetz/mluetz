import { describe, expect, it } from "vitest";
import { classifyWithDominance, DEFAULT_THRESHOLDS } from "@/lib/domain/risk-calc";
import { sodConflicts } from "@/lib/domain/sod";
import { effectiveOperatingRating } from "@/lib/domain/control-effectiveness";

describe("Impact-Dominanz-Regel (P2-01)", () => {
  it("L2×I5=10 wird nicht schwächer eingestuft als hohe Impacts verdienen", () => {
    // Basisklassifizierung wäre HIGH (10 > 9); Dominanz bestätigt HIGH
    expect(classifyWithDominance(10, 5, false, DEFAULT_THRESHOLDS)).toBe("HIGH");
    // L1×I5=5 wäre MEDIUM — Impact 5 hebt auf HIGH
    expect(classifyWithDominance(5, 5, false, DEFAULT_THRESHOLDS)).toBe("HIGH");
    // Impact 5 mit CIF-Bezug => CRITICAL
    expect(classifyWithDominance(5, 5, true, DEFAULT_THRESHOLDS)).toBe("CRITICAL");
  });
  it("hebt nur an, nie ab; ohne Impact 5 unverändert", () => {
    expect(classifyWithDominance(25, 5, false, DEFAULT_THRESHOLDS)).toBe("CRITICAL");
    expect(classifyWithDominance(8, 2, false, DEFAULT_THRESHOLDS)).toBe("MEDIUM");
    expect(classifyWithDominance(8, null, true, DEFAULT_THRESHOLDS)).toBe("MEDIUM");
  });
});

describe("SoD-Constraints (P2-09)", () => {
  it("Auditor + operative Owner-/Admin-Rollen => Konflikt", () => {
    expect(sodConflicts(["AUDITOR", "RISK_OWNER"]).length).toBeGreaterThan(0);
    expect(sodConflicts(["AUDITOR", "ADMIN"]).length).toBeGreaterThan(0);
    expect(sodConflicts(["AUDITOR", "MANAGEMENT"])).toHaveLength(0);
  });
  it("Second Line + Risk Owner => Konflikt; normale Kombinationen frei", () => {
    expect(sodConflicts(["SECOND_LINE", "RISK_OWNER"]).length).toBeGreaterThan(0);
    expect(sodConflicts(["ISO", "SECOND_LINE"])).toHaveLength(0);
    expect(sodConflicts(["RISK_OWNER", "ACTION_OWNER"])).toHaveLength(0);
  });
});

describe("Nachweisverfall kappt Kontrollwirksamkeit (P2-04, Befund 3)", () => {
  const now = new Date("2026-08-29T12:00:00Z");
  it("EFFECTIVE mit abgelaufenem Nachweis wird auf PARTIALLY_EFFECTIVE gekappt", () => {
    const r = effectiveOperatingRating(
      "EFFECTIVE",
      [{ validUntil: new Date("2026-01-01"), reviewStatus: "REVIEWED" }],
      now,
    );
    expect(r.rating).toBe("PARTIALLY_EFFECTIVE");
    expect(r.capped).toBe(true);
    expect(r.reason).toBe("EVIDENCE_EXPIRED");
  });
  it("nicht reviewter Nachweis zählt nicht als gültig", () => {
    const r = effectiveOperatingRating(
      "LARGELY_EFFECTIVE",
      [{ validUntil: null, reviewStatus: "NOT_REVIEWED" }],
      now,
    );
    expect(r.capped).toBe(true);
  });
  it("gültiger, reviewter Nachweis lässt die Bewertung stehen", () => {
    const r = effectiveOperatingRating(
      "EFFECTIVE",
      [{ validUntil: new Date("2027-01-01"), reviewStatus: "REVIEWED" }],
      now,
    );
    expect(r.rating).toBe("EFFECTIVE");
    expect(r.capped).toBe(false);
  });
  it("niedrige Bewertungen werden nie angefasst; ohne Nachweis wird gekappt", () => {
    expect(effectiveOperatingRating("INEFFECTIVE", [], now).capped).toBe(false);
    const r = effectiveOperatingRating("EFFECTIVE", [], now);
    expect(r.capped).toBe(true);
    expect(r.reason).toBe("NO_EVIDENCE");
  });
});
