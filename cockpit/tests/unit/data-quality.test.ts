import { describe, expect, it } from "vitest";
import {
  dataQualityScore,
  missingRiskFieldsForTransition,
  riskDqFields,
  thirdPartyDqFields,
} from "@/lib/domain/data-quality";

const base = {
  ownerId: "u1",
  categoryId: "c1",
  hasCurrentAssessment: true,
  treatmentStrategy: "REDUCE",
  description: "Ausführliche Risikobeschreibung mit ausreichender Länge.",
  cifRelated: false,
  hasLinkedControl: false,
};

describe("Pflichtfeldlogik je Statusübergang (P3-02)", () => {
  it("blockiert TREATMENT ohne Behandlungsstrategie", () => {
    const missing = missingRiskFieldsForTransition("TREATMENT", {
      ...base,
      treatmentStrategy: null,
    });
    expect(missing.map((m) => m.field)).toContain("treatmentStrategy");
  });
  it("blockiert OPEN ohne aktuelle Bewertung", () => {
    const missing = missingRiskFieldsForTransition("OPEN", {
      ...base,
      hasCurrentAssessment: false,
    });
    expect(missing.map((m) => m.field)).toContain("assessment");
  });
  it("blockiert Übergänge ohne Owner (außer DRAFT/REJECTED)", () => {
    expect(
      missingRiskFieldsForTransition("IN_ASSESSMENT", { ...base, ownerId: null }).map(
        (m) => m.field,
      ),
    ).toContain("ownerId");
    expect(
      missingRiskFieldsForTransition("REJECTED", { ...base, ownerId: null }),
    ).toHaveLength(0);
  });
  it("CIF-Bezug erzwingt verknüpfte Kontrolle ab TREATMENT", () => {
    const missing = missingRiskFieldsForTransition("TREATMENT", {
      ...base,
      cifRelated: true,
      hasLinkedControl: false,
    });
    expect(missing.some((m) => m.reason === "cif")).toBe(true);
    const ok = missingRiskFieldsForTransition("TREATMENT", {
      ...base,
      cifRelated: true,
      hasLinkedControl: true,
    });
    expect(ok).toHaveLength(0);
  });
  it("erlaubt vollständige Übergänge", () => {
    expect(missingRiskFieldsForTransition("MONITORING", base)).toHaveLength(0);
  });
});

describe("Datenqualitäts-Score", () => {
  it("liefert 100 bei vollständigen Feldern und listet fehlende auf", () => {
    const full = dataQualityScore(riskDqFields({
      ownerId: "u1",
      categoryId: "c1",
      hasCurrentAssessment: true,
      treatmentStrategy: "REDUCE",
      description: "Lange, aussagekräftige Beschreibung des Risikos.",
      nextReviewDate: new Date(),
    }));
    expect(full.score).toBe(100);
    expect(full.missing).toHaveLength(0);

    const partial = dataQualityScore(riskDqFields({
      ownerId: null,
      categoryId: "c1",
      hasCurrentAssessment: false,
      treatmentStrategy: null,
      description: "kurz",
      nextReviewDate: null,
    }));
    expect(partial.score).toBeLessThan(40);
    expect(partial.missing).toContain("owner");
    expect(partial.missing).toContain("currentAssessment");
  });
  it("CIF-Drittpartei ohne Exit-Strategie wird abgewertet", () => {
    const withCif = dataQualityScore(thirdPartyDqFields({
      businessOwnerId: "u",
      contractOwnerId: "u",
      assessmentDate: new Date(),
      nextReviewDate: new Date(),
      contractCount: 1,
      cifCount: 2,
      hasExitStrategy: false,
      substitutability: "DIFFICULT",
    }));
    expect(withCif.missing).toContain("exitStrategy");
    expect(withCif.score).toBeLessThan(100);
  });
});
