import type { Locale } from "@/lib/i18n/config";

/**
 * Übersetzungen der Meldeschicht (DORA-Informationsregister, ADR-0005).
 * Muster wie tprm.ts: `de` ist die Referenz, `en` wird über den Typ erzwungen.
 * Wertelisten-Labels entsprechen den Codes aus lib/content/roi-taxonomies.ts;
 * die dortigen de/en-Bezeichnungen sind fachlich maßgeblich — hier stehen die
 * UI-Feldbezeichnungen und Kurzlabels für Auswahllisten.
 */

const de = {
  register: {
    title: "Informationsregister",
    description:
      "Register of Information nach DVO (EU) 2024/2956 — Meldeentwurf, keine aufsichtliche Abgabe",
    entity: {
      name: "Meldende Einheit",
      country: "Land",
      entityType: "Unternehmensart",
      hierarchyRole: "Rolle im Konsolidierungskreis",
      competentAuthority: "Zuständige Behörde",
      totalAssetsEur: "Bilanzsumme (EUR)",
      consolidationLevel: "Konsolidierungsebene",
      branch: "Zweigniederlassung",
      branchCode: "Identifikationscode",
    },
    contract: {
      contractType: "Vertragsart",
      governingLaw: "Anwendbares Recht (Land)",
      annualCostEur: "Jährliche Kosten (EUR)",
      parentContractRef: "Rahmenvertrag (Referenz)",
      isIntragroup: "Gruppenintern",
      terminationNoticeDaysEntity: "Kündigungsfrist Finanzunternehmen (Tage)",
      terminationNoticeDaysProvider: "Kündigungsfrist Dienstleister (Tage)",
      isIctService: "IKT-Dienstleistung (MaRisk-Kennzeichen)",
      signingEntity: "Unterzeichnende Einheit",
      usingEntities: "Nutzende Einheiten",
    },
    service: {
      title: "IKT-Dienstleistung",
      ictServiceType: "Art der IKT-Dienstleistung",
      dataStorageCountries: "Speicherorte (Länder)",
      dataProcessingCountries: "Verarbeitungsorte (Länder)",
      dataSensitivity: "Datensensibilität",
      supportedFunctions: "Gestützte Funktionen",
    },
    provider: {
      providerType: "Rolle in der Lieferkette",
      ultimateParent: "Oberste Muttergesellschaft",
      isCtpp: "Kritischer IKT-Drittdienstleister (CTPP)",
    },
    chain: {
      contract: "Vertrag",
      ictServiceType: "Weitervergebene IKT-Dienstleistung",
    },
    functionFields: {
      licensedActivity: "Zulassungspflichtige Tätigkeit",
      discontinuationImpact: "Folgen einer Einstellung",
      criticalityRationale: "Begründung der Kritikalität",
    },
    assessment: {
      title: "Bewertung der IKT-Dienstleistung (B_07.01)",
      substitutability: "Substituierbarkeit",
      rationale: "Begründung",
      reintegrationTimeDays: "Wiedereingliederungsdauer (Tage)",
      exitPlanExists: "Exit-Plan vorhanden",
      alternativeProviders: "Alternative Anbieter",
      lastAuditDate: "Letztes Audit",
      auditRightsInContract: "Auditrechte im Vertrag",
    },
    snapshot: {
      title: "Meldestand",
      referenceDate: "Stichtag",
      version: "Version",
      reportingLevel: "Meldeebene",
      taxonomyVersion: "Taxonomieversion",
      status: "Status",
      checksum: "Prüfsumme",
      submittedAt: "Abgegeben am",
      submissionReference: "Abgabereferenz",
      statusLabels: {
        DRAFT: "Entwurf",
        FROZEN: "Eingefroren",
        SUBMITTED: "Abgegeben",
      } as Record<string, string>,
    },
  },
};

const en: typeof de = {
  register: {
    title: "Register of Information",
    description:
      "Register of Information under Implementing Regulation (EU) 2024/2956 — reporting draft, not the supervisory submission",
    entity: {
      name: "Reporting entity",
      country: "Country",
      entityType: "Type of entity",
      hierarchyRole: "Role within the consolidation scope",
      competentAuthority: "Competent authority",
      totalAssetsEur: "Total assets (EUR)",
      consolidationLevel: "Consolidation level",
      branch: "Branch",
      branchCode: "Identification code",
    },
    contract: {
      contractType: "Type of contractual arrangement",
      governingLaw: "Governing law (country)",
      annualCostEur: "Annual expense (EUR)",
      parentContractRef: "Overarching arrangement (reference)",
      isIntragroup: "Intra-group",
      terminationNoticeDaysEntity: "Notice period, financial entity (days)",
      terminationNoticeDaysProvider: "Notice period, provider (days)",
      isIctService: "ICT service (MaRisk flag)",
      signingEntity: "Signing entity",
      usingEntities: "Entities making use of the service",
    },
    service: {
      title: "ICT service",
      ictServiceType: "Type of ICT service",
      dataStorageCountries: "Storage locations (countries)",
      dataProcessingCountries: "Processing locations (countries)",
      dataSensitivity: "Data sensitiveness",
      supportedFunctions: "Supported functions",
    },
    provider: {
      providerType: "Role in the supply chain",
      ultimateParent: "Ultimate parent undertaking",
      isCtpp: "Critical ICT third-party provider (CTPP)",
    },
    chain: {
      contract: "Contractual arrangement",
      ictServiceType: "Subcontracted ICT service",
    },
    functionFields: {
      licensedActivity: "Licensed activity",
      discontinuationImpact: "Impact of discontinuation",
      criticalityRationale: "Criticality rationale",
    },
    assessment: {
      title: "Assessment of the ICT service (B_07.01)",
      substitutability: "Substitutability",
      rationale: "Rationale",
      reintegrationTimeDays: "Reintegration time (days)",
      exitPlanExists: "Exit plan in place",
      alternativeProviders: "Alternative providers",
      lastAuditDate: "Last audit",
      auditRightsInContract: "Audit rights in the contract",
    },
    snapshot: {
      title: "Reporting snapshot",
      referenceDate: "Reference date",
      version: "Version",
      reportingLevel: "Reporting level",
      taxonomyVersion: "Taxonomy version",
      status: "Status",
      checksum: "Checksum",
      submittedAt: "Submitted at",
      submissionReference: "Submission reference",
      statusLabels: {
        DRAFT: "Draft",
        FROZEN: "Frozen",
        SUBMITTED: "Submitted",
      } as Record<string, string>,
    },
  },
};

export const ROI_MESSAGES: Record<Locale, typeof de> = { de, en };
