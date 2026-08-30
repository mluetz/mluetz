import { describe, expect, it } from "vitest";
import {
  ART30_CLAUSES,
  art30GapReport,
  deriveContractFlags,
  requiredClausesFor,
  type ClauseStatus,
  type GapContractInput,
} from "@/lib/domain/art30";

const allFulfilled = (cif: boolean): Map<string, ClauseStatus> =>
  new Map(requiredClausesFor(cif).map((c) => [c.key, "FULFILLED" as ClauseStatus]));

function contractInput(overrides: Partial<GapContractInput>): GapContractInput {
  return {
    contractId: "c-1",
    contractRef: "CTR-1",
    title: "Vertrag 1",
    thirdPartyId: "tp-1",
    tpId: "TP-001",
    isCif: true,
    statuses: allFulfilled(true),
    ...overrides,
  };
}

describe("Abgeleitete Vertragskennzeichen (Welle 4, ADR-0008 Nr. 6)", () => {
  it("leitet Audit-/Zugangs-/Meldekennzeichen aus den zugeordneten Klauseln ab", () => {
    const statuses = allFulfilled(true);
    expect(deriveContractFlags(statuses)).toEqual({
      auditRights: true,
      accessRights: true,
      incidentReporting: true,
    });
    statuses.set("ART30_3_E", "MISSING");
    statuses.set("ART30_2_F", "PARTIAL"); // PARTIAL zählt nicht als erfüllt
    expect(deriveContractFlags(statuses)).toEqual({
      auditRights: false,
      accessRights: true,
      incidentReporting: false,
    });
    // Ohne jede Bewertung: alles false
    expect(deriveContractFlags(new Map())).toEqual({
      auditRights: false,
      accessRights: false,
      incidentReporting: false,
    });
  });
});

describe("Art.-30-Lückenbericht (Welle 4, ADR-0008 Nr. 5)", () => {
  it("meldet je Vertrag fehlende und teilweise Pflichtklauseln mit RAG", () => {
    const statuses = allFulfilled(true);
    statuses.set("ART30_3_D", "MISSING");
    statuses.set("ART30_2_H", "PARTIAL");
    const report = art30GapReport([contractInput({ statuses })]);
    const c = report.perContract[0]!;
    expect(c.rag).toBe("RED");
    expect(c.gaps.map((g) => g.clauseKey).sort()).toEqual(["ART30_2_H", "ART30_3_D"]);
  });

  it("nicht bewertete Pflichtklauseln gelten als MISSING; Nicht-CIF ignoriert Abs. 3", () => {
    const onlyAbs2 = new Map<string, ClauseStatus>(
      requiredClausesFor(false).map((c) => [c.key, "FULFILLED" as ClauseStatus]),
    );
    const nonCif = art30GapReport([contractInput({ isCif: false, statuses: onlyAbs2 })]);
    expect(nonCif.perContract[0]!.gaps).toHaveLength(0);
    expect(nonCif.perContract[0]!.rag).toBe("GREEN");
    // dieselben Status bei CIF: alle Abs.-3-Klauseln fehlen
    const cif = art30GapReport([contractInput({ statuses: onlyAbs2 })]);
    expect(cif.perContract[0]!.gaps.length).toBe(ART30_CLAUSES.filter((c) => c.cifOnly).length);
  });

  it("aggregiert nur CIF-gestützte Verträge und sortiert nach Lückenzahl", () => {
    const missingE = allFulfilled(true);
    missingE.set("ART30_3_E", "MISSING");
    const missingE2 = allFulfilled(true);
    missingE2.set("ART30_3_E", "MISSING");
    missingE2.set("ART30_2_H", "PARTIAL");
    const nonCifGap = new Map<string, ClauseStatus>(); // alles offen, aber kein CIF
    const report = art30GapReport([
      contractInput({ contractId: "c-1", contractRef: "CTR-1", statuses: missingE }),
      contractInput({ contractId: "c-2", contractRef: "CTR-2", statuses: missingE2 }),
      contractInput({
        contractId: "c-3",
        contractRef: "CTR-3",
        isCif: false,
        statuses: nonCifGap,
      }),
    ]);
    const agg = report.aggregatedCif;
    expect(agg[0]!.clauseKey).toBe("ART30_3_E");
    expect(agg[0]!.missing).toBe(2);
    expect(agg[0]!.contractRefs).toEqual(["CTR-1", "CTR-2"]);
    // Nicht-CIF-Vertrag c-3 taucht in der Aggregation nicht auf
    expect(agg.flatMap((g) => g.contractRefs)).not.toContain("CTR-3");
    const partialH = agg.find((g) => g.clauseKey === "ART30_2_H")!;
    expect(partialH.partial).toBe(1);
  });

  it("trägt verknüpfte Maßnahmen an den Lücken", () => {
    const statuses = allFulfilled(true);
    statuses.set("ART30_3_F", "MISSING");
    const report = art30GapReport([
      contractInput({
        statuses,
        linkedActions: new Map([["ART30_3_F", "act-42"]]),
      }),
    ]);
    expect(report.perContract[0]!.gaps[0]!.linkedActionId).toBe("act-42");
  });

  it("Katalog: Abs. 2 lit. i ist enthalten (Auftrag Welle 4)", () => {
    expect(ART30_CLAUSES.some((c) => c.key === "ART30_2_I" && !c.cifOnly)).toBe(true);
  });
});
