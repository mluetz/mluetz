import { describe, expect, it } from "vitest";
import {
  CLASSIFICATION_CRITERIA,
  deriveIsMajor,
} from "@/lib/domain/incident-classification";

const met = (keys: string[]) =>
  CLASSIFICATION_CRITERIA.map((c) => ({ key: c.key, met: keys.includes(c.key) }));

describe("Ableitung 'schwerwiegend' nach Art. 18 / RTS 2025/301 (P1-04)", () => {
  it("Kritikalität der Dienste + 1 weiteres Kriterium => schwerwiegend", () => {
    expect(deriveIsMajor(met(["CRITICAL_SERVICES", "DURATION"]))).toBe(true);
  });
  it("Kritikalität allein reicht nicht", () => {
    expect(deriveIsMajor(met(["CRITICAL_SERVICES"]))).toBe(false);
  });
  it(">= 3 Kriterien ohne Kritikalität => schwerwiegend", () => {
    expect(deriveIsMajor(met(["CLIENTS", "DURATION", "ECONOMIC"]))).toBe(true);
    expect(deriveIsMajor(met(["CLIENTS", "DURATION"]))).toBe(false);
  });
  it("keine Kriterien => nicht schwerwiegend", () => {
    expect(deriveIsMajor(met([]))).toBe(false);
  });
  it("Kriterienkatalog umfasst die 8 RTS-Dimensionen", () => {
    expect(CLASSIFICATION_CRITERIA).toHaveLength(8);
    expect(CLASSIFICATION_CRITERIA.map((c) => c.key)).toContain("CRITICAL_SERVICES");
  });
});
