/**
 * Zusammenstellung des DORA-Informationsregisters (Meldeschicht Welle 1,
 * ADR-0005): reine Funktionen ohne DB-Zugriff, die aus einem typisierten
 * Datenabzug die Datensätze der 15 Meldebögen (Anhang I der DVO (EU)
 * 2024/2956) erzeugen.
 *
 * Die Feldnamen der Ergebnisse sind KANONISCHE Cockpit-Feldnamen, keine
 * ITS-Feld-IDs — das Mapping auf die Meldebogen-Spalten einer konkreten
 * ITS-Fassung bleibt Datenpflege (ItsFieldMapping, Review v3 B-1).
 * Grundlage für Validierung (Welle 2) und xBRL-CSV-Export (Welle 3).
 *
 * TODO(verify): Die Zeilensemantik je Meldebogen ist gegen die
 * Meldebogen-Titel und Ausfüllhinweise der DVO (EU) 2024/2956 verifiziert
 * worden, soweit im Kommentar angegeben; offene Punkte sind markiert.
 */

import type { RoiTemplateId } from "@/lib/content/roi-taxonomies";

// ---------- Eingabetypen (Datenabzug, DB-frei) ----------

export interface RoiEntity {
  id: string;
  name: string;
  lei: string | null;
  nationalId: string | null;
  nationalIdType: string | null;
  consolidationLevel: string; // SOLO | PARTIAL_CONSOLIDATED | CONSOLIDATED
  parentId: string | null;
  country: string | null;
  entityType: string | null;
  hierarchyRole: string | null;
  competentAuthority: string | null;
  totalAssetsEur: number | null;
  lastUpdateAt: Date | null;
}

export interface RoiBranch {
  id: string;
  reportingEntityId: string;
  branchCode: string;
  name: string | null;
  country: string;
}

export interface RoiThirdParty {
  id: string;
  tpId: string;
  name: string;
  lei: string | null;
  nationalId: string | null;
  nationalIdType: string | null;
  registeredCountry: string; // zugleich Sitzland (ADR-0005 Nr. 3)
  providerType: string;
  ultimateParentId: string | null;
  isCtpp: boolean;
}

export interface RoiCifServiceAssessment {
  substitutability: string;
  rationale: string | null;
  reintegrationTimeDays: number | null;
  exitPlanExists: boolean;
  alternativeProviders: string | null;
  lastAuditDate: Date | null;
  auditRightsInContract: boolean;
}

export interface RoiContractIctService {
  id: string;
  ictServiceType: string;
  dataStorageCountries: string | null;
  dataProcessingCountries: string | null;
  dataSensitivity: string;
  supportedFunctionIds: string[];
  cifAssessment: RoiCifServiceAssessment | null;
}

export interface RoiContract {
  id: string;
  thirdPartyId: string;
  contractRef: string | null;
  contractType: string | null;
  startDate: Date;
  endDate: Date | null;
  governingLaw: string | null;
  annualCostEur: number | null;
  parentContractRef: string | null;
  isIntragroup: boolean;
  terminationNoticeDaysEntity: number | null;
  terminationNoticeDaysProvider: number | null;
  countryOfProvision: string | null;
  countryOfDataStorage: string | null;
  countryOfDataProcessing: string | null;
  signingEntityId: string | null;
  usingEntityIds: string[];
  ictServices: RoiContractIctService[];
}

export interface RoiSubcontractorLink {
  id: string;
  thirdPartyId: string; // direkter Dienstleister, an dem die Kette hängt
  contractId: string | null;
  parentId: string | null;
  rank: number;
  name: string;
  lei: string | null;
  country: string;
  ictServiceType: string | null;
  providesCifService: boolean;
}

export interface RoiFunction {
  id: string;
  cfId: string;
  functionIdCode: string | null;
  name: string;
  isCritical: boolean;
  licensedActivity: string | null;
  discontinuationImpact: string | null;
  criticalityRationale: string | null;
  rtoHours: number | null;
  rpoHours: number | null;
}

/** Entitätsspezifische Definition (B_99.01), z. B. abweichende Wertelisten. */
export interface RoiDefinition {
  field: string;
  definition: string;
}

export interface RoiInput {
  /** Register führende Einheit (B_01.01) — muss in entities enthalten sein. */
  maintainerEntityId: string;
  entities: RoiEntity[];
  branches: RoiBranch[];
  thirdParties: RoiThirdParty[];
  contracts: RoiContract[];
  subcontractors: RoiSubcontractorLink[];
  functions: RoiFunction[];
  definitions: RoiDefinition[];
}

export type RoiRow = Record<string, unknown>;
export type RoiRegister = Record<RoiTemplateId, RoiRow[]>;

// ---------- Hilfsfunktionen ----------

const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((i) => [i.id, i]));

function entityKeys(e: RoiEntity) {
  return {
    "entity.lei": e.lei,
    "entity.nationalId": e.nationalId,
    "entity.nationalIdType": e.nationalIdType,
    "entity.name": e.name,
    "entity.country": e.country,
  };
}

function providerKeys(tp: RoiThirdParty) {
  return {
    "tp.tpId": tp.tpId,
    "tp.lei": tp.lei,
    "tp.nationalId": tp.nationalId,
    "tp.nationalIdType": tp.nationalIdType,
    "tp.name": tp.name,
    "tp.country": tp.registeredCountry,
  };
}

// ---------- Registeraufbau ----------

/**
 * Baut alle 15 Meldebögen aus dem Datenabzug. Wirft nicht bei fachlichen
 * Lücken (fehlende LEI usw.) — das ist Aufgabe der Validierung (Welle 2);
 * fehlende Bezüge werden als `null` ausgegeben.
 */
export function buildRoiRegister(input: RoiInput): RoiRegister {
  const entities = byId(input.entities);
  const tps = byId(input.thirdParties);
  const fns = byId(input.functions);
  const maintainer = entities.get(input.maintainerEntityId) ?? null;

  // B_01.01 — Register führende Einheit
  const b0101: RoiRow[] = maintainer
    ? [
        {
          ...entityKeys(maintainer),
          "entity.entityType": maintainer.entityType,
          "entity.competentAuthority": maintainer.competentAuthority,
          "entity.consolidationLevel": maintainer.consolidationLevel,
          "entity.lastUpdateAt": maintainer.lastUpdateAt,
        },
      ]
    : [];

  // B_01.02 — alle Einheiten im Erfassungskreis des Registers
  const b0102: RoiRow[] = input.entities.map((e) => ({
    ...entityKeys(e),
    "entity.entityType": e.entityType,
    "entity.hierarchyRole": e.hierarchyRole,
    "entity.parentLei": (e.parentId && entities.get(e.parentId)?.lei) || null,
    "entity.totalAssetsEur": e.totalAssetsEur,
    "entity.lastUpdateAt": e.lastUpdateAt,
  }));

  // B_01.03 — Zweigniederlassungen
  const b0103: RoiRow[] = input.branches.map((b) => {
    const head = entities.get(b.reportingEntityId);
    return {
      "branch.code": b.branchCode,
      "branch.name": b.name,
      "branch.country": b.country,
      "entity.lei": head?.lei ?? null,
      "entity.name": head?.name ?? null,
    };
  });

  // B_02.01 — vertragliche Vereinbarungen, allgemeine Angaben
  const b0201: RoiRow[] = input.contracts.map((c) => ({
    "contract.ref": c.contractRef,
    "contract.type": c.contractType,
    "contract.parentRef": c.parentContractRef,
    "contract.annualCostEur": c.annualCostEur,
    "tp.tpId": tps.get(c.thirdPartyId)?.tpId ?? null,
  }));

  // B_02.02 — vertragliche Vereinbarungen, spezifische Angaben:
  // eine Zeile je Vertrag × IKT-Dienstleistung (Kernobjekt).
  const b0202: RoiRow[] = input.contracts.flatMap((c) => {
    const tp = tps.get(c.thirdPartyId) ?? null;
    return c.ictServices.map((s) => ({
      "contract.ref": c.contractRef,
      "service.ictServiceType": s.ictServiceType,
      "tp.tpId": tp?.tpId ?? null,
      "tp.lei": tp?.lei ?? null,
      "contract.startDate": c.startDate,
      "contract.endDate": c.endDate,
      "contract.governingLaw": c.governingLaw,
      "contract.terminationNoticeDaysEntity": c.terminationNoticeDaysEntity,
      "contract.terminationNoticeDaysProvider": c.terminationNoticeDaysProvider,
      "contract.countryOfProvision": c.countryOfProvision,
      "service.dataStorageCountries": s.dataStorageCountries ?? c.countryOfDataStorage,
      "service.dataProcessingCountries": s.dataProcessingCountries ?? c.countryOfDataProcessing,
      "service.dataSensitivity": s.dataSensitivity,
      "service.supportsCif": s.supportedFunctionIds.some((id) => fns.get(id)?.isCritical),
    }));
  });

  // B_02.03 — gruppeninterne vertragliche Vereinbarungen
  const b0203: RoiRow[] = input.contracts
    .filter((c) => c.isIntragroup)
    .map((c) => ({
      "contract.ref": c.contractRef,
      "contract.parentRef": c.parentContractRef,
      "tp.tpId": tps.get(c.thirdPartyId)?.tpId ?? null,
    }));

  // B_03.01 — Einheiten, die die Vereinbarung unterzeichnen (Empfangsseite)
  const b0301: RoiRow[] = input.contracts
    .filter((c) => c.signingEntityId)
    .map((c) => ({
      "contract.ref": c.contractRef,
      ...entityKeys(entities.get(c.signingEntityId!)!),
    }));

  // B_03.02 — unterzeichnende IKT-Drittdienstleister
  const b0302: RoiRow[] = input.contracts.map((c) => {
    const tp = tps.get(c.thirdPartyId) ?? null;
    return {
      "contract.ref": c.contractRef,
      ...(tp ? providerKeys(tp) : { "tp.tpId": null, "tp.name": null }),
    };
  });

  // B_03.03 — Einheiten, die als gruppeninterner Erbringer unterzeichnen.
  // TODO(verify): Zeilensemantik gegen die Ausfüllhinweise prüfen; hier:
  // unterzeichnende Einheit gruppeninterner Vereinbarungen.
  const b0303: RoiRow[] = input.contracts
    .filter((c) => c.isIntragroup && c.signingEntityId)
    .map((c) => ({
      "contract.ref": c.contractRef,
      ...entityKeys(entities.get(c.signingEntityId!)!),
    }));

  // B_04.01 — Einheiten, die die IKT-Dienstleistungen nutzen
  const b0401: RoiRow[] = input.contracts.flatMap((c) =>
    c.usingEntityIds
      .map((id) => entities.get(id))
      .filter((e): e is RoiEntity => Boolean(e))
      .map((e) => ({
        "contract.ref": c.contractRef,
        ...entityKeys(e),
      })),
  );

  // B_05.01 — IKT-Drittdienstleister (inkl. oberster Muttergesellschaften)
  const b0501: RoiRow[] = input.thirdParties.map((tp) => ({
    ...providerKeys(tp),
    "tp.providerType": tp.providerType,
    "tp.isCtpp": tp.isCtpp,
    "tp.ultimateParentLei": (tp.ultimateParentId && tps.get(tp.ultimateParentId)?.lei) || null,
  }));

  // B_05.02 — IKT-Lieferketten: Rang 1 = direkter Dienstleister je
  // Vertrag/Dienstleistung, Folgeränge aus der Subunternehmerkette.
  const rank1: RoiRow[] = input.contracts.flatMap((c) => {
    const tp = tps.get(c.thirdPartyId) ?? null;
    return c.ictServices.map((s) => ({
      "contract.ref": c.contractRef,
      "service.ictServiceType": s.ictServiceType,
      "chain.rank": 1,
      "chain.name": tp?.name ?? null,
      "chain.lei": tp?.lei ?? null,
      "chain.country": tp?.registeredCountry ?? null,
    }));
  });
  const contractsById = byId(input.contracts);
  const followUp: RoiRow[] = input.subcontractors.map((s) => {
    const c = s.contractId ? (contractsById.get(s.contractId) ?? null) : null;
    return {
      "contract.ref": c?.contractRef ?? null,
      "service.ictServiceType": s.ictServiceType,
      "chain.rank": s.rank,
      "chain.name": s.name,
      "chain.lei": s.lei,
      "chain.country": s.country,
      "chain.providesCifService": s.providesCifService,
    };
  });
  const b0502: RoiRow[] = [...rank1, ...followUp];

  // B_06.01 — Identifikation der Funktionen
  const b0601: RoiRow[] = input.functions.map((f) => ({
    "function.idCode": f.functionIdCode,
    "function.cfId": f.cfId,
    "function.name": f.name,
    "function.isCritical": f.isCritical,
    "function.licensedActivity": f.licensedActivity,
    "function.discontinuationImpact": f.discontinuationImpact,
    "function.criticalityRationale": f.criticalityRationale,
    "function.rtoHours": f.rtoHours,
    "function.rpoHours": f.rpoHours,
  }));

  // B_07.01 — Bewertung der IKT-Dienstleistungen (CIF-gestützt)
  const b0701: RoiRow[] = input.contracts.flatMap((c) =>
    c.ictServices
      .filter((s) => s.cifAssessment)
      .map((s) => ({
        "contract.ref": c.contractRef,
        "service.ictServiceType": s.ictServiceType,
        "assessment.substitutability": s.cifAssessment!.substitutability,
        "assessment.rationale": s.cifAssessment!.rationale,
        "assessment.reintegrationTimeDays": s.cifAssessment!.reintegrationTimeDays,
        "assessment.exitPlanExists": s.cifAssessment!.exitPlanExists,
        "assessment.alternativeProviders": s.cifAssessment!.alternativeProviders,
        "assessment.lastAuditDate": s.cifAssessment!.lastAuditDate,
        "assessment.auditRightsInContract": s.cifAssessment!.auditRightsInContract,
      })),
  );

  // B_99.01 — entitätsspezifische Definitionen
  const b9901: RoiRow[] = input.definitions.map((d) => ({
    "definition.field": d.field,
    "definition.text": d.definition,
  }));

  return {
    "B_01.01": b0101,
    "B_01.02": b0102,
    "B_01.03": b0103,
    "B_02.01": b0201,
    "B_02.02": b0202,
    "B_02.03": b0203,
    "B_03.01": b0301,
    "B_03.02": b0302,
    "B_03.03": b0303,
    "B_04.01": b0401,
    "B_05.01": b0501,
    "B_05.02": b0502,
    "B_06.01": b0601,
    "B_07.01": b0701,
    "B_99.01": b9901,
  };
}
