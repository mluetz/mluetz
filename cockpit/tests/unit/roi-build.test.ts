import { describe, expect, it } from "vitest";
import { buildRoiRegister, type RoiInput } from "@/lib/domain/roi-build";
import {
  ICT_SERVICE_TYPES,
  ROI_TEMPLATES,
  isTaxonomyCode,
  taxonomyCodes,
} from "@/lib/content/roi-taxonomies";

/**
 * Fixture entspricht strukturell dem Seed-Bestand (prisma/seed.ts,
 * Abschnitt Meldeschicht): Holding + Tochter, eine Niederlassung, ein
 * CIF-gestützter Vertrag mit zwei IKT-Dienstleistungen, Kette Rang 2,
 * gruppeninterner Zweitvertrag.
 */
function fixture(): RoiInput {
  return {
    maintainerEntityId: "re-parent",
    entities: [
      {
        id: "re-parent",
        name: "Nordlicht Holding SE",
        lei: "529900T8BM49AURSDO55",
        nationalId: null,
        nationalIdType: null,
        consolidationLevel: "CONSOLIDATED",
        parentId: null,
        country: "DE",
        entityType: "OTHER",
        hierarchyRole: "PARENT",
        competentAuthority: "BaFin",
        totalAssetsEur: 1_250_000_000,
        lastUpdateAt: new Date("2026-08-01"),
      },
      {
        id: "re-bank",
        name: "Nordlicht Bank AG",
        lei: "5299009D9BIL4D4UHT93",
        nationalId: null,
        nationalIdType: null,
        consolidationLevel: "SOLO",
        parentId: "re-parent",
        country: "DE",
        entityType: "CREDIT_INSTITUTION",
        hierarchyRole: "SUBSIDIARY",
        competentAuthority: "BaFin",
        totalAssetsEur: 800_000_000,
        lastUpdateAt: new Date("2026-08-01"),
      },
    ],
    branches: [
      {
        id: "br-1",
        reportingEntityId: "re-bank",
        branchCode: "5299009D9BIL4D4UHT93-AT01",
        name: "Zweigniederlassung Wien",
        country: "AT",
      },
    ],
    thirdParties: [
      {
        id: "tp-1",
        tpId: "TP-001",
        name: "CloudCore GmbH",
        lei: "529900GGYMNGRQTDOO93",
        nationalId: null,
        nationalIdType: null,
        registeredCountry: "DE",
        providerType: "DIRECT",
        ultimateParentId: "tp-parent",
        isCtpp: true,
      },
      {
        id: "tp-parent",
        tpId: "TP-090",
        name: "CloudCore International plc",
        lei: null,
        nationalId: "UK-123",
        nationalIdType: "OTHER",
        registeredCountry: "GB",
        providerType: "ULTIMATE_PARENT",
        ultimateParentId: null,
        isCtpp: false,
      },
    ],
    contracts: [
      {
        id: "c-1",
        thirdPartyId: "tp-1",
        contractRef: "CTR-2026-001",
        contractType: "STANDALONE",
        startDate: new Date("2025-01-01"),
        endDate: null,
        governingLaw: "DE",
        annualCostEur: 240_000,
        parentContractRef: null,
        isIntragroup: false,
        terminationNoticeDaysEntity: 180,
        terminationNoticeDaysProvider: 365,
        countryOfProvision: "DE",
        countryOfDataStorage: "DE,IE",
        countryOfDataProcessing: "DE",
        signingEntityId: "re-bank",
        usingEntityIds: ["re-bank"],
        ictServices: [
          {
            id: "cis-1",
            ictServiceType: "S17",
            dataStorageCountries: "DE,IE",
            dataProcessingCountries: "DE",
            dataSensitivity: "HIGH",
            supportedFunctionIds: ["cf-1"],
            cifAssessment: {
              substitutability: "HIGHLY_COMPLEX",
              rationale: "Kernbank-Hosting, Migration > 6 Monate",
              reintegrationTimeDays: 180,
              exitPlanExists: true,
              alternativeProviders: "2 europäische Anbieter",
              lastAuditDate: new Date("2026-03-15"),
              auditRightsInContract: true,
            },
          },
          {
            id: "cis-2",
            ictServiceType: "S19",
            dataStorageCountries: null, // fällt auf Vertragsebene zurück
            dataProcessingCountries: null,
            dataSensitivity: "MEDIUM",
            supportedFunctionIds: [],
            cifAssessment: null,
          },
        ],
      },
      {
        id: "c-2",
        thirdPartyId: "tp-1",
        contractRef: "CTR-2026-002",
        contractType: "SUBSEQUENT_OR_ASSOCIATED",
        startDate: new Date("2026-02-01"),
        endDate: null,
        governingLaw: "DE",
        annualCostEur: 30_000,
        parentContractRef: "CTR-2026-001",
        isIntragroup: true,
        terminationNoticeDaysEntity: 90,
        terminationNoticeDaysProvider: 90,
        countryOfProvision: "DE",
        countryOfDataStorage: "DE",
        countryOfDataProcessing: "DE",
        signingEntityId: "re-parent",
        usingEntityIds: ["re-bank"],
        ictServices: [
          {
            id: "cis-3",
            ictServiceType: "S15",
            dataStorageCountries: "DE",
            dataProcessingCountries: "DE",
            dataSensitivity: "LOW",
            supportedFunctionIds: [],
            cifAssessment: null,
          },
        ],
      },
    ],
    subcontractors: [
      {
        id: "sc-1",
        thirdPartyId: "tp-1",
        contractId: "c-1",
        parentId: null,
        rank: 2,
        name: "RechenzentrumNord KG",
        lei: null,
        country: "DE",
        ictServiceType: "S07",
        providesCifService: true,
      },
    ],
    functions: [
      {
        id: "cf-1",
        cfId: "CIF-01",
        functionIdCode: "F-001",
        name: "Zahlungsverkehr",
        isCritical: true,
        licensedActivity: "Zahlungsdienste (ZAG)",
        discontinuationImpact: "Ausfall des Zahlungsverkehrs für alle Kunden binnen Stunden",
        criticalityRationale: "Kernfunktion mit aufsichtlicher Zulassung",
        rtoHours: 4,
        rpoHours: 1,
      },
    ],
    definitions: [
      {
        field: "tp.nationalIdType=OTHER",
        definition: "UK Companies House Registration Number",
      },
    ],
  };
}

describe("RoI-Registeraufbau (Meldeschicht Welle 1, ADR-0005)", () => {
  it("befüllt jeden der 15 Meldebögen mit mindestens einem Datensatz (Abnahme Welle 1)", () => {
    const register = buildRoiRegister(fixture());
    for (const template of ROI_TEMPLATES) {
      expect(register[template].length, template).toBeGreaterThan(0);
    }
  });

  it("B_02.02: eine Zeile je Vertrag × IKT-Dienstleistung, Rückfall auf Vertragsländer", () => {
    const register = buildRoiRegister(fixture());
    expect(register["B_02.02"]).toHaveLength(3);
    const saas = register["B_02.02"].find((r) => r["service.ictServiceType"] === "S19")!;
    expect(saas["service.dataStorageCountries"]).toBe("DE,IE");
    expect(saas["service.supportsCif"]).toBe(false);
    const iaas = register["B_02.02"].find((r) => r["service.ictServiceType"] === "S17")!;
    expect(iaas["service.supportsCif"]).toBe(true);
  });

  it("B_05.02: Rang 1 aus Vertrag/Dienstleistung, Folgeränge aus der Kette", () => {
    const register = buildRoiRegister(fixture());
    const ranks = register["B_05.02"].map((r) => r["chain.rank"]);
    expect(ranks.filter((r) => r === 1)).toHaveLength(3); // 3 Dienstleistungen
    expect(ranks).toContain(2);
    const sub = register["B_05.02"].find((r) => r["chain.rank"] === 2)!;
    expect(sub["contract.ref"]).toBe("CTR-2026-001");
  });

  it("B_07.01: nur bewertete Dienstleistungen; B_02.03/B_03.03 nur gruppenintern", () => {
    const register = buildRoiRegister(fixture());
    expect(register["B_07.01"]).toHaveLength(1);
    expect(register["B_07.01"][0]!["assessment.substitutability"]).toBe("HIGHLY_COMPLEX");
    expect(register["B_02.03"]).toHaveLength(1);
    expect(register["B_02.03"][0]!["contract.ref"]).toBe("CTR-2026-002");
    expect(register["B_03.03"]).toHaveLength(1);
  });

  it("B_05.01: oberste Muttergesellschaft und CTPP-Kennzeichen", () => {
    const register = buildRoiRegister(fixture());
    const direct = register["B_05.01"].find((r) => r["tp.tpId"] === "TP-001")!;
    expect(direct["tp.isCtpp"]).toBe(true);
    expect(direct["tp.providerType"]).toBe("DIRECT");
    const parent = register["B_05.01"].find((r) => r["tp.tpId"] === "TP-090")!;
    expect(parent["tp.providerType"]).toBe("ULTIMATE_PARENT");
  });

  it("Taxonomie: 19 IKT-Dienstleistungsarten, Fixture nutzt nur gültige Codes", () => {
    expect(ICT_SERVICE_TYPES).toHaveLength(19);
    expect(new Set(taxonomyCodes(ICT_SERVICE_TYPES)).size).toBe(19);
    for (const c of fixture().contracts) {
      for (const s of c.ictServices) {
        expect(isTaxonomyCode(ICT_SERVICE_TYPES, s.ictServiceType)).toBe(true);
      }
    }
  });
});
