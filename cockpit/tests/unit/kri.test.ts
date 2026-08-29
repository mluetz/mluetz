import { describe, expect, it } from "vitest";
import { maxCifDependency } from "@/lib/domain/kri";

describe("KRI-K5-04 — Max. CIF-Abhängigkeit je Provider (Review v3, B-2)", () => {
  it("Regression: leere Relation liefert NICHT 0 (Zielerreichung), sondern null (nicht berechenbar)", () => {
    expect(maxCifDependency([])).toBeNull();
  });
  it("liefert das Maximum über alle Provider", () => {
    expect(maxCifDependency([1, 3, 2])).toBe(3);
    expect(maxCifDependency([1])).toBe(1);
  });
  it("0-Zählungen bleiben berechenbar (Provider verknüpft, aber ohne CIF)", () => {
    expect(maxCifDependency([0, 0])).toBe(0);
  });
});
