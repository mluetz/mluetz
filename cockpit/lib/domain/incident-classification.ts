/**
 * Klassifizierung schwerwiegender IKT-Vorfälle nach Art. 18 DORA i. V. m.
 * der Delegierten Verordnung (EU) 2024/1772 (Meldeschicht Welle 6,
 * ADR-0010; zuvor Review v3, P1-04).
 *
 * Die SIEBEN Kriterien der DelVO werden als MESSWERTE erfasst
 * (IncidentMeasurements); „erfüllt" wird gegen zentrale Schwellwerte
 * abgeleitet (evaluateCriteria). Die Schwellwerte sind Arbeitswerte —
 * TODO(verify): gegen den verbindlichen Text der DelVO (EU) 2024/1772
 * prüfen; sie sind bewusst zentral konfigurierbar gehalten.
 *
 * Major-Regel (Auftrag Welle 6, reine Funktion):
 *   schwerwiegend <=> Kritikalität der Dienste erfüllt UND
 *                     (Datenverlust erfüllt ODER >= 2 weitere Kriterien).
 */

export interface ClassificationCriterion {
  key: string;
  de: string;
  en: string;
  defaultThreshold: string;
}

/** Die sieben Kriterien der DelVO (EU) 2024/1772 (ADR-0010 Nr. 1). */
export const CLASSIFICATION_CRITERIA: ClassificationCriterion[] = [
  {
    key: "CLIENTS_TRANSACTIONS",
    de: "Betroffene Kunden, Gegenparteien und Transaktionen",
    en: "Clients, financial counterparts and transactions affected",
    defaultThreshold:
      "> 10 % der Kunden oder > 100 000 Kunden; > 30 % der Gegenparteien; > 10 % des täglichen Transaktionsvolumens",
  },
  {
    key: "REPUTATION",
    de: "Reputationsauswirkung",
    en: "Reputational impact",
    defaultThreshold: "Medienberichterstattung, Beschwerden oder Kundenabwanderung",
  },
  {
    key: "DURATION",
    de: "Dauer und Dienstausfall",
    en: "Duration and service downtime",
    defaultThreshold: "Dauer > 24 h oder Dienstausfall > 2 h bei kritischen Diensten",
  },
  {
    key: "GEO",
    de: "Geografische Ausbreitung",
    en: "Geographical spread",
    defaultThreshold: "Auswirkungen in >= 2 Mitgliedstaaten",
  },
  {
    key: "DATA_LOSS",
    de: "Datenverluste nach Schutzziel (Verfügbarkeit/Integrität/Vertraulichkeit/Authentizität)",
    en: "Data losses by protection goal (availability/integrity/confidentiality/authenticity)",
    defaultThreshold: "Beeinträchtigung mindestens eines Schutzziels mit wesentlicher Folge",
  },
  {
    key: "CRITICAL_SERVICES",
    de: "Kritikalität der betroffenen Dienste (CIF-Bezug)",
    en: "Criticality of services affected (CIF)",
    defaultThreshold: "IKT-Dienste, die kritische oder wichtige Funktionen stützen, betroffen",
  },
  {
    key: "ECONOMIC",
    de: "Wirtschaftliche Auswirkung",
    en: "Economic impact",
    defaultThreshold: "Direkte und indirekte Kosten > 100 000 EUR",
  },
];

/** Messwerte je Vorfall (ADR-0010 Nr. 2) — Zahlen und benannte Indikatoren. */
export interface IncidentMeasurements {
  clientsAffectedCount: number | null;
  clientsAffectedPercent: number | null;
  counterpartsAffectedPercent: number | null;
  transactionsCount: number | null;
  transactionsValueEur: number | null;
  transactionsPercentOfDaily: number | null;
  reputationMediaCoverage: boolean;
  reputationComplaints: boolean;
  reputationClientLoss: boolean;
  durationHours: number | null;
  serviceDowntimeHours: number | null;
  memberStatesAffected: number | null;
  dataLossAvailability: boolean;
  dataLossIntegrity: boolean;
  dataLossConfidentiality: boolean;
  dataLossAuthenticity: boolean;
  criticalServicesAffected: boolean;
  economicImpactEur: number | null;
}

export const EMPTY_MEASUREMENTS: IncidentMeasurements = {
  clientsAffectedCount: null,
  clientsAffectedPercent: null,
  counterpartsAffectedPercent: null,
  transactionsCount: null,
  transactionsValueEur: null,
  transactionsPercentOfDaily: null,
  reputationMediaCoverage: false,
  reputationComplaints: false,
  reputationClientLoss: false,
  durationHours: null,
  serviceDowntimeHours: null,
  memberStatesAffected: null,
  dataLossAvailability: false,
  dataLossIntegrity: false,
  dataLossConfidentiality: false,
  dataLossAuthenticity: false,
  criticalServicesAffected: false,
  economicImpactEur: null,
};

/**
 * Zentrale Schwellwerte (Arbeitswerte, TODO(verify) gegen DelVO (EU)
 * 2024/1772; Pflege ist eine Codeänderung mit Testabdeckung).
 */
export const CLASSIFICATION_THRESHOLDS = {
  clientsCount: 100_000,
  clientsPercent: 10,
  counterpartsPercent: 30,
  transactionsPercent: 10,
  durationHours: 24,
  downtimeHours: 2,
  memberStates: 2,
  economicEur: 100_000,
} as const;

export interface CriterionResult {
  key: string;
  criterion: string;
  threshold: string;
  actualValue: string;
  met: boolean;
  rationale: string;
}

const fmt = (n: number | null, unit = ""): string => (n === null ? "–" : `${n}${unit}`);

/** Leitet je Kriterium „erfüllt" aus den Messwerten ab (reine Funktion). */
export function evaluateCriteria(
  m: IncidentMeasurements,
  rationales: Partial<Record<string, string>> = {},
  t = CLASSIFICATION_THRESHOLDS,
): CriterionResult[] {
  const defs = new Map(CLASSIFICATION_CRITERIA.map((c) => [c.key, c]));
  const mk = (key: string, met: boolean, actualValue: string): CriterionResult => {
    const def = defs.get(key)!;
    return {
      key,
      criterion: def.de,
      threshold: def.defaultThreshold,
      actualValue,
      met,
      rationale: rationales[key] ?? "",
    };
  };

  const dataLossGoals = [
    m.dataLossAvailability ? "Verfügbarkeit" : null,
    m.dataLossIntegrity ? "Integrität" : null,
    m.dataLossConfidentiality ? "Vertraulichkeit" : null,
    m.dataLossAuthenticity ? "Authentizität" : null,
  ].filter((g): g is string => g !== null);
  const reputationIndicators = [
    m.reputationMediaCoverage ? "Medien" : null,
    m.reputationComplaints ? "Beschwerden" : null,
    m.reputationClientLoss ? "Kundenabwanderung" : null,
  ].filter((g): g is string => g !== null);

  return [
    mk(
      "CLIENTS_TRANSACTIONS",
      (m.clientsAffectedCount ?? 0) > t.clientsCount ||
        (m.clientsAffectedPercent ?? 0) > t.clientsPercent ||
        (m.counterpartsAffectedPercent ?? 0) > t.counterpartsPercent ||
        (m.transactionsPercentOfDaily ?? 0) > t.transactionsPercent,
      `Kunden ${fmt(m.clientsAffectedCount)} (${fmt(m.clientsAffectedPercent, " %")}), Gegenparteien ${fmt(m.counterpartsAffectedPercent, " %")}, Transaktionen ${fmt(m.transactionsCount)} / ${fmt(m.transactionsValueEur, " EUR")} (${fmt(m.transactionsPercentOfDaily, " %")})`,
    ),
    mk(
      "REPUTATION",
      reputationIndicators.length > 0,
      reputationIndicators.length > 0 ? reputationIndicators.join(", ") : "–",
    ),
    mk(
      "DURATION",
      (m.durationHours ?? 0) > t.durationHours || (m.serviceDowntimeHours ?? 0) > t.downtimeHours,
      `Dauer ${fmt(m.durationHours, " h")}, Dienstausfall ${fmt(m.serviceDowntimeHours, " h")}`,
    ),
    mk(
      "GEO",
      (m.memberStatesAffected ?? 0) >= t.memberStates,
      `${fmt(m.memberStatesAffected)} Mitgliedstaat(en)`,
    ),
    mk(
      "DATA_LOSS",
      dataLossGoals.length > 0,
      dataLossGoals.length > 0 ? dataLossGoals.join(", ") : "–",
    ),
    mk(
      "CRITICAL_SERVICES",
      m.criticalServicesAffected,
      m.criticalServicesAffected ? "CIF-gestützte Dienste betroffen" : "–",
    ),
    mk("ECONOMIC", (m.economicImpactEur ?? 0) > t.economicEur, fmt(m.economicImpactEur, " EUR")),
  ];
}

/** Altschlüssel (Review v3, 8 Kriterien) auf die sieben DelVO-Schlüssel. */
const LEGACY_KEY_MAP: Record<string, string> = {
  CLIENTS: "CLIENTS_TRANSACTIONS",
  TRANSACTIONS: "CLIENTS_TRANSACTIONS",
};

/**
 * Major-Regel (Auftrag Welle 6, ADR-0010 Nr. 3):
 * Kritikalität erfüllt UND (Datenverlust ODER mindestens zwei weitere
 * Kriterien erfüllt). Bestandsdaten mit Altschlüsseln werden normalisiert.
 */
export function deriveIsMajor(results: Pick<CriterionResult, "key" | "met">[]): boolean {
  const met = new Set(results.filter((r) => r.met).map((r) => LEGACY_KEY_MAP[r.key] ?? r.key));
  if (!met.has("CRITICAL_SERVICES")) return false;
  const others = new Set([...met].filter((k) => k !== "CRITICAL_SERVICES"));
  return others.has("DATA_LOSS") || others.size >= 2;
}

// ---------------------------------------------------------------
// Aggregation wiederkehrender Vorfälle (ADR-0010 Nr. 4)
// ---------------------------------------------------------------

const SIX_MONTHS_MS = 183 * 24 * 3_600_000;

export interface RecurringIncidentInput {
  incidentRef: string;
  occurredAt: Date;
  measurements: IncidentMeasurements;
}

export interface RecurringAggregation {
  /** In das Sechs-Monats-Fenster fallende Vorfälle (Referenzen). */
  consideredRefs: string[];
  combined: IncidentMeasurements;
  results: CriterionResult[];
  /** Aggregat gilt als schwerwiegender Vorfall (nur bei >= 2 Vorfällen). */
  isMajor: boolean;
}

const sum = (a: number | null, b: number | null): number | null =>
  a === null && b === null ? null : (a ?? 0) + (b ?? 0);
const max = (a: number | null, b: number | null): number | null =>
  a === null && b === null ? null : Math.max(a ?? 0, b ?? 0);

/**
 * Kumuliert wiederkehrende Vorfälle GLEICHER URSACHE (Gruppierung durch die
 * Anwender) innerhalb von sechs Monaten vor `now` und bewertet das Aggregat
 * gegen dieselben Kriterien: Zählwerte/Kosten/Dauer summiert, Prozentwerte
 * und geografische Ausbreitung maximiert, Indikatoren verodert.
 * Vereinfachung der RTS-Art.-8-Abs.-2-Logik — TODO(verify).
 */
export function aggregateRecurring(
  incidents: RecurringIncidentInput[],
  now: Date,
): RecurringAggregation {
  const windowStart = now.getTime() - SIX_MONTHS_MS;
  const considered = incidents.filter(
    (i) => i.occurredAt.getTime() >= windowStart && i.occurredAt.getTime() <= now.getTime(),
  );
  const combined = considered.reduce<IncidentMeasurements>(
    (acc, i) => ({
      clientsAffectedCount: sum(acc.clientsAffectedCount, i.measurements.clientsAffectedCount),
      clientsAffectedPercent: max(
        acc.clientsAffectedPercent,
        i.measurements.clientsAffectedPercent,
      ),
      counterpartsAffectedPercent: max(
        acc.counterpartsAffectedPercent,
        i.measurements.counterpartsAffectedPercent,
      ),
      transactionsCount: sum(acc.transactionsCount, i.measurements.transactionsCount),
      transactionsValueEur: sum(acc.transactionsValueEur, i.measurements.transactionsValueEur),
      transactionsPercentOfDaily: max(
        acc.transactionsPercentOfDaily,
        i.measurements.transactionsPercentOfDaily,
      ),
      reputationMediaCoverage:
        acc.reputationMediaCoverage || i.measurements.reputationMediaCoverage,
      reputationComplaints: acc.reputationComplaints || i.measurements.reputationComplaints,
      reputationClientLoss: acc.reputationClientLoss || i.measurements.reputationClientLoss,
      durationHours: sum(acc.durationHours, i.measurements.durationHours),
      serviceDowntimeHours: sum(acc.serviceDowntimeHours, i.measurements.serviceDowntimeHours),
      memberStatesAffected: max(acc.memberStatesAffected, i.measurements.memberStatesAffected),
      dataLossAvailability: acc.dataLossAvailability || i.measurements.dataLossAvailability,
      dataLossIntegrity: acc.dataLossIntegrity || i.measurements.dataLossIntegrity,
      dataLossConfidentiality:
        acc.dataLossConfidentiality || i.measurements.dataLossConfidentiality,
      dataLossAuthenticity: acc.dataLossAuthenticity || i.measurements.dataLossAuthenticity,
      criticalServicesAffected:
        acc.criticalServicesAffected || i.measurements.criticalServicesAffected,
      economicImpactEur: sum(acc.economicImpactEur, i.measurements.economicImpactEur),
    }),
    { ...EMPTY_MEASUREMENTS },
  );
  const results = evaluateCriteria(combined);
  return {
    consideredRefs: considered.map((i) => i.incidentRef),
    combined,
    results,
    isMajor: considered.length >= 2 && deriveIsMajor(results),
  };
}

/** Rohe Messwerte tolerant aus der Persistierung lesen (JSON, ADR-0010 Nr. 2). */
export function parseMeasurements(json: string | null): IncidentMeasurements | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Partial<IncidentMeasurements>;
    return { ...EMPTY_MEASUREMENTS, ...raw };
  } catch {
    return null;
  }
}
