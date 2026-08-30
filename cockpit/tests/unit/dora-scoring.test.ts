import { describe, expect, it } from "vitest";
import {
  chapterScore,
  effectiveMaturity,
  resilienceIndex,
  trafficLight,
  type RequirementInput,
} from "@/lib/domain/dora-scoring";

const req = (over: Partial<RequirementInput>): RequirementInput => ({
  reqId: "DORA-K2-001",
  weight: 3,
  knockout: false,
  maturity: 3,
  hasValidEvidence: true,
  ...over,
});

describe("effectiveMaturity (Nachweissperre)", () => {
  it("deckelt ohne gültigen Nachweis auf höchstens 2", () => {
    expect(effectiveMaturity(5, false)).toBe(2);
    expect(effectiveMaturity(3, false)).toBe(2);
    expect(effectiveMaturity(1, false)).toBe(1);
  });
  it("lässt mit gültigem Nachweis den Rohwert durch", () => {
    expect(effectiveMaturity(5, true)).toBe(5);
    expect(effectiveMaturity(0, true)).toBe(0);
  });
  it("behandelt unbewertet als 0 und validiert den Wertebereich", () => {
    expect(effectiveMaturity(null, true)).toBe(0);
    expect(() => effectiveMaturity(6, true)).toThrow(RangeError);
    expect(() => effectiveMaturity(-1, true)).toThrow(RangeError);
  });
});

describe("chapterScore (Kap. 11.2)", () => {
  it("berechnet Score als gewichteten Anteil des Maximums", () => {
    // 2 Anforderungen: MUSS (3) mit Reifegrad 5, KANN (1) mit Reifegrad 0
    // Score = (5*3 + 0*1) / (5*3 + 5*1) = 15/20 = 75 %
    const r = chapterScore([
      req({ maturity: 5, weight: 3 }),
      req({ reqId: "DORA-K2-002", maturity: 0, weight: 1 }),
    ]);
    expect(r.scorePercent).toBe(75);
    expect(r.openKnockouts).toHaveLength(0);
  });

  it("Knockout-Übersteuerung: KO mit Reifegrad < 3 setzt Kapitel auf ROT trotz gutem Score", () => {
    // Beispiel aus dem Dokument: Kapitel V mit 67 % steht auf Rot wegen KO
    const reqs = [
      req({ maturity: 5, weight: 3 }),
      req({ reqId: "DORA-K5-011", maturity: 2, weight: 3, knockout: true }),
      req({ reqId: "DORA-K5-003", maturity: 4, weight: 3 }),
    ];
    const r = chapterScore(reqs);
    expect(r.scorePercent).toBeGreaterThanOrEqual(60);
    expect(r.openKnockouts).toEqual(["DORA-K5-011"]);
    expect(r.status).toBe("RED");
  });

  it("Nachweissperre wirkt in den Knockout-Check hinein", () => {
    // Reifegrad 4 selbstbewertet, aber ohne Nachweis → wirksam 2 → Knockout offen
    const r = chapterScore([req({ knockout: true, maturity: 4, hasValidEvidence: false })]);
    expect(r.openKnockouts).toEqual(["DORA-K2-001"]);
    expect(r.status).toBe("RED");
  });
});

describe("trafficLight (Tabelle 23)", () => {
  it("GRÜN ab 85 % ohne Knockout und ohne überfällige kritische CAPA", () => {
    expect(trafficLight(85, 0, false)).toBe("GREEN");
    expect(trafficLight(92.5, 0, false)).toBe("GREEN");
  });
  it("GELB zwischen 60 und 84 oder bei überfälliger kritischer CAPA", () => {
    expect(trafficLight(60, 0, false)).toBe("YELLOW");
    expect(trafficLight(84.9, 0, false)).toBe("YELLOW");
    expect(trafficLight(90, 0, true)).toBe("YELLOW");
  });
  it("ROT unter 60 % oder bei offenem Knockout", () => {
    expect(trafficLight(59.9, 0, false)).toBe("RED");
    expect(trafficLight(95, 1, false)).toBe("RED");
  });
});

describe("resilienceIndex", () => {
  it("gewichtet die Kapitel-Scores nach Kapitelgewicht", () => {
    const mk = (scorePercent: number, openKnockouts: string[] = []) => ({
      scorePercent,
      openKnockouts,
      status: trafficLight(scorePercent, openKnockouts.length, false),
      assessedCount: 1,
      totalCount: 1,
    });
    const idx = resilienceIndex([
      { key: "K2", weightPercent: 30, result: mk(80) },
      { key: "K3", weightPercent: 25, result: mk(90) },
      { key: "K4", weightPercent: 15, result: mk(70) },
      { key: "K5", weightPercent: 25, result: mk(67, ["DORA-K5-011"]) },
      { key: "K6", weightPercent: 5, result: mk(60) },
    ]);
    // 0.30*80 + 0.25*90 + 0.15*70 + 0.25*67 + 0.05*60 = 76.75
    expect(idx.indexPercent).toBe(76.8);
    expect(idx.totalOpenKnockouts).toBe(1);
    expect(idx.status).toBe("RED"); // Knockout übersteuert
  });
});
