import { describe, expect, it } from "vitest";
import { isValidLei, isValidLeiFormat } from "@/lib/domain/lei";
import { contractComplianceRag, requiredClausesFor } from "@/lib/domain/art30";
import { concentrationOverChain } from "@/lib/domain/concentration";

describe("LEI-Validierung (ISO 17442, P1-01/1.3)", () => {
  it("akzeptiert echte LEIs mit gültiger Prüfziffer", () => {
    // Deutsche Bundesbank und BaFin-nahe Beispiele öffentlicher LEIs
    expect(isValidLei("529900GGYMNGRQTDOO93")).toBe(true); // Volkswagen AG
    expect(isValidLei("529900T8BM49AURSDO55")).toBe(true);
  });
  it("weist falsche Prüfziffern und Formate zurück", () => {
    expect(isValidLei("529900GGYMNGRQTDOO94")).toBe(false);
    expect(isValidLei("XX123")).toBe(false);
    expect(isValidLeiFormat("529900GGYMNGRQTDOOAA")).toBe(false); // Prüfziffern müssen Ziffern sein
  });
});

describe("Art.-30-Klauselmatrix (P1-03)", () => {
  it("umfasst 8 Klauseln für alle Verträge und 15 für CIF-Verträge", () => {
    expect(requiredClausesFor(false)).toHaveLength(8);
    expect(requiredClausesFor(true)).toHaveLength(15);
  });
  it("RAG: fehlende Pflichtklausel => RED, teilweise => YELLOW, sonst GREEN", () => {
    const all = requiredClausesFor(true);
    const green = new Map(all.map((c) => [c.key, "FULFILLED" as const]));
    expect(contractComplianceRag(true, green)).toBe("GREEN");
    const yellow = new Map(green);
    yellow.set("ART30_2_H", "PARTIAL");
    expect(contractComplianceRag(true, yellow)).toBe("YELLOW");
    const red = new Map(green);
    red.set("ART30_3_D", "MISSING");
    expect(contractComplianceRag(true, red)).toBe("RED");
    // Nicht-CIF-Vertrag ignoriert Abs.-3-Lücken
    expect(contractComplianceRag(false, red)).toBe("GREEN");
    // Unquittierte Klausel gilt als MISSING
    const empty = new Map<string, "FULFILLED">();
    expect(contractComplianceRag(false, empty)).toBe("RED");
  });
});

describe("Konzentration über die gesamte Kette (B-3/2.3)", () => {
  it("führt gemeinsame Kettenglieder über LEI zusammen und zählt CIF dedupliziert", () => {
    const result = concentrationOverChain([
      {
        tpName: "CloudCore",
        tpLei: "LEI-A",
        tpCountry: "DE",
        cifIds: ["cif1", "cif2"],
        chain: [
          { name: "Nordic DC", lei: "LEI-DC", country: "DK", rank: 1, providesCifService: true },
        ],
      },
      {
        tpName: "SOC Provider",
        tpLei: "LEI-B",
        tpCountry: "DE",
        cifIds: ["cif1", "cif3"],
        chain: [
          { name: "NORDIC DC (anders geschrieben)", lei: "lei-dc", country: "DK", rank: 1, providesCifService: false },
        ],
      },
    ]);
    const dc = result.find((p) => p.key === "lei:LEI-DC");
    expect(dc).toBeDefined();
    expect(dc!.cifCount).toBe(3); // cif1 dedupliziert über beide Ketten
    expect(dc!.chains).toBe(2);
    expect(dc!.direct).toBe(false);
    const top = result[0]!;
    expect(top.cifCount).toBeGreaterThanOrEqual(2);
  });
  it("fällt ohne LEI auf den normalisierten Namen zurück", () => {
    const result = concentrationOverChain([
      {
        tpName: "A",
        tpLei: null,
        tpCountry: "DE",
        cifIds: ["c1"],
        chain: [{ name: "  Shared   Sub ", lei: null, country: "PL", rank: 1, providesCifService: false }],
      },
      {
        tpName: "B",
        tpLei: null,
        tpCountry: "AT",
        cifIds: ["c2"],
        chain: [{ name: "shared sub", lei: null, country: "PL", rank: 2, providesCifService: false }],
      },
    ]);
    const shared = result.find((p) => p.key === "name:shared sub");
    expect(shared?.chains).toBe(2);
    expect(shared?.cifCount).toBe(2);
  });
});
