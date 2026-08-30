/**
 * Geschlossene Wertelisten (Taxonomien) des DORA-Informationsregisters
 * (Meldeschicht Welle 1, ADR-0005 Nr. 7).
 *
 * Versioniert im Repository, weil der Synology-Betrieb nicht zwingend online
 * ist; die verwendete Version wird je RoiSnapshot mitgeschrieben.
 *
 * WICHTIG (Leitplanke des Auftrags): Verbindlich sind allein die
 * Durchführungsverordnung (EU) 2024/2956 samt Anhängen und die
 * veröffentlichten ESA-Validierungsregeln. Einträge mit
 * `status: "TO_VERIFY"` sind am verbindlichen Text noch zu verifizieren
 * (TODO(verify)); deutsche Bezeichnungen sind Arbeitsübersetzungen, solange
 * keine amtliche deutsche Fassung eingepflegt ist. Nichts hiervon wird als
 * aufsichtlich bestätigt ausgegeben.
 */

export const ROI_TAXONOMY_VERSION = "2024-2956.draft-1"; // TODO(verify): gegen DVO (EU) 2024/2956 Anhänge verifizieren, dann Version anheben

export type TaxonomyStatus = "VERIFIED" | "TO_VERIFY";

export interface TaxonomyEntry {
  code: string;
  de: string;
  en: string;
  status: TaxonomyStatus;
}

/**
 * Arten von IKT-Dienstleistungen (S01–S19).
 * Quelle: Anhang „Arten von IKT-Dienstleistungen" der DVO (EU) 2024/2956.
 * TODO(verify): Codes und Wortlaut gegen den verbindlichen Anhangstext prüfen.
 */
export const ICT_SERVICE_TYPES: TaxonomyEntry[] = [
  { code: "S01", de: "IKT-Projektmanagement", en: "ICT project management", status: "TO_VERIFY" },
  { code: "S02", de: "IKT-Entwicklung", en: "ICT development", status: "TO_VERIFY" },
  {
    code: "S03",
    de: "IKT-Helpdesk und First-Level-Support",
    en: "ICT help desk and first level support",
    status: "TO_VERIFY",
  },
  {
    code: "S04",
    de: "IKT-Sicherheitsmanagementdienste",
    en: "ICT security management services",
    status: "TO_VERIFY",
  },
  { code: "S05", de: "Bereitstellung von Daten", en: "Provision of data", status: "TO_VERIFY" },
  { code: "S06", de: "Datenanalyse", en: "Data analysis", status: "TO_VERIFY" },
  {
    code: "S07",
    de: "IKT-Einrichtungen und Hosting (ohne Cloud-Dienste)",
    en: "ICT facilities and hosting (excluding Cloud services)",
    status: "TO_VERIFY",
  },
  { code: "S08", de: "Rechenleistung", en: "Computation", status: "TO_VERIFY" },
  {
    code: "S09",
    de: "Datenspeicherung (ohne Cloud)",
    en: "Non-Cloud data storage",
    status: "TO_VERIFY",
  },
  { code: "S10", de: "Telekommunikationsanbieter", en: "Telecom carrier", status: "TO_VERIFY" },
  { code: "S11", de: "Netzinfrastruktur", en: "Network infrastructure", status: "TO_VERIFY" },
  {
    code: "S12",
    de: "Hardware und physische Geräte",
    en: "Hardware and physical devices",
    status: "TO_VERIFY",
  },
  {
    code: "S13",
    de: "Softwarelizenzierung (ohne SaaS)",
    en: "Software licencing (excluding SaaS)",
    status: "TO_VERIFY",
  },
  {
    code: "S14",
    de: "IKT-Betriebsmanagement (einschließlich Wartung)",
    en: "ICT operation management (including maintenance)",
    status: "TO_VERIFY",
  },
  { code: "S15", de: "IKT-Beratung", en: "ICT consulting", status: "TO_VERIFY" },
  { code: "S16", de: "IKT-Risikomanagement", en: "ICT risk management", status: "TO_VERIFY" },
  { code: "S17", de: "Cloud-Dienste: IaaS", en: "Cloud services: IaaS", status: "TO_VERIFY" },
  { code: "S18", de: "Cloud-Dienste: PaaS", en: "Cloud services: PaaS", status: "TO_VERIFY" },
  { code: "S19", de: "Cloud-Dienste: SaaS", en: "Cloud services: SaaS", status: "TO_VERIFY" },
];

/**
 * Unternehmensarten der meldenden Einheit (B_01.02), abgeleitet aus dem
 * Anwendungsbereich in Art. 2 Abs. 1 DORA.
 * TODO(verify): gegen die geschlossene Werteliste der DVO (EU) 2024/2956
 * (Anhang, Feld „Art des Unternehmens") prüfen — dort gelten eigene Codes.
 */
export const ENTITY_TYPES: TaxonomyEntry[] = [
  {
    code: "CREDIT_INSTITUTION",
    de: "Kreditinstitut",
    en: "Credit institution",
    status: "TO_VERIFY",
  },
  {
    code: "PAYMENT_INSTITUTION",
    de: "Zahlungsinstitut",
    en: "Payment institution",
    status: "TO_VERIFY",
  },
  {
    code: "EMONEY_INSTITUTION",
    de: "E-Geld-Institut",
    en: "Electronic money institution",
    status: "TO_VERIFY",
  },
  { code: "INVESTMENT_FIRM", de: "Wertpapierfirma", en: "Investment firm", status: "TO_VERIFY" },
  {
    code: "CASP",
    de: "Anbieter von Krypto-Dienstleistungen",
    en: "Crypto-asset service provider",
    status: "TO_VERIFY",
  },
  { code: "CSD", de: "Zentralverwahrer", en: "Central securities depository", status: "TO_VERIFY" },
  { code: "CCP", de: "Zentrale Gegenpartei", en: "Central counterparty", status: "TO_VERIFY" },
  { code: "TRADING_VENUE", de: "Handelsplatz", en: "Trading venue", status: "TO_VERIFY" },
  {
    code: "AIFM",
    de: "Verwalter alternativer Investmentfonds",
    en: "Manager of alternative investment funds",
    status: "TO_VERIFY",
  },
  {
    code: "MANAGEMENT_COMPANY",
    de: "Verwaltungsgesellschaft (OGAW)",
    en: "Management company (UCITS)",
    status: "TO_VERIFY",
  },
  {
    code: "INSURANCE_UNDERTAKING",
    de: "Versicherungs-/Rückversicherungsunternehmen",
    en: "Insurance or reinsurance undertaking",
    status: "TO_VERIFY",
  },
  {
    code: "IORP",
    de: "Einrichtung der betrieblichen Altersversorgung",
    en: "Institution for occupational retirement provision",
    status: "TO_VERIFY",
  },
  {
    code: "OTHER",
    de: "Sonstiges Finanzunternehmen i. S. v. Art. 2 Abs. 1 DORA",
    en: "Other financial entity under Art. 2(1) DORA",
    status: "TO_VERIFY",
  },
];

/**
 * Art der vertraglichen Vereinbarung (B_02.01).
 * TODO(verify): Wortlaut/Codes der geschlossenen Werteliste prüfen.
 */
export const CONTRACT_TYPES: TaxonomyEntry[] = [
  {
    code: "STANDALONE",
    de: "Eigenständige Vereinbarung",
    en: "Standalone arrangement",
    status: "TO_VERIFY",
  },
  {
    code: "MASTER",
    de: "Rahmenvereinbarung",
    en: "Overarching (master) arrangement",
    status: "TO_VERIFY",
  },
  {
    code: "SUBSEQUENT_OR_ASSOCIATED",
    de: "Folge- oder zugehörige Vereinbarung",
    en: "Subsequent or associated arrangement",
    status: "TO_VERIFY",
  },
];

/**
 * Substituierbarkeit der IKT-Dienstleistung (B_07.01) — Wertemenge gemäß
 * Auftrag; entspricht der vierstufigen ITS-Skala.
 * TODO(verify): amtliche Codes der Werteliste ergänzen.
 */
export const ROI_SUBSTITUTABILITY: TaxonomyEntry[] = [
  {
    code: "NOT_SUBSTITUTABLE",
    de: "Nicht substituierbar",
    en: "Not substitutable",
    status: "TO_VERIFY",
  },
  {
    code: "HIGHLY_COMPLEX",
    de: "Hochkomplexe Substituierbarkeit",
    en: "Highly complex substitutability",
    status: "TO_VERIFY",
  },
  {
    code: "MEDIUM_COMPLEXITY",
    de: "Mittlere Komplexität der Substituierbarkeit",
    en: "Medium complexity in terms of substitutability",
    status: "TO_VERIFY",
  },
  {
    code: "EASILY_SUBSTITUTABLE",
    de: "Leicht substituierbar",
    en: "Easily substitutable",
    status: "TO_VERIFY",
  },
];

/** Sensibilität der gespeicherten Daten (B_02.02). TODO(verify): Werteliste prüfen. */
export const DATA_SENSITIVITY: TaxonomyEntry[] = [
  { code: "LOW", de: "Niedrig", en: "Low", status: "TO_VERIFY" },
  { code: "MEDIUM", de: "Mittel", en: "Medium", status: "TO_VERIFY" },
  { code: "HIGH", de: "Hoch", en: "High", status: "TO_VERIFY" },
];

/** Rolle des Dienstleisters in der Lieferkette (Cockpit-Wertemenge, B_05.01). */
export const PROVIDER_TYPES: TaxonomyEntry[] = [
  {
    code: "DIRECT",
    de: "Direkter IKT-Dienstleister",
    en: "Direct ICT third-party service provider",
    status: "VERIFIED",
  },
  {
    code: "INTRAGROUP",
    de: "Gruppeninterner Dienstleister",
    en: "Intra-group service provider",
    status: "VERIFIED",
  },
  { code: "SUBCONTRACTOR", de: "Subdienstleister", en: "Subcontractor", status: "VERIFIED" },
  {
    code: "ULTIMATE_PARENT",
    de: "Oberste Muttergesellschaft eines Dienstleisters",
    en: "Ultimate parent undertaking of a provider",
    status: "VERIFIED",
  },
];

/** Meldeebene des Registers (Cockpit-Wertemenge, Mapping siehe ADR-0005 Nr. 1). */
export const ROI_REPORTING_LEVELS: TaxonomyEntry[] = [
  { code: "ENTITY", de: "Einzelunternehmen", en: "Entity level", status: "VERIFIED" },
  { code: "SUB_CONSOLIDATED", de: "Teilkonsolidiert", en: "Sub-consolidated", status: "VERIFIED" },
  { code: "CONSOLIDATED", de: "Konsolidiert", en: "Consolidated", status: "VERIFIED" },
];

/** Status eines Meldestands (Cockpit-Workflow, kein Regulierungsbegriff). */
export const ROI_SNAPSHOT_STATUS = ["DRAFT", "FROZEN", "SUBMITTED"] as const;
export type RoiSnapshotStatus = (typeof ROI_SNAPSHOT_STATUS)[number];

/** Die 15 Meldebögen des Informationsregisters (Anhang I der DVO (EU) 2024/2956). */
export const ROI_TEMPLATES = [
  "B_01.01",
  "B_01.02",
  "B_01.03",
  "B_02.01",
  "B_02.02",
  "B_02.03",
  "B_03.01",
  "B_03.02",
  "B_03.03",
  "B_04.01",
  "B_05.01",
  "B_05.02",
  "B_06.01",
  "B_07.01",
  "B_99.01",
] as const;
export type RoiTemplateId = (typeof ROI_TEMPLATES)[number];

export function taxonomyCodes(entries: TaxonomyEntry[]): string[] {
  return entries.map((e) => e.code);
}

export function isTaxonomyCode(entries: TaxonomyEntry[], code: string): boolean {
  return entries.some((e) => e.code === code);
}
