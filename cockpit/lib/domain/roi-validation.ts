/**
 * Validierungsengine für das DORA-Informationsregister (Meldeschicht Welle 2,
 * ADR-0006): reine, synchrone Funktionen über dem RoiInput aus roi-build.ts.
 *
 * Jeder Befund trägt Regel-ID, Schweregrad (REJECT | ERROR | WARNING),
 * Meldebogen, Datensatzart und -ID, fachliche Referenz, Feldname und einen
 * handlungsleitenden Klartext (DE/EN). Aufsichtliche Entsprechungen der
 * ESA-Datenqualitätsprüfungen sind als Kommentar vermerkt (Entsprechung
 * 805/806/807), ohne amtliche Regel-IDs auszugeben.
 *
 * Schweregrade (ADR-0006 Nr. 2):
 *   REJECT  – fehlende/duplizierte Schlüssel, gebrochene Referenzen, Zyklen;
 *             blockiert den Export (Welle 3).
 *   ERROR   – fehlende Pflichtfelder, ungültige Formate/Wertelisten.
 *   WARNING – Plausibilität über die Formalregeln hinaus.
 */

import { isValidLei } from "@/lib/domain/lei";
import {
  CONTRACT_TYPES,
  DATA_SENSITIVITY,
  ENTITY_TYPES,
  ICT_SERVICE_TYPES,
  PROVIDER_TYPES,
  ROI_SUBSTITUTABILITY,
  isTaxonomyCode,
  type RoiTemplateId,
  type TaxonomyEntry,
} from "@/lib/content/roi-taxonomies";
import type { RoiInput, RoiSubcontractorLink } from "@/lib/domain/roi-build";

export type RoiSeverity = "REJECT" | "ERROR" | "WARNING";

/** Datensatzart des betroffenen Objekts – Grundlage für den Sprunglink. */
export type RoiRecordKind =
  "ENTITY" | "BRANCH" | "PROVIDER" | "CONTRACT" | "SERVICE" | "CHAIN" | "FUNCTION";

export interface RoiFinding {
  ruleId: string;
  severity: RoiSeverity;
  template: RoiTemplateId;
  kind: RoiRecordKind;
  /** DB-ID des betroffenen Datensatzes (Sprungziel). */
  recordId: string;
  /** Fachliche Referenz für die Anzeige (tpId, contractRef, cfId, …). */
  recordRef: string;
  field: string;
  messageDe: string;
  messageEn: string;
}

export interface RoiValidationSummary {
  total: number;
  reject: number;
  error: number;
  warning: number;
  byRule: Record<string, number>;
}

export function summarizeFindings(findings: RoiFinding[]): RoiValidationSummary {
  const byRule: Record<string, number> = {};
  let reject = 0;
  let error = 0;
  let warning = 0;
  for (const f of findings) {
    byRule[f.ruleId] = (byRule[f.ruleId] ?? 0) + 1;
    if (f.severity === "REJECT") reject += 1;
    else if (f.severity === "ERROR") error += 1;
    else warning += 1;
  }
  return { total: findings.length, reject, error, warning, byRule };
}

// ---------- Regelkatalog ----------

/**
 * Alle Regel-IDs der Engine. Testabnahme (Welle 2): ein bewusst fehlerhafter
 * Bestand erzeugt je Regel mindestens einen Befund.
 */
export const ROI_RULES = {
  /** LEI: Format und ISO-17442-Prüfziffer. */
  "RV-101": "LEI-Format/Prüfziffer",
  /** Weder LEI noch nationale Kennung mit Kennungstyp. */
  "RV-102": "Kennung fehlt",
  /** EUID-Formatprüfung (nationalIdType = EUID). */
  "RV-103": "EUID-Format",
  /** Primärschlüssel fehlt (Entsprechung aufsichtliche Regel 805). */
  "RV-201": "Primärschlüssel fehlt",
  /** Duplikate von Schlüsseln (Entsprechung 806). */
  "RV-202": "Schlüssel-Duplikat",
  /** Referenzielle Integrität (Entsprechung 807). */
  "RV-301": "Referenz gebrochen",
  /** Pflichtfelder B_02.02 (Prüftiefe laut Trockenlauf). */
  "RV-401": "Pflichtfeld B_02.02",
  /** Pflichtfelder/fehlende Bewertung B_07.01. */
  "RV-402": "Pflichtfeld B_07.01",
  /** Sonstige Pflichtfelder (B_01, B_05, B_06). */
  "RV-403": "Pflichtfeld",
  /** Kettenrang: Wurzelglied muss Rang 1 ohne Vorgänger sein. */
  "RV-501": "Kettenwurzel",
  /** Kettenrang: Kind muss Rang des Vorgängers + 1 tragen (lückenlos). */
  "RV-502": "Kettenlücke",
  /** Zyklus in der Subunternehmerkette. */
  "RV-503": "Kettenzyklus",
  /** Kettenglied verweist auf Vertrag eines anderen Dienstleisters. */
  "RV-504": "Kette/Vertrag inkonsistent",
  /** Wertelistenprüfung gegen geschlossene Taxonomien (B_99.01-Ausnahme). */
  "RV-601": "Werteliste",
  /** Rahmenvertragsverweis ohne zugehörigen Vertragssatz. */
  "RV-701": "Rahmenvertrag fehlt",
  /** CIF-gestützte Dienstleistung ohne Exit-Plan. */
  "RV-702": "Exit-Plan fehlt",
  /** CTPP-Dienstleister ohne Auditrechte im Vertrag. */
  "RV-703": "CTPP ohne Auditrechte",
} as const;
export type RoiRuleId = keyof typeof ROI_RULES;

// ---------- GLEIF-Schnittstelle (ADR-0006 Nr. 6) ----------

/**
 * Optionaler, abschaltbarer LEI-Statusabgleich (z. B. GLEIF). Bewusst nur als
 * Schnittstelle – keine HTTP-Implementierung, keine Laufzeitabhängigkeit
 * (der Synology-Betrieb ist nicht zwingend online). Wird kein Provider
 * übergeben, findet kein Abgleich statt.
 */
export interface LeiStatusProvider {
  /** Registrierungsstatus einer LEI, z. B. ISSUED | LAPSED | RETIRED. */
  getStatus(lei: string): Promise<string>;
}

export async function validateLeiStatus(
  input: RoiInput,
  provider: LeiStatusProvider,
): Promise<RoiFinding[]> {
  const findings: RoiFinding[] = [];
  for (const tp of input.thirdParties) {
    if (!tp.lei) continue;
    const status = await provider.getStatus(tp.lei).catch(() => "UNKNOWN");
    if (status !== "ISSUED" && status !== "UNKNOWN") {
      findings.push({
        ruleId: "RV-101",
        severity: "WARNING",
        template: "B_05.01",
        kind: "PROVIDER",
        recordId: tp.id,
        recordRef: tp.tpId,
        field: "tp.lei",
        messageDe: `LEI-Registrierungsstatus ist ${status} – Kennung beim Dienstleister klären.`,
        messageEn: `LEI registration status is ${status} – clarify the identifier with the provider.`,
      });
    }
  }
  return findings;
}

// ---------- Hilfsfunktionen ----------

/**
 * EUID-Formatprüfung. TODO(verify): verbindliches Format (BRIS) gegen die
 * ITS-Ausfüllhinweise prüfen; bis dahin bewusst tolerant: zweistelliger
 * Ländercode gefolgt von mindestens vier weiteren Zeichen aus
 * Buchstaben/Ziffern/Punkt.
 */
export function isPlausibleEuid(euid: string): boolean {
  return /^[A-Z]{2}[A-Z0-9.]{4,}$/i.test(euid.trim());
}

function findDuplicates(values: (string | null)[]): Set<string> {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const v of values) {
    if (!v) continue;
    if (seen.has(v)) dup.add(v);
    seen.add(v);
  }
  return dup;
}

/** B_99.01-Ausnahme (ADR-0006 Nr. 4): eigener Code mit Definition ist zulässig. */
function hasDefinition(input: RoiInput, fieldPath: string, code: string): boolean {
  return input.definitions.some((d) => d.field === `${fieldPath}=${code}`);
}

// ---------- Engine ----------

export function validateRoi(input: RoiInput): RoiFinding[] {
  const findings: RoiFinding[] = [];
  const add = (f: RoiFinding) => findings.push(f);

  const entityIds = new Set(input.entities.map((e) => e.id));
  const tpIds = new Set(input.thirdParties.map((t) => t.id));
  const fnIds = new Set(input.functions.map((f) => f.id));
  const contractIds = new Map(input.contracts.map((c) => [c.id, c]));
  const contractRefs = new Set(
    input.contracts.map((c) => c.contractRef).filter((r): r is string => Boolean(r)),
  );

  // ---- Schlüssel und Formate: Einheiten (B_01) ----
  for (const e of input.entities) {
    if (e.lei && !isValidLei(e.lei)) {
      add({
        ruleId: "RV-101",
        severity: "ERROR",
        template: "B_01.02",
        kind: "ENTITY",
        recordId: e.id,
        recordRef: e.name,
        field: "entity.lei",
        messageDe: "LEI ungültig (Format oder ISO-17442-Prüfziffer) – Kennung korrigieren.",
        messageEn: "LEI invalid (format or ISO 17442 check digits) – correct the identifier.",
      });
    }
    if (!e.lei && !(e.nationalId && e.nationalIdType)) {
      add({
        ruleId: "RV-102",
        severity: "ERROR",
        template: "B_01.02",
        kind: "ENTITY",
        recordId: e.id,
        recordRef: e.name,
        field: "entity.lei",
        messageDe:
          "Weder LEI noch nationale Kennung mit Kennungstyp erfasst – eine Kennung ist Pflicht.",
        messageEn:
          "Neither LEI nor national identifier with type recorded – one identifier is mandatory.",
      });
    }
    if (e.nationalIdType === "EUID" && e.nationalId && !isPlausibleEuid(e.nationalId)) {
      add({
        ruleId: "RV-103",
        severity: "ERROR",
        template: "B_01.02",
        kind: "ENTITY",
        recordId: e.id,
        recordRef: e.name,
        field: "entity.nationalId",
        messageDe: "EUID entspricht nicht dem erwarteten Format (Ländercode + Registerkennung).",
        messageEn: "EUID does not match the expected format (country code + register identifier).",
      });
    }
    if (e.parentId && !entityIds.has(e.parentId)) {
      add({
        ruleId: "RV-301",
        severity: "REJECT",
        template: "B_01.02",
        kind: "ENTITY",
        recordId: e.id,
        recordRef: e.name,
        field: "entity.parent",
        messageDe:
          "Übergeordnete Einheit existiert nicht im Erfassungskreis (Entsprechung Regel 807).",
        messageEn:
          "Parent entity does not exist within the register scope (corresponds to rule 807).",
      });
    }
    if (!e.country) {
      add({
        ruleId: "RV-403",
        severity: "ERROR",
        template: "B_01.02",
        kind: "ENTITY",
        recordId: e.id,
        recordRef: e.name,
        field: "entity.country",
        messageDe: "Land der Einheit fehlt (ISO 3166-1 alpha-2 erfassen).",
        messageEn: "Country of the entity is missing (record ISO 3166-1 alpha-2).",
      });
    }
    if (!e.entityType) {
      add({
        ruleId: "RV-403",
        severity: "ERROR",
        template: "B_01.02",
        kind: "ENTITY",
        recordId: e.id,
        recordRef: e.name,
        field: "entity.entityType",
        messageDe: "Unternehmensart der Einheit fehlt (Werteliste, B_01.02).",
        messageEn: "Type of entity is missing (closed value list, B_01.02).",
      });
    } else {
      checkTaxonomy(e.entityType, ENTITY_TYPES, "entity.entityType", {
        template: "B_01.02",
        kind: "ENTITY",
        recordId: e.id,
        recordRef: e.name,
      });
    }
  }
  if (!entityIds.has(input.maintainerEntityId)) {
    add({
      ruleId: "RV-301",
      severity: "REJECT",
      template: "B_01.01",
      kind: "ENTITY",
      recordId: input.maintainerEntityId,
      recordRef: input.maintainerEntityId,
      field: "entity",
      messageDe: "Die Register führende Einheit ist nicht im Erfassungskreis enthalten.",
      messageEn: "The entity maintaining the register is not part of the register scope.",
    });
  }
  const dupEntityLeis = findDuplicates(input.entities.map((e) => e.lei));
  for (const e of input.entities) {
    if (e.lei && dupEntityLeis.has(e.lei)) {
      add({
        ruleId: "RV-202",
        severity: "REJECT",
        template: "B_01.02",
        kind: "ENTITY",
        recordId: e.id,
        recordRef: e.name,
        field: "entity.lei",
        messageDe: `LEI ${e.lei} ist mehrfach vergeben (Entsprechung Regel 806).`,
        messageEn: `LEI ${e.lei} is assigned more than once (corresponds to rule 806).`,
      });
    }
  }

  // ---- Zweigniederlassungen (B_01.03) ----
  const dupBranchCodes = findDuplicates(
    input.branches.map((b) => `${b.reportingEntityId}|${b.branchCode}`),
  );
  for (const b of input.branches) {
    if (!b.branchCode) {
      add({
        ruleId: "RV-201",
        severity: "REJECT",
        template: "B_01.03",
        kind: "BRANCH",
        recordId: b.id,
        recordRef: b.name ?? b.id,
        field: "branch.code",
        messageDe: "Identifikationscode der Zweigniederlassung fehlt (Entsprechung Regel 805).",
        messageEn: "Branch identification code is missing (corresponds to rule 805).",
      });
    } else if (dupBranchCodes.has(`${b.reportingEntityId}|${b.branchCode}`)) {
      add({
        ruleId: "RV-202",
        severity: "REJECT",
        template: "B_01.03",
        kind: "BRANCH",
        recordId: b.id,
        recordRef: b.branchCode || b.name || b.id,
        field: "branch.code",
        messageDe: "Identifikationscode der Zweigniederlassung ist je Einheit mehrfach vergeben.",
        messageEn: "Branch identification code is duplicated within the entity.",
      });
    }
    if (!entityIds.has(b.reportingEntityId)) {
      add({
        ruleId: "RV-301",
        severity: "REJECT",
        template: "B_01.03",
        kind: "BRANCH",
        recordId: b.id,
        recordRef: b.branchCode || b.name || b.id,
        field: "branch.entity",
        messageDe: "Zweigniederlassung verweist auf eine nicht erfasste Einheit.",
        messageEn: "Branch references an entity outside the register scope.",
      });
    }
    if (!b.country) {
      add({
        ruleId: "RV-403",
        severity: "ERROR",
        template: "B_01.03",
        kind: "BRANCH",
        recordId: b.id,
        recordRef: b.branchCode || b.name || b.id,
        field: "branch.country",
        messageDe: "Land der Zweigniederlassung fehlt.",
        messageEn: "Country of the branch is missing.",
      });
    }
  }

  // ---- Dienstleister (B_05.01) ----
  const dupTpIds = findDuplicates(input.thirdParties.map((t) => t.tpId));
  for (const tp of input.thirdParties) {
    if (!tp.tpId) {
      add({
        ruleId: "RV-201",
        severity: "REJECT",
        template: "B_05.01",
        kind: "PROVIDER",
        recordId: tp.id,
        recordRef: tp.name,
        field: "tp.tpId",
        messageDe: "Dienstleister-Kennung (tpId) fehlt (Entsprechung Regel 805).",
        messageEn: "Provider identifier (tpId) is missing (corresponds to rule 805).",
      });
    } else if (dupTpIds.has(tp.tpId)) {
      add({
        ruleId: "RV-202",
        severity: "REJECT",
        template: "B_05.01",
        kind: "PROVIDER",
        recordId: tp.id,
        recordRef: tp.tpId,
        field: "tp.tpId",
        messageDe: `Dienstleister-Kennung ${tp.tpId} ist mehrfach vergeben.`,
        messageEn: `Provider identifier ${tp.tpId} is assigned more than once.`,
      });
    }
    if (tp.lei && !isValidLei(tp.lei)) {
      add({
        ruleId: "RV-101",
        severity: "ERROR",
        template: "B_05.01",
        kind: "PROVIDER",
        recordId: tp.id,
        recordRef: tp.tpId,
        field: "tp.lei",
        messageDe: "LEI ungültig (Format oder ISO-17442-Prüfziffer) – Kennung korrigieren.",
        messageEn: "LEI invalid (format or ISO 17442 check digits) – correct the identifier.",
      });
    }
    if (!tp.lei && !(tp.nationalId && tp.nationalIdType)) {
      add({
        ruleId: "RV-102",
        severity: "ERROR",
        template: "B_05.01",
        kind: "PROVIDER",
        recordId: tp.id,
        recordRef: tp.tpId,
        field: "tp.lei",
        messageDe:
          "Weder LEI noch nationale Kennung mit Kennungstyp erfasst – eine Kennung ist Pflicht.",
        messageEn:
          "Neither LEI nor national identifier with type recorded – one identifier is mandatory.",
      });
    }
    if (tp.nationalIdType === "EUID" && tp.nationalId && !isPlausibleEuid(tp.nationalId)) {
      add({
        ruleId: "RV-103",
        severity: "ERROR",
        template: "B_05.01",
        kind: "PROVIDER",
        recordId: tp.id,
        recordRef: tp.tpId,
        field: "tp.nationalId",
        messageDe: "EUID entspricht nicht dem erwarteten Format (Ländercode + Registerkennung).",
        messageEn: "EUID does not match the expected format (country code + register identifier).",
      });
    }
    if (tp.ultimateParentId && !tpIds.has(tp.ultimateParentId)) {
      add({
        ruleId: "RV-301",
        severity: "REJECT",
        template: "B_05.01",
        kind: "PROVIDER",
        recordId: tp.id,
        recordRef: tp.tpId,
        field: "tp.ultimateParent",
        messageDe: "Oberste Muttergesellschaft ist nicht als Dienstleister-Datensatz erfasst.",
        messageEn: "Ultimate parent undertaking is not recorded as a provider record.",
      });
    }
    if (!tp.registeredCountry) {
      add({
        ruleId: "RV-403",
        severity: "ERROR",
        template: "B_05.01",
        kind: "PROVIDER",
        recordId: tp.id,
        recordRef: tp.tpId,
        field: "tp.country",
        messageDe: "Sitzland des Dienstleisters fehlt.",
        messageEn: "Provider's country of registration is missing.",
      });
    }
    checkTaxonomy(tp.providerType, PROVIDER_TYPES, "tp.providerType", {
      template: "B_05.01",
      kind: "PROVIDER",
      recordId: tp.id,
      recordRef: tp.tpId,
    });

    // Plausibilität: CTPP ohne Auditrechte in mindestens einem CIF-Vertrag
    if (tp.isCtpp) {
      const tpContracts = input.contracts.filter((c) => c.thirdPartyId === tp.id);
      const cifServices = tpContracts.flatMap((c) =>
        c.ictServices.filter((s) => s.supportedFunctionIds.length > 0),
      );
      const anyAuditRights = cifServices.some((s) => s.cifAssessment?.auditRightsInContract);
      if (cifServices.length > 0 && !anyAuditRights) {
        add({
          ruleId: "RV-703",
          severity: "WARNING",
          template: "B_05.01",
          kind: "PROVIDER",
          recordId: tp.id,
          recordRef: tp.tpId,
          field: "tp.isCtpp",
          messageDe:
            "Benannter kritischer Drittdienstleister (CTPP) ohne dokumentierte Auditrechte im Vertrag – Klausellage prüfen (Art. 30 Abs. 3 lit. e).",
          messageEn:
            "Designated critical provider (CTPP) without documented contractual audit rights – review the clause status (Art. 30(3)(e)).",
        });
      }
    }
  }

  // ---- Verträge (B_02) ----
  const dupContractRefs = findDuplicates(input.contracts.map((c) => c.contractRef));
  for (const c of input.contracts) {
    const ref = c.contractRef ?? c.id;
    if (!c.contractRef) {
      add({
        ruleId: "RV-201",
        severity: "REJECT",
        template: "B_02.01",
        kind: "CONTRACT",
        recordId: c.id,
        recordRef: ref,
        field: "contract.ref",
        messageDe:
          "Vertrags-Referenznummer fehlt – ohne Schlüssel ist der Vertrag nicht meldbar (Entsprechung Regel 805).",
        messageEn:
          "Contract reference number is missing – without a key the arrangement cannot be reported (corresponds to rule 805).",
      });
    } else if (dupContractRefs.has(c.contractRef)) {
      add({
        ruleId: "RV-202",
        severity: "REJECT",
        template: "B_02.01",
        kind: "CONTRACT",
        recordId: c.id,
        recordRef: ref,
        field: "contract.ref",
        messageDe: `Vertrags-Referenznummer ${c.contractRef} ist mehrfach vergeben (Entsprechung Regel 806).`,
        messageEn: `Contract reference ${c.contractRef} is assigned more than once (corresponds to rule 806).`,
      });
    }
    if (!tpIds.has(c.thirdPartyId)) {
      add({
        ruleId: "RV-301",
        severity: "REJECT",
        template: "B_02.01",
        kind: "CONTRACT",
        recordId: c.id,
        recordRef: ref,
        field: "contract.tp",
        messageDe:
          "Vertrag verweist auf einen nicht erfassten Dienstleister (Entsprechung Regel 807).",
        messageEn:
          "Arrangement references a provider outside the register (corresponds to rule 807).",
      });
    }
    if (c.signingEntityId && !entityIds.has(c.signingEntityId)) {
      add({
        ruleId: "RV-301",
        severity: "REJECT",
        template: "B_03.01",
        kind: "CONTRACT",
        recordId: c.id,
        recordRef: ref,
        field: "contract.signingEntity",
        messageDe: "Unterzeichnende Einheit existiert nicht im Erfassungskreis.",
        messageEn: "Signing entity does not exist within the register scope.",
      });
    }
    for (const uid of c.usingEntityIds) {
      if (!entityIds.has(uid)) {
        add({
          ruleId: "RV-301",
          severity: "REJECT",
          template: "B_04.01",
          kind: "CONTRACT",
          recordId: c.id,
          recordRef: ref,
          field: "contract.usingEntities",
          messageDe: "Nutzende Einheit existiert nicht im Erfassungskreis.",
          messageEn: "Using entity does not exist within the register scope.",
        });
      }
    }
    if (c.contractType) {
      checkTaxonomy(c.contractType, CONTRACT_TYPES, "contract.type", {
        template: "B_02.01",
        kind: "CONTRACT",
        recordId: c.id,
        recordRef: ref,
      });
    }
    // Plausibilität: Rahmenvertragsverweis ohne zugehörigen Vertragssatz
    if (c.parentContractRef && !contractRefs.has(c.parentContractRef)) {
      add({
        ruleId: "RV-701",
        severity: "ERROR",
        template: "B_02.01",
        kind: "CONTRACT",
        recordId: c.id,
        recordRef: ref,
        field: "contract.parentRef",
        messageDe: `Rahmenvertrag ${c.parentContractRef} ist nicht als eigener Vertragssatz erfasst – Rahmenvertrag anlegen oder Verweis entfernen.`,
        messageEn: `Overarching arrangement ${c.parentContractRef} is not recorded as its own contract – create it or remove the reference.`,
      });
    }
    if (!c.signingEntityId) {
      add({
        ruleId: "RV-403",
        severity: "ERROR",
        template: "B_03.01",
        kind: "CONTRACT",
        recordId: c.id,
        recordRef: ref,
        field: "contract.signingEntity",
        messageDe: "Unterzeichnende Einheit fehlt (B_03.01 nicht befüllbar).",
        messageEn: "Signing entity is missing (B_03.01 cannot be populated).",
      });
    }
    if (c.usingEntityIds.length === 0) {
      add({
        ruleId: "RV-403",
        severity: "ERROR",
        template: "B_04.01",
        kind: "CONTRACT",
        recordId: c.id,
        recordRef: ref,
        field: "contract.usingEntities",
        messageDe: "Keine nutzende Einheit erfasst (B_04.01 nicht befüllbar).",
        messageEn: "No using entity recorded (B_04.01 cannot be populated).",
      });
    }

    // ---- Dienstleistungen (B_02.02) – Prüftiefe laut Trockenlauf ----
    const dupSvcTypes = findDuplicates(c.ictServices.map((s) => s.ictServiceType));
    if (c.ictServices.length === 0) {
      add({
        ruleId: "RV-401",
        severity: "ERROR",
        template: "B_02.02",
        kind: "CONTRACT",
        recordId: c.id,
        recordRef: ref,
        field: "contract.ictServices",
        messageDe:
          "Vertrag ohne IKT-Dienstleistung – mindestens eine Dienstleistungsart erfassen (B_02.02).",
        messageEn:
          "Arrangement without ICT service – record at least one type of ICT service (B_02.02).",
      });
    }
    for (const s of c.ictServices) {
      const svcRef = `${ref}/${s.ictServiceType || "?"}`;
      if (!s.ictServiceType) {
        add({
          ruleId: "RV-401",
          severity: "ERROR",
          template: "B_02.02",
          kind: "SERVICE",
          recordId: s.id,
          recordRef: svcRef,
          field: "service.ictServiceType",
          messageDe: "Art der IKT-Dienstleistung fehlt (Pflichtfeld B_02.02).",
          messageEn: "Type of ICT service is missing (mandatory field, B_02.02).",
        });
      } else {
        if (dupSvcTypes.has(s.ictServiceType)) {
          add({
            ruleId: "RV-202",
            severity: "REJECT",
            template: "B_02.02",
            kind: "SERVICE",
            recordId: s.id,
            recordRef: svcRef,
            field: "service.ictServiceType",
            messageDe:
              "Dienstleistungsart ist im Vertrag mehrfach erfasst (Entsprechung Regel 806).",
            messageEn:
              "The ICT service type is recorded more than once for this arrangement (corresponds to rule 806).",
          });
        }
        checkTaxonomy(s.ictServiceType, ICT_SERVICE_TYPES, "service.ictServiceType", {
          template: "B_02.02",
          kind: "SERVICE",
          recordId: s.id,
          recordRef: svcRef,
        });
      }
      const storage = s.dataStorageCountries ?? c.countryOfDataStorage;
      const processing = s.dataProcessingCountries ?? c.countryOfDataProcessing;
      if (!storage) {
        add({
          ruleId: "RV-401",
          severity: "ERROR",
          template: "B_02.02",
          kind: "SERVICE",
          recordId: s.id,
          recordRef: svcRef,
          field: "service.dataStorageCountries",
          messageDe:
            "Speicherorte (Länder) fehlen – weder an der Dienstleistung noch am Vertrag erfasst.",
          messageEn:
            "Data storage locations (countries) are missing – neither on the service nor on the arrangement.",
        });
      }
      if (!processing) {
        add({
          ruleId: "RV-401",
          severity: "ERROR",
          template: "B_02.02",
          kind: "SERVICE",
          recordId: s.id,
          recordRef: svcRef,
          field: "service.dataProcessingCountries",
          messageDe:
            "Verarbeitungsorte (Länder) fehlen – weder an der Dienstleistung noch am Vertrag erfasst.",
          messageEn:
            "Data processing locations (countries) are missing – neither on the service nor on the arrangement.",
        });
      }
      checkTaxonomy(s.dataSensitivity, DATA_SENSITIVITY, "service.dataSensitivity", {
        template: "B_02.02",
        kind: "SERVICE",
        recordId: s.id,
        recordRef: svcRef,
      });
      for (const fnId of s.supportedFunctionIds) {
        if (!fnIds.has(fnId)) {
          add({
            ruleId: "RV-301",
            severity: "REJECT",
            template: "B_02.02",
            kind: "SERVICE",
            recordId: s.id,
            recordRef: svcRef,
            field: "service.supportedFunctions",
            messageDe: "Gestützte Funktion existiert nicht (Entsprechung Regel 807).",
            messageEn: "Supported function does not exist (corresponds to rule 807).",
          });
        }
      }

      // ---- B_07.01 – Bewertung je CIF-gestützter Dienstleistung ----
      const isCif = s.supportedFunctionIds.some(
        (id) => input.functions.find((f) => f.id === id)?.isCritical,
      );
      if (isCif && !s.cifAssessment) {
        add({
          ruleId: "RV-402",
          severity: "ERROR",
          template: "B_07.01",
          kind: "SERVICE",
          recordId: s.id,
          recordRef: svcRef,
          field: "assessment",
          messageDe:
            "CIF-gestützte Dienstleistung ohne Bewertung – B_07.01-Datensatz anlegen (Substituierbarkeit, Exit-Plan, Auditrechte).",
          messageEn:
            "CIF-supporting service without assessment – create the B_07.01 record (substitutability, exit plan, audit rights).",
        });
      }
      if (s.cifAssessment) {
        checkTaxonomy(
          s.cifAssessment.substitutability,
          ROI_SUBSTITUTABILITY,
          "assessment.substitutability",
          { template: "B_07.01", kind: "SERVICE", recordId: s.id, recordRef: svcRef },
        );
        if (!s.cifAssessment.rationale) {
          add({
            ruleId: "RV-402",
            severity: "ERROR",
            template: "B_07.01",
            kind: "SERVICE",
            recordId: s.id,
            recordRef: svcRef,
            field: "assessment.rationale",
            messageDe: "Begründung der Substituierbarkeitsbewertung fehlt (Pflichtangabe B_07.01).",
            messageEn:
              "Rationale for the substitutability assessment is missing (mandatory, B_07.01).",
          });
        }
        // Plausibilität: CIF-Dienstleistung ohne Exit-Plan
        if (isCif && !s.cifAssessment.exitPlanExists) {
          add({
            ruleId: "RV-702",
            severity: "WARNING",
            template: "B_07.01",
            kind: "SERVICE",
            recordId: s.id,
            recordRef: svcRef,
            field: "assessment.exitPlanExists",
            messageDe:
              "CIF-gestützte Dienstleistung ohne Exit-Plan – Ausstiegsstrategie erstellen und testen (Art. 28 Abs. 8).",
            messageEn:
              "CIF-supporting service without exit plan – establish and test an exit strategy (Art. 28(8)).",
          });
        }
      }
    }
  }

  // ---- Subunternehmerkette (B_05.02) ----
  validateChain(input, add, contractIds);

  // ---- Funktionen (B_06.01) ----
  const dupFnCodes = findDuplicates(input.functions.map((f) => f.functionIdCode));
  for (const f of input.functions) {
    if (!f.functionIdCode) {
      add({
        ruleId: "RV-201",
        severity: "REJECT",
        template: "B_06.01",
        kind: "FUNCTION",
        recordId: f.id,
        recordRef: f.cfId,
        field: "function.idCode",
        messageDe: "Funktions-Identifikationscode fehlt (Entsprechung Regel 805).",
        messageEn: "Function identification code is missing (corresponds to rule 805).",
      });
    } else if (dupFnCodes.has(f.functionIdCode)) {
      add({
        ruleId: "RV-202",
        severity: "REJECT",
        template: "B_06.01",
        kind: "FUNCTION",
        recordId: f.id,
        recordRef: f.cfId,
        field: "function.idCode",
        messageDe: `Funktions-Identifikationscode ${f.functionIdCode} ist mehrfach vergeben (Entsprechung Regel 806).`,
        messageEn: `Function identification code ${f.functionIdCode} is assigned more than once (corresponds to rule 806).`,
      });
    }
    if (f.isCritical && !f.discontinuationImpact) {
      add({
        ruleId: "RV-403",
        severity: "ERROR",
        template: "B_06.01",
        kind: "FUNCTION",
        recordId: f.id,
        recordRef: f.cfId,
        field: "function.discontinuationImpact",
        messageDe:
          "Folgen einer Einstellung der kritischen Funktion sind nicht beschrieben (B_06.01).",
        messageEn: "Impact of discontinuing the critical function is not described (B_06.01).",
      });
    }
    if (f.isCritical && f.rtoHours == null) {
      add({
        ruleId: "RV-403",
        severity: "ERROR",
        template: "B_06.01",
        kind: "FUNCTION",
        recordId: f.id,
        recordRef: f.cfId,
        field: "function.rtoHours",
        messageDe: "Wiederherstellungsziel (RTO) der kritischen Funktion fehlt.",
        messageEn: "Recovery time objective (RTO) of the critical function is missing.",
      });
    }
  }

  return findings;

  // ---- Wertelistenprüfung mit B_99.01-Ausnahme ----
  function checkTaxonomy(
    code: string,
    taxonomy: TaxonomyEntry[],
    fieldPath: string,
    at: { template: RoiTemplateId; kind: RoiRecordKind; recordId: string; recordRef: string },
  ) {
    if (isTaxonomyCode(taxonomy, code)) return;
    if (hasDefinition(input, fieldPath, code)) return; // definiert -> B_99.01
    add({
      ruleId: "RV-601",
      severity: "ERROR",
      template: at.template,
      kind: at.kind,
      recordId: at.recordId,
      recordRef: at.recordRef,
      field: fieldPath,
      messageDe: `Wert „${code}" ist nicht in der geschlossenen Werteliste enthalten – zulässigen Code wählen oder Definition für B_99.01 hinterlegen.`,
      messageEn: `Value "${code}" is not part of the closed value list – choose a valid code or record a definition for B_99.01.`,
    });
  }
}

/**
 * Rang-/Kettenprüfung (gespeicherte Konvention: Rang 1 = erste
 * Weitervergabestufe, siehe ADR-0006 Nr. 5): Wurzelglieder tragen Rang 1 und
 * keinen Vorgänger, Kinder den Rang des Vorgängers + 1, keine Zyklen, und der
 * Vertragsbezug gehört zum Dienstleister der Kette.
 */
function validateChain(
  input: RoiInput,
  add: (f: RoiFinding) => void,
  contractIds: Map<string, RoiInput["contracts"][number]>,
) {
  const byId = new Map(input.subcontractors.map((s) => [s.id, s]));
  for (const s of input.subcontractors) {
    const ref = s.name || s.id;
    const parent = s.parentId ? byId.get(s.parentId) : undefined;
    if (s.parentId && !parent) {
      add({
        ruleId: "RV-301",
        severity: "REJECT",
        template: "B_05.02",
        kind: "CHAIN",
        recordId: s.id,
        recordRef: ref,
        field: "chain.parent",
        messageDe: "Vorgänger-Kettenglied existiert nicht (Entsprechung Regel 807).",
        messageEn: "Upstream chain link does not exist (corresponds to rule 807).",
      });
    }
    if (!s.parentId && s.rank !== 1) {
      add({
        ruleId: "RV-501",
        severity: "ERROR",
        template: "B_05.02",
        kind: "CHAIN",
        recordId: s.id,
        recordRef: ref,
        field: "chain.rank",
        messageDe: `Kettenglied ohne Vorgänger muss Rang 1 tragen (erfasst: ${s.rank}) – nur direkte Weitervergaben stehen am Kettenanfang.`,
        messageEn: `A chain link without an upstream link must have rank 1 (recorded: ${s.rank}) – only direct subcontracting starts a chain.`,
      });
    }
    if (parent && s.rank !== parent.rank + 1) {
      add({
        ruleId: "RV-502",
        severity: "ERROR",
        template: "B_05.02",
        kind: "CHAIN",
        recordId: s.id,
        recordRef: ref,
        field: "chain.rank",
        messageDe: `Kettenrang ist nicht lückenlos: Vorgänger hat Rang ${parent.rank}, dieses Glied ${s.rank} (erwartet: ${parent.rank + 1}).`,
        messageEn: `Chain rank is not contiguous: upstream link has rank ${parent.rank}, this link ${s.rank} (expected ${parent.rank + 1}).`,
      });
    }
    if (s.contractId) {
      const c = contractIds.get(s.contractId);
      if (!c) {
        add({
          ruleId: "RV-301",
          severity: "REJECT",
          template: "B_05.02",
          kind: "CHAIN",
          recordId: s.id,
          recordRef: ref,
          field: "chain.contract",
          messageDe:
            "Kettenglied verweist auf einen nicht erfassten Vertrag (Entsprechung Regel 807).",
          messageEn:
            "Chain link references an arrangement outside the register (corresponds to rule 807).",
        });
      } else if (c.thirdPartyId !== s.thirdPartyId) {
        add({
          ruleId: "RV-504",
          severity: "ERROR",
          template: "B_05.02",
          kind: "CHAIN",
          recordId: s.id,
          recordRef: ref,
          field: "chain.contract",
          messageDe:
            "Kettenglied verweist auf den Vertrag eines anderen Dienstleisters – Vertragsbezug korrigieren.",
          messageEn:
            "Chain link references an arrangement of a different provider – correct the contract reference.",
        });
      }
    }
    // Zyklenprüfung über die parent-Kette (Floyd nicht nötig: begrenzte Tiefe)
    const seen = new Set<string>([s.id]);
    let cur = parent;
    while (cur) {
      if (seen.has(cur.id)) {
        add({
          ruleId: "RV-503",
          severity: "REJECT",
          template: "B_05.02",
          kind: "CHAIN",
          recordId: s.id,
          recordRef: ref,
          field: "chain.parent",
          messageDe:
            "Zyklus in der Subunternehmerkette – die Kette muss gerichtet und zyklenfrei sein.",
          messageEn: "Cycle in the subcontracting chain – the chain must be directed and acyclic.",
        });
        break;
      }
      seen.add(cur.id);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    if (!s.country) {
      add({
        ruleId: "RV-403",
        severity: "ERROR",
        template: "B_05.02",
        kind: "CHAIN",
        recordId: s.id,
        recordRef: ref,
        field: "chain.country",
        messageDe: "Land des Kettenglieds fehlt.",
        messageEn: "Country of the chain link is missing.",
      });
    }
  }
}

export type { RoiSubcontractorLink };
