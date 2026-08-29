/**
 * Klassifizierungskriterien schwerwiegender IKT-Vorfälle nach Art. 18 DORA
 * i. V. m. RTS (EU) 2025/301 (Review v3, P1-04).
 *
 * Ableitungsregel (dokumentierte Vereinfachung der RTS-Logik; vor
 * produktivem Einsatz gegen den verbindlichen RTS-Text verifizieren):
 * "schwerwiegend", wenn
 *   (a) das Kriterium "Kritikalität der betroffenen Dienste" erfüllt ist
 *       UND mindestens ein weiteres Kriterium erfüllt ist, ODER
 *   (b) mindestens drei Kriterien erfüllt sind.
 */

export interface ClassificationCriterion {
  key: string;
  de: string;
  en: string;
  defaultThreshold: string;
}

export const CLASSIFICATION_CRITERIA: ClassificationCriterion[] = [
  { key: "CLIENTS", de: "Betroffene Kunden und Finanzkontrahenten", en: "Clients and financial counterparts affected", defaultThreshold: "> 10 % der Kunden oder > 100 000 Kunden" },
  { key: "TRANSACTIONS", de: "Betroffene Transaktionen (Anzahl/Volumen)", en: "Transactions affected (count/value)", defaultThreshold: "> 10 % des täglichen Transaktionsvolumens" },
  { key: "REPUTATION", de: "Reputationsauswirkung", en: "Reputational impact", defaultThreshold: "Medienberichterstattung / Beschwerden / Kundenabwanderung" },
  { key: "DURATION", de: "Dauer und Ausfallzeit", en: "Duration and service downtime", defaultThreshold: "Dauer > 24 h oder Ausfallzeit > 2 h bei kritischen Diensten" },
  { key: "GEO", de: "Geografische Ausbreitung", en: "Geographical spread", defaultThreshold: "Auswirkungen in >= 2 Mitgliedstaaten" },
  { key: "DATA_LOSS", de: "Datenverluste (Verfügbarkeit/Integrität/Vertraulichkeit/Authentizität)", en: "Data losses (availability/integrity/confidentiality/authenticity)", defaultThreshold: "Jede Auswirkung auf Daten mit wesentlicher Folge für die Entität" },
  { key: "CRITICAL_SERVICES", de: "Kritikalität der betroffenen Dienste (CIF-Bezug)", en: "Criticality of services affected (CIF)", defaultThreshold: "IKT-Dienste, die kritische oder wichtige Funktionen stützen, betroffen" },
  { key: "ECONOMIC", de: "Wirtschaftliche Auswirkung", en: "Economic impact", defaultThreshold: "Direkte und indirekte Kosten > 100 000 EUR" },
];

export interface CriterionResult {
  key: string;
  criterion: string;
  threshold: string;
  actualValue: string;
  met: boolean;
  rationale: string;
}

export function deriveIsMajor(results: Pick<CriterionResult, "key" | "met">[]): boolean {
  const metKeys = results.filter((r) => r.met).map((r) => r.key);
  const critical = metKeys.includes("CRITICAL_SERVICES");
  if (critical && metKeys.length >= 2) return true;
  return metKeys.length >= 3;
}
