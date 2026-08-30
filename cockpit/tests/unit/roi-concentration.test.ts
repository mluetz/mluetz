import { describe, expect, it } from "vitest";
import {
  crossChainConcentration,
  ctppExposure,
  geoConcentration,
  providerExposure,
} from "@/lib/domain/roi-concentration";
import { isThirdCountry } from "@/lib/content/eea-countries";
import type { RoiInput } from "@/lib/domain/roi-build";
import { cleanRoiFixture } from "./helpers/roi-fixture";

/** Fixture-Erweiterung: zweiter Direktanbieter mit gemeinsamem Kettenglied. */
function extendedFixture(): RoiInput {
  const f = cleanRoiFixture();
  f.thirdParties.push({
    id: "tp-2",
    tpId: "TP-002",
    name: "PaySwitch AG",
    lei: null,
    nationalId: "HRB 777",
    nationalIdType: "HRB",
    registeredCountry: "DE",
    providerType: "DIRECT",
    ultimateParentId: null,
    isCtpp: false,
  });
  f.contracts.push({
    id: "c-3",
    thirdPartyId: "tp-2",
    contractRef: "CTR-2026-003",
    contractType: "STANDALONE",
    startDate: new Date("2025-06-01"),
    endDate: null,
    governingLaw: "DE",
    annualCostEur: 120_000,
    parentContractRef: null,
    isIntragroup: false,
    terminationNoticeDaysEntity: 90,
    terminationNoticeDaysProvider: 90,
    countryOfProvision: "DE",
    countryOfDataStorage: "US",
    countryOfDataProcessing: "DE",
    signingEntityId: "re-bank",
    usingEntityIds: ["re-bank"],
    ictServices: [
      {
        id: "cis-pay",
        ictServiceType: "S02",
        dataStorageCountries: null, // Rückfall auf Vertragsebene (US)
        dataProcessingCountries: "DE",
        dataSensitivity: "HIGH",
        supportedFunctionIds: ["cf-1"],
        cifAssessment: {
          substitutability: "MEDIUM_COMPLEXITY",
          rationale: "Zwei Anbieter am Markt",
          reintegrationTimeDays: 90,
          exitPlanExists: true,
          alternativeProviders: "1",
          lastAuditDate: null,
          auditRightsInContract: true,
        },
      },
    ],
  });
  // Gemeinsames Kettenglied unter beiden Direktanbietern (gleicher Name,
  // einmal mit, einmal ohne LEI-Schreibweise egal — Schlüssel über Name).
  f.subcontractors.push({
    id: "sc-shared",
    thirdPartyId: "tp-2",
    contractId: "c-3",
    parentId: null,
    rank: 1,
    name: "RechenzentrumNord KG",
    lei: null,
    country: "DE",
    ictServiceType: "S07",
    providesCifService: false,
  });
  return f;
}

describe("Exponierung je Dienstleister (Welle 5, ADR-0009)", () => {
  it("zählt CIF-Verträge/-Dienstleistungen, Funktionen und Anteil", () => {
    const exposure = providerExposure(extendedFixture());
    expect(exposure).toHaveLength(2); // tp-1 (S17) und tp-2 (S02); Intragroup ohne CIF fehlt
    const tp1 = exposure.find((e) => e.tpId === "TP-001")!;
    expect(tp1.cifContracts).toBe(1);
    expect(tp1.cifServices).toBe(1);
    expect(tp1.functionIds).toEqual(["cf-1"]);
    expect(tp1.sharePercent).toBe(50);
    expect(tp1.isCtpp).toBe(true);
  });

  it("liefert leeres Ergebnis ohne CIF-Dienste", () => {
    const f = cleanRoiFixture();
    for (const c of f.contracts) for (const s of c.ictServices) s.supportedFunctionIds = [];
    expect(providerExposure(f)).toHaveLength(0);
  });
});

describe("Kettenkonzentration über unabhängige Direktanbieter", () => {
  it("findet Glieder unter mehreren Direktanbietern (Schlüssel: LEI, sonst Name)", () => {
    const result = crossChainConcentration(extendedFixture());
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("RechenzentrumNord KG");
    expect(result[0]!.directProviders).toEqual(["TP-001", "TP-002"]);
    expect(result[0]!.providesCifService).toBe(true); // in Kette von TP-001
  });

  it("meldet nichts, wenn jedes Glied nur unter einem Anbieter auftritt", () => {
    expect(crossChainConcentration(cleanRoiFixture())).toHaveLength(0);
  });
});

describe("Geografische Konzentration mit Drittstaatenkennzeichen", () => {
  it("zählt Speicher-/Verarbeitungsorte je Land inkl. Vertragsrückfall und CIF", () => {
    const geo = geoConcentration(extendedFixture());
    const us = geo.find((g) => g.country === "US")!;
    expect(us.isThirdCountry).toBe(true);
    expect(us.storageServices).toBe(1); // Rückfall auf Vertragsebene
    expect(us.cifServices).toBe(1);
    const de = geo.find((g) => g.country === "DE")!;
    expect(de.isThirdCountry).toBe(false);
    expect(de.processingServices).toBeGreaterThan(0);
  });

  it("EU/EWR-Stammdaten: DE/IS keine Drittstaaten, US/GB schon, leer nie", () => {
    expect(isThirdCountry("DE")).toBe(false);
    expect(isThirdCountry("is")).toBe(false);
    expect(isThirdCountry("US")).toBe(true);
    expect(isThirdCountry("GB")).toBe(true);
    expect(isThirdCountry(null)).toBe(false);
  });
});

describe("CTPP-Exponierung mit Listenabgleich", () => {
  it("gekennzeichnet ohne Listeneintrag => FLAGGED_ONLY (Liste bewusst leer)", () => {
    const result = ctppExposure(extendedFixture(), []);
    expect(result).toHaveLength(1);
    expect(result[0]!.tpId).toBe("TP-001");
    expect(result[0]!.match).toBe("FLAGGED_ONLY");
    expect(result[0]!.cifServices).toBe(1);
  });

  it("Listeneintrag ohne Kennzeichen => LISTED_ONLY; beides => CONFIRMED", () => {
    const f = extendedFixture();
    f.thirdParties.find((tp) => tp.tpId === "TP-002")!.lei = "529900PAYPROCESSX265";
    const list = [
      {
        name: "CloudCore GmbH",
        lei: "529900GGYMNGRQTDOO93",
        designatedAt: "2026-01-01",
        source: "test",
      },
      {
        name: "PaySwitch AG",
        lei: "529900PAYPROCESSX265",
        designatedAt: "2026-01-01",
        source: "test",
      },
    ];
    const result = ctppExposure(f, list);
    expect(result.find((r) => r.tpId === "TP-001")!.match).toBe("CONFIRMED");
    expect(result.find((r) => r.tpId === "TP-002")!.match).toBe("LISTED_ONLY");
  });
});
