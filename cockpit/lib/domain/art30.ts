/**
 * Klauselkatalog Art. 30 DORA (Review v3, P1-03).
 * Abs. 2 lit. a–h: Pflichtinhalte ALLER vertraglichen Vereinbarungen.
 * Abs. 3 lit. a–g: zusätzliche Pflichtinhalte für Verträge über
 * IKT-Dienstleistungen zur Unterstützung kritischer oder wichtiger
 * Funktionen (CIF-Verträge).
 */

export interface Art30Clause {
  key: string;
  ref: string;
  cifOnly: boolean;
  de: string;
  en: string;
}

export const ART30_CLAUSES: Art30Clause[] = [
  { key: "ART30_2_A", ref: "Art. 30 Abs. 2 lit. a", cifOnly: false, de: "Klare, vollständige Beschreibung aller Funktionen und IKT-Dienstleistungen", en: "Clear and complete description of all functions and ICT services" },
  { key: "ART30_2_B", ref: "Art. 30 Abs. 2 lit. b", cifOnly: false, de: "Orte der Leistungserbringung und der Datenverarbeitung (Regionen/Länder), Meldepflicht bei Änderung", en: "Locations of service provision and data processing; notification of changes" },
  { key: "ART30_2_C", ref: "Art. 30 Abs. 2 lit. c", cifOnly: false, de: "Verfügbarkeit, Authentizität, Integrität und Vertraulichkeit der Daten", en: "Availability, authenticity, integrity and confidentiality of data" },
  { key: "ART30_2_D", ref: "Art. 30 Abs. 2 lit. d", cifOnly: false, de: "Zugang, Rückgabe und Wiederherstellung der Daten bei Insolvenz/Ausfall/Beendigung", en: "Access, recovery and return of data on insolvency, failure or termination" },
  { key: "ART30_2_E", ref: "Art. 30 Abs. 2 lit. e", cifOnly: false, de: "Leistungsbeschreibungen einschließlich vollständiger SLA-Aktualisierungen", en: "Service level descriptions including updates and revisions" },
  { key: "ART30_2_F", ref: "Art. 30 Abs. 2 lit. f", cifOnly: false, de: "Unterstützung bei IKT-Vorfällen ohne zusätzliche Kosten oder mit Ex-ante-Kostenregelung", en: "Assistance in ICT incidents at no additional or pre-agreed cost" },
  { key: "ART30_2_G", ref: "Art. 30 Abs. 2 lit. g", cifOnly: false, de: "Zusammenarbeit mit den zuständigen Behörden", en: "Cooperation with competent authorities" },
  { key: "ART30_2_H", ref: "Art. 30 Abs. 2 lit. h", cifOnly: false, de: "Kündigungsrechte und Mindestkündigungsfristen", en: "Termination rights and minimum notice periods" },
  { key: "ART30_3_A", ref: "Art. 30 Abs. 3 lit. a", cifOnly: true, de: "Vollständige SLA mit präzisen quantitativen und qualitativen Leistungszielen", en: "Full SLAs with precise quantitative and qualitative performance targets" },
  { key: "ART30_3_B", ref: "Art. 30 Abs. 3 lit. b", cifOnly: true, de: "Meldepflichten des Dienstleisters bei Entwicklungen mit wesentlicher Auswirkung", en: "Provider notice periods and reporting obligations for material developments" },
  { key: "ART30_3_C", ref: "Art. 30 Abs. 3 lit. c", cifOnly: true, de: "Notfallpläne, Sicherheitsmaßnahmen, Tests und deren Umsetzung beim Dienstleister", en: "Provider contingency plans, security measures and testing" },
  { key: "ART30_3_D", ref: "Art. 30 Abs. 3 lit. d", cifOnly: true, de: "Mitwirkung an TLPT nach Art. 26/27 sowie Schulungs- und Sensibilisierungsprogrammen", en: "Participation in TLPT (Art. 26/27) and awareness programmes" },
  { key: "ART30_3_E", ref: "Art. 30 Abs. 3 lit. e", cifOnly: true, de: "Uneingeschränkte Zugangs-, Inspektions- und Auditrechte (auch für Behörden)", en: "Unrestricted access, inspection and audit rights (including authorities)" },
  { key: "ART30_3_F", ref: "Art. 30 Abs. 3 lit. f", cifOnly: true, de: "Vereinbarte Ausstiegsstrategien und angemessene Übergangsfristen", en: "Agreed exit strategies and adequate transition periods" },
  { key: "ART30_3_G", ref: "Art. 30 Abs. 3 lit. g", cifOnly: true, de: "Pflicht zur Mitwirkung an der Vorab- und laufenden Bewertung (inkl. Weiterverlagerung)", en: "Obligation to support pre- and ongoing assessment (incl. subcontracting)" },
];

export const CLAUSE_STATUS = ["FULFILLED", "PARTIAL", "MISSING", "NOT_APPLICABLE"] as const;
export type ClauseStatus = (typeof CLAUSE_STATUS)[number];

export function requiredClausesFor(cifContract: boolean): Art30Clause[] {
  return ART30_CLAUSES.filter((c) => !c.cifOnly || cifContract);
}

/** Ampel je Vertrag: GREEN alle erfüllt/n.a., YELLOW teilweise, RED Pflichtklausel fehlt. */
export function contractComplianceRag(
  cifContract: boolean,
  statuses: Map<string, ClauseStatus>,
): "GREEN" | "YELLOW" | "RED" {
  let yellow = false;
  for (const clause of requiredClausesFor(cifContract)) {
    const s = statuses.get(clause.key) ?? "MISSING";
    if (s === "MISSING") return "RED";
    if (s === "PARTIAL") yellow = true;
  }
  return yellow ? "YELLOW" : "GREEN";
}
