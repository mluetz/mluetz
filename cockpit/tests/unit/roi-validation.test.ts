import { describe, expect, it } from "vitest";
import {
  ROI_RULES,
  isPlausibleEuid,
  summarizeFindings,
  validateLeiStatus,
  validateRoi,
  type RoiRuleId,
} from "@/lib/domain/roi-validation";
import type { RoiInput } from "@/lib/domain/roi-build";
import { cleanRoiFixture } from "./helpers/roi-fixture";

/**
 * Bewusst fehlerhafter Testbestand (Abnahme Welle 2): jede Regel des
 * Katalogs erzeugt mindestens einen Befund. Aufgebaut als gezielte
 * Mutationen der sauberen Fixture.
 */
function faultyFixture(): RoiInput {
  const f = cleanRoiFixture();

  // RV-101: LEI mit falscher Prüfziffer; RV-403: Land fehlt
  f.entities[0]!.lei = "529900T8BM49AURSDO54";
  f.entities[0]!.country = null;
  // RV-103: EUID im falschen Format; RV-301: Elternbezug gebrochen
  f.entities[1]!.nationalId = "X";
  f.entities[1]!.nationalIdType = "EUID";
  f.entities[1]!.parentId = "re-missing";
  // RV-601: Unternehmensart außerhalb der Werteliste, ohne B_99.01-Definition
  f.entities[1]!.entityType = "SPARKASSENVERBUND";

  // RV-201 (Branch) + RV-202 (Duplikat) + RV-403 (Land)
  f.branches.push(
    { id: "br-x1", reportingEntityId: "re-bank", branchCode: "", name: null, country: "" },
    {
      id: "br-x2",
      reportingEntityId: "re-bank",
      branchCode: "5299009D9BIL4D4UHT93-AT01",
      name: "Duplikat",
      country: "AT",
    },
  );

  // RV-102: weder LEI noch nationale Kennung; RV-703: CTPP ohne Auditrechte
  f.thirdParties[1]!.lei = null;
  f.thirdParties[1]!.nationalId = null;
  f.thirdParties[1]!.nationalIdType = null;
  f.thirdParties[0]!.isCtpp = true;
  const iaas = f.contracts[0]!.ictServices[0]!;
  iaas.cifAssessment!.auditRightsInContract = false;
  // RV-702: CIF-Dienstleistung ohne Exit-Plan
  iaas.cifAssessment!.exitPlanExists = false;
  // RV-402: Begründung fehlt
  iaas.cifAssessment!.rationale = null;

  // RV-202: Vertrags-Referenz doppelt; RV-701: Rahmenvertrag existiert nicht
  f.contracts[1]!.contractRef = "CTR-2026-001";
  f.contracts[1]!.parentContractRef = "CTR-GIBT-ES-NICHT";

  // RV-201: Vertrag ohne Referenz und ohne Dienstleistung (RV-401);
  // RV-301: Dienstleisterbezug gebrochen; RV-403: Unterzeichner/Nutzer fehlen
  f.contracts.push({
    id: "c-broken",
    thirdPartyId: "tp-missing",
    contractRef: null,
    contractType: "STANDALONE",
    startDate: new Date("2026-01-01"),
    endDate: null,
    governingLaw: null,
    annualCostEur: null,
    parentContractRef: null,
    isIntragroup: false,
    terminationNoticeDaysEntity: null,
    terminationNoticeDaysProvider: null,
    countryOfProvision: null,
    countryOfDataStorage: null,
    countryOfDataProcessing: null,
    signingEntityId: null,
    usingEntityIds: [],
    ictServices: [],
  });

  // RV-401 (Speicher-/Verarbeitungsorte ohne Rückfall) + RV-601 (Sensibilität)
  // + RV-402 (CIF ohne Bewertung) + RV-301 (Funktionsbezug gebrochen)
  f.contracts[0]!.countryOfDataStorage = null;
  f.contracts[0]!.countryOfDataProcessing = null;
  f.contracts[0]!.ictServices.push({
    id: "cis-x",
    ictServiceType: "S02",
    dataStorageCountries: null,
    dataProcessingCountries: null,
    dataSensitivity: "GEHEIM",
    supportedFunctionIds: ["cf-1", "cf-missing"],
    cifAssessment: null,
  });

  // Kette: RV-501 (Wurzel mit Rang 3), RV-502 (Lücke), RV-503 (Zyklus),
  // RV-504 (fremder Vertrag)
  f.subcontractors.push(
    {
      id: "sc-root3",
      thirdPartyId: "tp-1",
      contractId: "c-1",
      parentId: null,
      rank: 3,
      name: "RootFalsch GmbH",
      lei: null,
      country: "DE",
      ictServiceType: "S07",
      providesCifService: false,
    },
    {
      id: "sc-gap",
      thirdPartyId: "tp-1",
      contractId: "c-1",
      parentId: "sc-1",
      rank: 4, // Vorgänger hat Rang 1 -> Lücke
      name: "LückenNetz AG",
      lei: null,
      country: "DE",
      ictServiceType: "S11",
      providesCifService: false,
    },
    {
      id: "sc-cyc-a",
      thirdPartyId: "tp-1",
      contractId: "c-1",
      parentId: "sc-cyc-b",
      rank: 2,
      name: "Zyklus A",
      lei: null,
      country: "DE",
      ictServiceType: "S11",
      providesCifService: false,
    },
    {
      id: "sc-cyc-b",
      thirdPartyId: "tp-1",
      contractId: "c-1",
      parentId: "sc-cyc-a",
      rank: 3,
      name: "Zyklus B",
      lei: null,
      country: "", // RV-403
      ictServiceType: "S11",
      providesCifService: false,
    },
    {
      id: "sc-foreign",
      thirdPartyId: "tp-parent",
      contractId: "c-1", // Vertrag gehört tp-1 -> RV-504
      parentId: null,
      rank: 1,
      name: "Fremdvertrag GmbH",
      lei: null,
      country: "GB",
      ictServiceType: "S15",
      providesCifService: false,
    },
  );

  // RV-201/RV-202: Funktionscode fehlt bzw. doppelt
  f.functions.push(
    {
      id: "cf-2",
      cfId: "CIF-02",
      functionIdCode: null,
      name: "Wertpapierabwicklung",
      isCritical: true,
      licensedActivity: null,
      discontinuationImpact: null, // RV-403
      criticalityRationale: null,
      rtoHours: null, // RV-403
      rpoHours: null,
    },
    {
      id: "cf-3",
      cfId: "CIF-03",
      functionIdCode: "F-001", // Duplikat zu cf-1
      name: "Kundenportal",
      isCritical: true,
      licensedActivity: null,
      discontinuationImpact: "Portalausfall",
      criticalityRationale: null,
      rtoHours: 8,
      rpoHours: 1,
    },
  );

  return f;
}

/**
 * Variante B: deckt die Prüfzweige ab, die in faultyFixture() nur in einer
 * Ausprägung vorkommen (gleiche Regel, anderes Objekt bzw. anderer Zweig).
 */
function faultyFixtureVariantB(): RoiInput {
  const f = cleanRoiFixture();
  // RV-301: Register führende Einheit fehlt im Erfassungskreis
  f.maintainerEntityId = "re-missing";
  // RV-102 (Einheit ohne jede Kennung) + RV-403 (Unternehmensart fehlt)
  f.entities[0]!.lei = null;
  f.entities[0]!.nationalId = null;
  f.entities[0]!.nationalIdType = null;
  f.entities[0]!.entityType = null;
  // RV-202: LEI mehrfach unter den Einheiten
  f.entities.push({
    ...f.entities[1]!,
    id: "re-dup",
    name: "Nordlicht Doppel AG",
  });
  // RV-301: Zweigniederlassung mit gebrochenem Entitätsbezug
  f.branches[0]!.reportingEntityId = "re-missing";
  // RV-201/RV-101/RV-301 am Dienstleister: Kennung fehlt, LEI ungültig,
  // Muttergesellschaft gebrochen
  f.thirdParties[0]!.tpId = "";
  f.thirdParties[0]!.lei = "529900GGYMNGRQTDOO94";
  f.thirdParties[0]!.ultimateParentId = "tp-missing";
  // RV-103 (EUID am Dienstleister) + RV-403 (Sitzland fehlt)
  f.thirdParties[1]!.lei = null;
  f.thirdParties[1]!.nationalId = "Z";
  f.thirdParties[1]!.nationalIdType = "EUID";
  f.thirdParties[1]!.registeredCountry = "";
  // RV-202: Dienstleister-Kennung doppelt
  f.thirdParties.push({ ...f.thirdParties[1]!, id: "tp-dup", tpId: "TP-090" });
  // RV-301: Unterzeichner/Nutzer außerhalb des Erfassungskreises
  f.contracts[0]!.signingEntityId = "re-missing";
  f.contracts[0]!.usingEntityIds = ["re-missing"];
  // RV-401: Dienstleistungsart fehlt
  f.contracts[0]!.ictServices[1]!.ictServiceType = "";
  // RV-202: Dienstleistungsart im Vertrag doppelt
  f.contracts[1]!.ictServices.push({
    ...f.contracts[1]!.ictServices[0]!,
    id: "cis-dup",
  });
  // RV-301: Kettenglied mit gebrochenem Vorgänger- und Vertragsbezug
  f.subcontractors[0]!.parentId = "sc-missing";
  f.subcontractors[0]!.contractId = "c-missing";
  return f;
}

describe("RoI-Validierungsengine (Meldeschicht Welle 2, ADR-0006)", () => {
  it("Variante B: gleiche Regeln greifen auch an den übrigen Objektarten", () => {
    const findings = validateRoi(faultyFixtureVariantB());
    const by = (rule: string, field: string) =>
      findings.some((f) => f.ruleId === rule && f.field === field);
    expect(by("RV-301", "entity")).toBe(true); // Maintainer
    expect(by("RV-102", "entity.lei")).toBe(true);
    expect(by("RV-403", "entity.entityType")).toBe(true);
    expect(by("RV-202", "entity.lei")).toBe(true);
    expect(by("RV-301", "branch.entity")).toBe(true);
    expect(by("RV-201", "tp.tpId")).toBe(true);
    expect(by("RV-202", "tp.tpId")).toBe(true);
    expect(by("RV-101", "tp.lei")).toBe(true);
    expect(by("RV-103", "tp.nationalId")).toBe(true);
    expect(by("RV-403", "tp.country")).toBe(true);
    expect(by("RV-301", "tp.ultimateParent")).toBe(true);
    expect(by("RV-301", "contract.signingEntity")).toBe(true);
    expect(by("RV-301", "contract.usingEntities")).toBe(true);
    expect(by("RV-401", "service.ictServiceType")).toBe(true);
    expect(by("RV-202", "service.ictServiceType")).toBe(true);
    expect(by("RV-301", "chain.parent")).toBe(true);
    expect(by("RV-301", "chain.contract")).toBe(true);
  });

  it("sauberer Bestand: null Befunde, insbesondere keine REJECT-Stufe (Abnahme)", () => {
    const findings = validateRoi(cleanRoiFixture());
    expect(findings.filter((f) => f.severity === "REJECT")).toHaveLength(0);
    expect(findings).toHaveLength(0);
  });

  it("fehlerhafter Bestand: jede Regel erzeugt mindestens einen Befund (Abnahme)", () => {
    const findings = validateRoi(faultyFixture());
    const hit = new Set(findings.map((f) => f.ruleId));
    for (const ruleId of Object.keys(ROI_RULES) as RoiRuleId[]) {
      expect(hit.has(ruleId), `Regel ${ruleId} (${ROI_RULES[ruleId]}) ohne Befund`).toBe(true);
    }
  });

  it("jeder Befund trägt Regel-ID, Schweregrad, Meldebogen, Datensatz, Feld und Klartext DE/EN", () => {
    for (const f of validateRoi(faultyFixture())) {
      expect(f.ruleId in ROI_RULES).toBe(true);
      expect(["REJECT", "ERROR", "WARNING"]).toContain(f.severity);
      expect(f.template).toMatch(/^B_\d\d\.\d\d$/);
      expect(f.recordId.length).toBeGreaterThan(0);
      expect(f.recordRef.length).toBeGreaterThan(0);
      expect(f.field.length).toBeGreaterThan(0);
      expect(f.messageDe.length).toBeGreaterThan(10);
      expect(f.messageEn.length).toBeGreaterThan(10);
    }
  });

  it("Schweregrade: Schlüssel/Duplikate/Referenzen/Zyklen sind REJECT, Plausibilität WARNING", () => {
    const findings = validateRoi(faultyFixture());
    const sevByRule = new Map(findings.map((f) => [f.ruleId, f.severity]));
    for (const r of ["RV-201", "RV-202", "RV-301", "RV-503"]) {
      expect(sevByRule.get(r), r).toBe("REJECT");
    }
    for (const r of ["RV-701"]) expect(sevByRule.get(r), r).toBe("ERROR");
    for (const r of ["RV-702", "RV-703"]) expect(sevByRule.get(r), r).toBe("WARNING");
  });

  it("B_99.01-Ausnahme: eigener Code mit hinterlegter Definition erzeugt keinen Wertelistenbefund", () => {
    const f = cleanRoiFixture();
    f.thirdParties[0]!.providerType = "EIGENER_CODE";
    const before = validateRoi(f).filter((x) => x.ruleId === "RV-601");
    expect(before).toHaveLength(1);
    f.definitions.push({
      field: "tp.providerType=EIGENER_CODE",
      definition: "Hausinterne Rolle, Definition für B_99.01",
    });
    const after = validateRoi(f).filter((x) => x.ruleId === "RV-601");
    expect(after).toHaveLength(0);
  });

  it("summarizeFindings zählt je Schweregrad und Regel", () => {
    const s = summarizeFindings(validateRoi(faultyFixture()));
    expect(s.total).toBe(s.reject + s.error + s.warning);
    expect(s.reject).toBeGreaterThan(0);
    expect(s.byRule["RV-202"]).toBeGreaterThanOrEqual(2); // Vertrags- und Funktionsduplikate
    expect(summarizeFindings([])).toEqual({
      total: 0,
      reject: 0,
      error: 0,
      warning: 0,
      byRule: {},
    });
  });

  it("EUID-Formatprüfung ist bewusst tolerant, weist aber Unplausibles zurück", () => {
    expect(isPlausibleEuid("DEHRB.123456")).toBe(true);
    expect(isPlausibleEuid("FRRCS123456789")).toBe(true);
    expect(isPlausibleEuid("X")).toBe(false);
    expect(isPlausibleEuid("12ABC.DEF")).toBe(false);
  });

  it("GLEIF-Schnittstelle: abschaltbar, LAPSED-Status wird Warnung, Fehler werden geschluckt", async () => {
    const clean = cleanRoiFixture();
    const lapsed = await validateLeiStatus(clean, { getStatus: async () => "LAPSED" });
    expect(lapsed.length).toBeGreaterThan(0);
    expect(lapsed.every((f) => f.severity === "WARNING")).toBe(true);
    const issued = await validateLeiStatus(clean, { getStatus: async () => "ISSUED" });
    expect(issued).toHaveLength(0);
    const failing = await validateLeiStatus(clean, {
      getStatus: async () => {
        throw new Error("offline");
      },
    });
    expect(failing).toHaveLength(0); // Synology-Betrieb ist nicht zwingend online
  });
});
