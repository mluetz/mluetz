import "server-only";
import { db } from "@/lib/db";
import type { RoiInput } from "@/lib/domain/roi-build";
import type { RoiFinding } from "@/lib/domain/roi-validation";

/**
 * Datenabzug für Registeraufbau und Validierung (Meldeschicht Welle 2,
 * ADR-0006): stellt den RoiInput aus dem Datenbestand zusammen und liefert
 * je Datensatz-ID den Sprunglink zum betroffenen Objekt.
 *
 * Register führende Einheit: AppSetting `roi.maintainerEntityId`, sonst die
 * erste Einheit ohne übergeordnete Einheit. Entitätsspezifische Definitionen
 * (B_99.01): AppSetting `roi.definitions` (JSON-Array aus {field, definition}).
 */
export async function loadRoiInput(): Promise<{
  input: RoiInput;
  links: Map<string, string | null>;
}> {
  const [entities, branches, tps, contracts, subs, functions, defSetting, maintainerSetting] =
    await Promise.all([
      db.reportingEntity.findMany({ orderBy: { name: "asc" } }),
      db.entityBranch.findMany(),
      db.thirdParty.findMany({ orderBy: { tpId: "asc" } }),
      db.contract.findMany({
        include: {
          usingEntities: { select: { id: true } },
          ictServices: {
            include: {
              supportedFunctions: { select: { id: true } },
              cifAssessment: true,
            },
          },
        },
      }),
      db.subcontractor.findMany(),
      db.criticalFunction.findMany({ orderBy: { cfId: "asc" } }),
      db.appSetting.findUnique({ where: { key: "roi.definitions" } }),
      db.appSetting.findUnique({ where: { key: "roi.maintainerEntityId" } }),
    ]);

  let definitions: RoiInput["definitions"] = [];
  if (defSetting) {
    try {
      const parsed: unknown = JSON.parse(defSetting.value);
      if (Array.isArray(parsed)) {
        definitions = parsed.filter(
          (d): d is { field: string; definition: string } =>
            typeof d === "object" &&
            d !== null &&
            typeof (d as { field?: unknown }).field === "string" &&
            typeof (d as { definition?: unknown }).definition === "string",
        );
      }
    } catch {
      // fehlerhaftes JSON: keine Definitionen -> Wertelistenbefunde bleiben sichtbar
    }
  }

  const maintainerEntityId =
    maintainerSetting?.value ??
    entities.find((e) => e.parentId === null)?.id ??
    entities[0]?.id ??
    "";

  const input: RoiInput = {
    maintainerEntityId,
    entities: entities.map((e) => ({
      id: e.id,
      name: e.name,
      lei: e.lei,
      nationalId: e.nationalId,
      nationalIdType: e.nationalIdType,
      consolidationLevel: e.consolidationLevel,
      parentId: e.parentId,
      country: e.country,
      entityType: e.entityType,
      hierarchyRole: e.hierarchyRole,
      competentAuthority: e.competentAuthority,
      totalAssetsEur: e.totalAssetsEur,
      lastUpdateAt: e.lastUpdateAt,
    })),
    branches: branches.map((b) => ({
      id: b.id,
      reportingEntityId: b.reportingEntityId,
      branchCode: b.branchCode,
      name: b.name,
      country: b.country,
    })),
    thirdParties: tps.map((tp) => ({
      id: tp.id,
      tpId: tp.tpId,
      name: tp.name,
      lei: tp.lei,
      nationalId: tp.nationalId,
      nationalIdType: tp.nationalIdType,
      registeredCountry: tp.registeredCountry,
      providerType: tp.providerType,
      ultimateParentId: tp.ultimateParentId,
      isCtpp: tp.isCtpp,
    })),
    contracts: contracts.map((c) => ({
      id: c.id,
      thirdPartyId: c.thirdPartyId,
      contractRef: c.contractRef,
      contractType: c.contractType,
      startDate: c.startDate,
      endDate: c.endDate,
      governingLaw: c.governingLaw,
      annualCostEur: c.annualCostEur,
      parentContractRef: c.parentContractRef,
      isIntragroup: c.isIntragroup,
      terminationNoticeDaysEntity: c.terminationNoticeDaysEntity,
      terminationNoticeDaysProvider: c.terminationNoticeDaysProvider,
      countryOfProvision: c.countryOfProvision,
      countryOfDataStorage: c.countryOfDataStorage,
      countryOfDataProcessing: c.countryOfDataProcessing,
      signingEntityId: c.signingEntityId,
      usingEntityIds: c.usingEntities.map((u) => u.id),
      ictServices: c.ictServices.map((s) => ({
        id: s.id,
        ictServiceType: s.ictServiceType,
        dataStorageCountries: s.dataStorageCountries,
        dataProcessingCountries: s.dataProcessingCountries,
        dataSensitivity: s.dataSensitivity,
        supportedFunctionIds: s.supportedFunctions.map((f) => f.id),
        cifAssessment: s.cifAssessment
          ? {
              substitutability: s.cifAssessment.substitutability,
              rationale: s.cifAssessment.rationale,
              reintegrationTimeDays: s.cifAssessment.reintegrationTimeDays,
              exitPlanExists: s.cifAssessment.exitPlanExists,
              alternativeProviders: s.cifAssessment.alternativeProviders,
              lastAuditDate: s.cifAssessment.lastAuditDate,
              auditRightsInContract: s.cifAssessment.auditRightsInContract,
            }
          : null,
      })),
    })),
    subcontractors: subs.map((s) => ({
      id: s.id,
      thirdPartyId: s.thirdPartyId,
      contractId: s.contractId,
      parentId: s.parentId,
      rank: s.rank,
      name: s.name,
      lei: s.lei,
      country: s.country,
      ictServiceType: s.ictServiceType,
      providesCifService: s.providesCifService,
    })),
    functions: functions.map((f) => ({
      id: f.id,
      cfId: f.cfId,
      functionIdCode: f.functionIdCode,
      name: f.name,
      isCritical: f.isCritical,
      licensedActivity: f.licensedActivity,
      discontinuationImpact: f.discontinuationImpact,
      criticalityRationale: f.criticalityRationale,
      rtoHours: f.rtoHours,
      rpoHours: f.rpoHours,
    })),
    definitions,
  };

  // Sprunglinks je Datensatz-ID (RoiFinding.recordId -> Ziel-URL).
  const links = new Map<string, string | null>();
  for (const e of input.entities) links.set(e.id, null); // keine Detailseite
  for (const b of input.branches) links.set(b.id, null);
  for (const tp of input.thirdParties) links.set(tp.id, `/third-parties/${tp.id}`);
  for (const c of input.contracts) {
    links.set(c.id, `/third-parties/${c.thirdPartyId}`);
    for (const s of c.ictServices) links.set(s.id, `/third-parties/${c.thirdPartyId}`);
  }
  for (const s of input.subcontractors) links.set(s.id, `/third-parties/${s.thirdPartyId}`);
  for (const f of input.functions) links.set(f.id, `/cif`);

  return { input, links };
}

/** Zielseite eines Befunds (null = kein Sprungziel vorhanden). */
export function findingHref(finding: RoiFinding, links: Map<string, string | null>): string | null {
  return links.get(finding.recordId) ?? null;
}
