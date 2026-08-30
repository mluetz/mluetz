import { describe, expect, it } from "vitest";
import {
  classify,
  DEFAULT_THRESHOLDS,
  inherentRisk,
  isAboveAppetite,
  residualRisk,
} from "@/lib/domain/risk-calc";

describe("inherentRisk", () => {
  it("berechnet Likelihood × Impact", () => {
    expect(inherentRisk(1, 1)).toBe(1);
    expect(inherentRisk(3, 5)).toBe(15);
    expect(inherentRisk(5, 5)).toBe(25);
  });

  it("weist ungültige Skalenwerte zurück", () => {
    expect(() => inherentRisk(0, 3)).toThrow(RangeError);
    expect(() => inherentRisk(3, 6)).toThrow(RangeError);
    expect(() => inherentRisk(2.5, 3)).toThrow(RangeError);
  });
});

describe("residualRisk", () => {
  it("reduziert nach Kontrollwirksamkeit mit Mitigation Cap 0.9", () => {
    // 20 × (1 − 1.0 × 0.9) = 2
    expect(residualRisk(20, 100)).toBe(2);
    // 20 × (1 − 0.75 × 0.9) = 6.5 → 7 (Beispiel aus der Methodik)
    expect(residualRisk(20, 75)).toBe(7);
    // 0 % Wirksamkeit: Residual = Inherent
    expect(residualRisk(15, 0)).toBe(15);
  });

  it("fällt nie unter 1 (Restrisiko-Prinzip)", () => {
    expect(residualRisk(1, 100)).toBe(1);
    expect(residualRisk(2, 100)).toBe(1);
  });

  it("respektiert einen konfigurierten Mitigation Cap", () => {
    // Cap 1.0: vollständige Eliminierung möglich → min. 1 greift
    expect(residualRisk(20, 100, 1)).toBe(1);
    // Cap 0.5: 20 × (1 − 1.0 × 0.5) = 10
    expect(residualRisk(20, 100, 0.5)).toBe(10);
  });

  it("validiert Eingaben", () => {
    expect(() => residualRisk(0, 50)).toThrow(RangeError);
    expect(() => residualRisk(26, 50)).toThrow(RangeError);
    expect(() => residualRisk(10, 101)).toThrow(RangeError);
  });
});

describe("classify", () => {
  it("nutzt die Standardgrenzen 4/9/16", () => {
    expect(classify(1)).toBe("LOW");
    expect(classify(4)).toBe("LOW");
    expect(classify(5)).toBe("MEDIUM");
    expect(classify(9)).toBe("MEDIUM");
    expect(classify(10)).toBe("HIGH");
    expect(classify(16)).toBe("HIGH");
    expect(classify(17)).toBe("CRITICAL");
    expect(classify(25)).toBe("CRITICAL");
  });

  it("unterstützt konfigurierte Grenzen", () => {
    const t = { lowMax: 2, mediumMax: 6, highMax: 12 };
    expect(classify(3, t)).toBe("MEDIUM");
    expect(classify(7, t)).toBe("HIGH");
    expect(classify(13, t)).toBe("CRITICAL");
  });
});

describe("isAboveAppetite", () => {
  it("vergleicht Residual gegen Schwelle", () => {
    expect(isAboveAppetite(7, 6)).toBe(true);
    expect(isAboveAppetite(6, 6)).toBe(false);
  });
});

describe("Konsistenz der Default-Schwellen", () => {
  it("deckt 1–25 lückenlos ab", () => {
    expect(DEFAULT_THRESHOLDS.lowMax).toBeLessThan(DEFAULT_THRESHOLDS.mediumMax);
    expect(DEFAULT_THRESHOLDS.mediumMax).toBeLessThan(DEFAULT_THRESHOLDS.highMax);
    expect(DEFAULT_THRESHOLDS.highMax).toBeLessThan(25);
  });
});
