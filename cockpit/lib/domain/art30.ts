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
  {
    key: "ART30_2_A",
    ref: "Art. 30 Abs. 2 lit. a",
    cifOnly: false,
    de: "Klare, vollständige Beschreibung aller Funktionen und IKT-Dienstleistungen",
    en: "Clear and complete description of all functions and ICT services",
  },
  {
    key: "ART30_2_B",
    ref: "Art. 30 Abs. 2 lit. b",
    cifOnly: false,
    de: "Orte der Leistungserbringung und der Datenverarbeitung (Regionen/Länder), Meldepflicht bei Änderung",
    en: "Locations of service provision and data processing; notification of changes",
  },
  {
    key: "ART30_2_C",
    ref: "Art. 30 Abs. 2 lit. c",
    cifOnly: false,
    de: "Verfügbarkeit, Authentizität, Integrität und Vertraulichkeit der Daten",
    en: "Availability, authenticity, integrity and confidentiality of data",
  },
  {
    key: "ART30_2_D",
    ref: "Art. 30 Abs. 2 lit. d",
    cifOnly: false,
    de: "Zugang, Rückgabe und Wiederherstellung der Daten bei Insolvenz/Ausfall/Beendigung",
    en: "Access, recovery and return of data on insolvency, failure or termination",
  },
  {
    key: "ART30_2_E",
    ref: "Art. 30 Abs. 2 lit. e",
    cifOnly: false,
    de: "Leistungsbeschreibungen einschließlich vollständiger SLA-Aktualisierungen",
    en: "Service level descriptions including updates and revisions",
  },
  {
    key: "ART30_2_F",
    ref: "Art. 30 Abs. 2 lit. f",
    cifOnly: false,
    de: "Unterstützung bei IKT-Vorfällen ohne zusätzliche Kosten oder mit Ex-ante-Kostenregelung",
    en: "Assistance in ICT incidents at no additional or pre-agreed cost",
  },
  {
    key: "ART30_2_G",
    ref: "Art. 30 Abs. 2 lit. g",
    cifOnly: false,
    de: "Zusammenarbeit mit den zuständigen Behörden",
    en: "Cooperation with competent authorities",
  },
  {
    key: "ART30_2_H",
    ref: "Art. 30 Abs. 2 lit. h",
    cifOnly: false,
    de: "Kündigungsrechte und Mindestkündigungsfristen",
    en: "Termination rights and minimum notice periods",
  },
  // Welle 4 (ADR-0008 Nr. 2): lit. i ergänzt. TODO(verify): Wortlaut gegen
  // den Verordnungstext prüfen.
  {
    key: "ART30_2_I",
    ref: "Art. 30 Abs. 2 lit. i",
    cifOnly: false,
    de: "Bedingungen der Mitwirkung an Sensibilisierungsprogrammen und Schulungen zur digitalen Resilienz",
    en: "Conditions for participation in security awareness programmes and digital operational resilience training",
  },
  {
    key: "ART30_3_A",
    ref: "Art. 30 Abs. 3 lit. a",
    cifOnly: true,
    de: "Vollständige SLA mit präzisen quantitativen und qualitativen Leistungszielen",
    en: "Full SLAs with precise quantitative and qualitative performance targets",
  },
  {
    key: "ART30_3_B",
    ref: "Art. 30 Abs. 3 lit. b",
    cifOnly: true,
    de: "Meldepflichten des Dienstleisters bei Entwicklungen mit wesentlicher Auswirkung",
    en: "Provider notice periods and reporting obligations for material developments",
  },
  {
    key: "ART30_3_C",
    ref: "Art. 30 Abs. 3 lit. c",
    cifOnly: true,
    de: "Notfallpläne, Sicherheitsmaßnahmen, Tests und deren Umsetzung beim Dienstleister",
    en: "Provider contingency plans, security measures and testing",
  },
  {
    key: "ART30_3_D",
    ref: "Art. 30 Abs. 3 lit. d",
    cifOnly: true,
    de: "Mitwirkung an TLPT nach Art. 26/27 sowie Schulungs- und Sensibilisierungsprogrammen",
    en: "Participation in TLPT (Art. 26/27) and awareness programmes",
  },
  {
    key: "ART30_3_E",
    ref: "Art. 30 Abs. 3 lit. e",
    cifOnly: true,
    de: "Uneingeschränkte Zugangs-, Inspektions- und Auditrechte (auch für Behörden)",
    en: "Unrestricted access, inspection and audit rights (including authorities)",
  },
  {
    key: "ART30_3_F",
    ref: "Art. 30 Abs. 3 lit. f",
    cifOnly: true,
    de: "Vereinbarte Ausstiegsstrategien und angemessene Übergangsfristen",
    en: "Agreed exit strategies and adequate transition periods",
  },
  {
    key: "ART30_3_G",
    ref: "Art. 30 Abs. 3 lit. g",
    cifOnly: true,
    de: "Pflicht zur Mitwirkung an der Vorab- und laufenden Bewertung (inkl. Weiterverlagerung)",
    en: "Obligation to support pre- and ongoing assessment (incl. subcontracting)",
  },
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

/**
 * Abgeleitete Vertragskennzeichen (Welle 4, ADR-0008 Nr. 6): ersetzen die
 * entfernten Booleans am Contract. Cockpit-Konvention der Zuordnung:
 * Auditrechte <- Abs. 3 lit. e, Zugangs-/Rückgaberechte <- Abs. 2 lit. d,
 * Incident-Unterstützung/-Meldung <- Abs. 2 lit. f.
 */
export function deriveContractFlags(statuses: Map<string, ClauseStatus>): {
  auditRights: boolean;
  accessRights: boolean;
  incidentReporting: boolean;
} {
  const ok = (key: string) => statuses.get(key) === "FULFILLED";
  return {
    auditRights: ok("ART30_3_E"),
    accessRights: ok("ART30_2_D"),
    incidentReporting: ok("ART30_2_F"),
  };
}

// ---------------------------------------------------------------
// Lückenbericht (Welle 4, ADR-0008 Nr. 5) — reine Funktionen
// ---------------------------------------------------------------

export interface GapContractInput {
  contractId: string;
  contractRef: string | null;
  title: string;
  thirdPartyId: string;
  tpId: string;
  isCif: boolean;
  /** clauseKey -> Status; nicht bewertete Pflichtklauseln gelten als MISSING. */
  statuses: Map<string, ClauseStatus>;
  /** clauseKey -> verknüpfte Maßnahme (actionId), falls vorhanden. */
  linkedActions?: Map<string, string>;
}

export interface ContractGap {
  clauseKey: string;
  ref: string;
  status: ClauseStatus; // MISSING oder PARTIAL
  linkedActionId: string | null;
}

export interface ContractGapReport {
  contractId: string;
  contractRef: string | null;
  title: string;
  thirdPartyId: string;
  tpId: string;
  isCif: boolean;
  rag: "GREEN" | "YELLOW" | "RED";
  gaps: ContractGap[];
}

export interface AggregatedClauseGap {
  clauseKey: string;
  ref: string;
  cifOnly: boolean;
  /** Anzahl CIF-gestützter Verträge mit MISSING bzw. PARTIAL. */
  missing: number;
  partial: number;
  contractRefs: string[];
}

export interface Art30GapReport {
  perContract: ContractGapReport[];
  /** Aggregation über alle CIF-gestützten Verträge, nur Klauseln mit Lücken. */
  aggregatedCif: AggregatedClauseGap[];
}

export function art30GapReport(contracts: GapContractInput[]): Art30GapReport {
  const perContract: ContractGapReport[] = contracts.map((c) => {
    const gaps: ContractGap[] = [];
    for (const clause of requiredClausesFor(c.isCif)) {
      const status = c.statuses.get(clause.key) ?? "MISSING";
      if (status === "MISSING" || status === "PARTIAL") {
        gaps.push({
          clauseKey: clause.key,
          ref: clause.ref,
          status,
          linkedActionId: c.linkedActions?.get(clause.key) ?? null,
        });
      }
    }
    return {
      contractId: c.contractId,
      contractRef: c.contractRef,
      title: c.title,
      thirdPartyId: c.thirdPartyId,
      tpId: c.tpId,
      isCif: c.isCif,
      rag: contractComplianceRag(c.isCif, c.statuses),
      gaps,
    };
  });

  const byClause = new Map<string, AggregatedClauseGap>();
  for (const report of perContract) {
    if (!report.isCif) continue;
    for (const gap of report.gaps) {
      const clause = ART30_CLAUSES.find((cl) => cl.key === gap.clauseKey)!;
      const agg = byClause.get(gap.clauseKey) ?? {
        clauseKey: gap.clauseKey,
        ref: gap.ref,
        cifOnly: clause.cifOnly,
        missing: 0,
        partial: 0,
        contractRefs: [],
      };
      if (gap.status === "MISSING") agg.missing += 1;
      else agg.partial += 1;
      agg.contractRefs.push(report.contractRef ?? report.title);
      byClause.set(gap.clauseKey, agg);
    }
  }

  return {
    perContract,
    aggregatedCif: [...byClause.values()].sort(
      (a, b) =>
        b.missing + b.partial - (a.missing + a.partial) || a.clauseKey.localeCompare(b.clauseKey),
    ),
  };
}
