import { describe, expect, it } from "vitest";
import { buildRoiRegister } from "@/lib/domain/roi-build";
import { cleanRoiFixture as fixture } from "./helpers/roi-fixture";
import {
  ICT_SERVICE_TYPES,
  ROI_TEMPLATES,
  isTaxonomyCode,
  taxonomyCodes,
} from "@/lib/content/roi-taxonomies";

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
