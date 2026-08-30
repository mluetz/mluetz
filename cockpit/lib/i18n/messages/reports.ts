import type { Locale } from "@/lib/i18n/config";
import type { ReportKey } from "@/features/reports/report-defs";

/**
 * Übersetzungen des Reports-Moduls (Reportliste, Report-Renderer, Buttons).
 * Muster wie chrome.ts: `de` ist die Referenz, `en` wird über den Typ erzwungen.
 * Die deutschen Texte sind zeichengenau aus den Komponenten übernommen.
 */

interface ReportDefText {
  title: string;
  description: string;
}

const de = {
  list: {
    title: "Reports",
    description: "Serverseitig generierte, druckoptimierte Berichte und CSV-Direktexporte",
    sectionTypes: "Berichtstypen",
    sectionCsv: "Direkt-Exporte (CSV)",
    sectionGenerated: "Erzeugte Reports",
    csv: {
      risks: "Risiken (CSV)",
      actions: "Maßnahmen (CSV)",
      controls: "Kontrollen (CSV)",
      thirdParties: "Drittparteien (CSV)",
      compliance: "Compliance-Mappings (CSV)",
    },
    table: {
      type: "Typ",
      title: "Titel",
      effectiveDate: "Stichtag",
      createdBy: "Ersteller",
      createdAt: "Erstellt am",
    },
    empty: "Noch keine Reports erzeugt.",
  },
  defs: {
    EXECUTIVE_SUMMARY: {
      title: "Executive Summary",
      description:
        "Management-Überblick: zentrale KPIs des Risikoregisters und die Top-10-Risiken nach Residual-Score.",
    },
    TOP_RISKS: {
      title: "Top-Risiken",
      description:
        "Die zehn höchsten Risiken nach Residual-Score mit Bewertung, Klasse und Strategie.",
    },
    ABOVE_APPETITE: {
      title: "Risiken über Risikoappetit",
      description:
        "Alle Risiken, deren Residual-Score den festgelegten Risikoappetit überschreitet.",
    },
    OVERDUE_ACTIONS: {
      title: "Überfällige Maßnahmen",
      description:
        "Alle offenen Maßnahmen mit überschrittener Fälligkeit inkl. Verzugstagen und Eskalationsstufe.",
    },
    ACCEPTANCES: {
      title: "Risikoakzeptanzen",
      description: "Alle Risikoakzeptanzen mit Status, Antragsteller, Genehmiger und Befristung.",
    },
    TPRM_OVERVIEW: {
      title: "Third-Party-Überblick",
      description:
        "Drittparteien mit Kritikalität, Residual-Score, Due-Diligence- und Exit-Status.",
    },
    ROI_CONCENTRATION: {
      title: "IKT-Konzentrationsanalyse",
      description:
        "Mehrstufige Konzentrationsanalytik über den Registerbestand: Exponierung je Dienstleister, Kettenkonzentration über unabhängige Direktanbieter, geografische Verteilung mit Drittstaatenkennzeichen, CTPP-Exponierung mit Listenabgleich.",
    },
    DORA_READINESS: {
      title: "DORA Readiness",
      description:
        "Umsetzungsstand der DORA- und DORA-RTS/ITS-Anforderungen inkl. Statusverteilung.",
    },
    CONTROL_EFFECTIVENESS: {
      title: "Kontrollwirksamkeit",
      description:
        "Design- und operative Wirksamkeit aller Kontrollen inkl. letztem Test und Verteilung.",
    },
    QUALITY_REVIEW: {
      title: "Quality Reviews",
      description:
        "Ergebnisse der Qualitätsprüfungen (Vier-Augen-Prinzip) inkl. Durchschnittsscore.",
    },
    TREND: {
      title: "Trend (12 Monate)",
      description: "Monatliche Entwicklung der Risikobewertungen der letzten zwölf Monate.",
    },
    DECISION_PAPER: {
      title: "Entscheidungsvorlage",
      description:
        "Vorlage für Management-Entscheidungen: offene Akzeptanzanträge, Risiken über Appetit ohne aktive Behandlung, Eskalationen.",
    },
  } satisfies Record<ReportKey, ReportDefText> as Record<ReportKey, ReportDefText>,
  meta: {
    report: "Bericht",
    effectiveDate: "Stichtag",
    author: "Ersteller",
    generatedAt: "Generiert am",
    appliedFilters: "Angewandte Filter",
    filtersAll: "alle",
  },
  common: {
    noData: "Keine Daten vorhanden.",
    yes: "ja",
    no: "nein",
  },
  riskTable: {
    riskId: "Risiko-ID",
    title: "Titel",
    category: "Kategorie",
    owner: "Owner",
    inherent: "Inherent",
    residual: "Residual",
    riskClass: "Klasse",
    status: "Status",
    strategy: "Strategie",
  },
  executiveSummary: {
    kpiHeading: "Kennzahlen",
    openRisks: "Offene Risiken",
    highCritical: "High / Critical (Residual)",
    aboveAppetite: "Über Risikoappetit",
    overdueReviews: "Überfällige Reviews",
    openActions: "Offene Maßnahmen",
    overdueActions: "Überfällige Maßnahmen",
    openAcceptances: "Offene Akzeptanzanträge",
    ineffectiveControls: "Unwirksame Kontrollen",
    criticalThirdParties: "Kritische Drittparteien",
    topHeading: "Top-10-Risiken nach Residual-Score",
    emptyRisks: "Keine bewerteten Risiken.",
  },
  topRisks: {
    empty: "Keine bewerteten Risiken vorhanden.",
  },
  aboveAppetite: {
    empty: "Kein Risiko überschreitet derzeit den Risikoappetit.",
  },
  overdueActions: {
    actionId: "Maßnahmen-ID",
    title: "Titel",
    owner: "Owner",
    dueDate: "Fälligkeit",
    daysOverdue: "Verzugstage",
    escalationLevel: "Eskalationsstufe",
    risk: "Risiko",
    empty: "Keine überfälligen Maßnahmen.",
  },
  acceptances: {
    risk: "Risiko",
    status: "Status",
    requestedBy: "Antragsteller",
    approvedBy: "Genehmiger",
    validUntil: "Befristet bis",
    compensatingControls: "Kompensierende Kontrollen",
    empty: "Keine Risikoakzeptanzen vorhanden.",
  },
  roiConc: {
    kpiCifServices: "CIF-gestützte Dienstleistungen",
    kpiThirdCountry: "Drittstaaten mit Datenhaltung",
    kpiCrossChain: "Kettenglieder unter mehreren Direktanbietern",
    exposureTitle: "Exponierung je Dienstleister",
    provider: "Dienstleister",
    cifContracts: "CIF-Verträge",
    cifServices: "CIF-Dienstleistungen",
    functions: "Betroffene Funktionen",
    share: "Anteil an allen CIF-Diensten",
    chainTitle: "Kettenkonzentration (mehrere unabhängige Direktanbieter)",
    chainMember: "Kettenglied",
    country: "Land",
    directProviders: "Direktanbieter",
    providesCif: "Erbringt CIF-Dienst",
    chainEmpty: "Kein Subdienstleister tritt unter mehreren Direktanbietern auf.",
    geoTitle: "Geografische Konzentration (Speicher-/Verarbeitungsorte)",
    storage: "Speicherort (Dienste)",
    processing: "Verarbeitungsort (Dienste)",
    cifCol: "davon CIF",
    thirdCountry: "Drittstaat",
    ctppTitle: "CTPP-Exponierung (Abgleich amtliche Liste)",
    ctppMatch: {
      CONFIRMED: "Bestätigt (Kennzeichen + Liste)",
      FLAGGED_ONLY: "Nur im Cockpit gekennzeichnet",
      LISTED_ONLY: "Nur auf der Liste (Kennzeichen fehlt)",
    } as Record<string, string>,
    ctppEmpty: "Keine CTPP-Exponierung erfasst.",
    ctppListHint: (version: string) =>
      version === "ungepflegt"
        ? "Hinweis: Die amtliche CTPP-Liste ist noch nicht eingepflegt (lib/content/ctpp-list.ts) — angezeigt werden nur die im Cockpit gekennzeichneten CTPPs."
        : `CTPP-Listenstand: ${version}`,
    yes: "Ja",
    no: "Nein",
  },
  tprm: {
    criticalThirdParties: "Kritische Drittparteien",
    concentrationRisks: "Konzentrationsrisiken",
    missingExit: "Fehlende Exit-Strategien (kritische Funktion)",
    tpId: "TP-ID",
    name: "Name",
    status: "Status",
    criticality: "Kritikalität",
    residual: "Residual",
    dueDiligence: "Due Diligence",
    nextReview: "Nächstes Review",
    concentration: "Konzentration",
    exitStatus: "Exit-Status",
    empty: "Keine Drittparteien vorhanden.",
  },
  dora: {
    indexHeading: "DORA Resilience Index (Anforderungskatalog FRWK-DORA-001)",
    totalIndex: "Gesamtindex:",
    statusLabel: "Status:",
    openKnockoutsLabel: "Offene Knockouts:",
    lights: { GREEN: "GRÜN", YELLOW: "GELB", RED: "ROT" },
    chapter: "Kapitel",
    chapterAbbrev: "Kap.",
    articles: "Artikel",
    weight: "Gewicht",
    score: "Score",
    status: "Status",
    assessed: "Bewertet",
    openKnockouts: "Offene Knockouts",
    methodology:
      "Methodik: Gewichte MUSS 3 / SOLL 2 / KANN 1; Nachweissperre begrenzt unbelegte Bewertungen auf Reifegrad 2; Knockouts (Reifegrad < 3) setzen das Kapitel auf ROT.",
    statusDistribution: "Statusverteilung",
    refId: "Ref-ID",
    framework: "Framework",
    requirement: "Anforderung",
    justification: "Begründung",
    owner: "Owner",
    nextReview: "Nächstes Review",
    empty: "Keine DORA-Mappings vorhanden.",
  },
  controls: {
    designDistribution: "Verteilung Design-Wirksamkeit",
    operatingDistribution: "Verteilung operative Wirksamkeit",
    controlId: "Kontroll-ID",
    name: "Name",
    owner: "Owner",
    designEffectiveness: "Design-Wirksamkeit",
    operatingEffectiveness: "Operative Wirksamkeit",
    lastTest: "Letzter Test",
    nextTest: "Nächster Test",
    empty: "Keine Kontrollen vorhanden.",
  },
  quality: {
    total: "Quality Reviews gesamt",
    completedWithScore: "Mit Score abgeschlossen",
    averageScore: "Durchschnittsscore",
    risk: "Risiko",
    reviewer: "Reviewer",
    outcome: "Ergebnis",
    score: "Score",
    date: "Datum",
    empty: "Keine Quality Reviews vorhanden.",
  },
  trend: {
    month: "Monat",
    assessmentCount: "Anzahl Bewertungen",
    avgResidualScore: "Ø Residual-Score",
  },
  decisionPaper: {
    section1: "1. Offene Akzeptanzanträge",
    section2: "2. Risiken über Risikoappetit ohne aktive Behandlung",
    section3: "3. Eskalationen (Stufe ≥ 2)",
    risk: "Risiko",
    requestedBy: "Antragsteller",
    status: "Status",
    requestedAt: "Beantragt am",
    justification: "Begründung",
    actionId: "Maßnahmen-ID",
    title: "Titel",
    owner: "Owner",
    dueDate: "Fälligkeit",
    escalationLevel: "Eskalationsstufe",
    decision: "Entscheidung:",
    emptyAcceptances: "Keine offenen Akzeptanzanträge.",
    emptyUntreated: "Keine Risiken über Appetit ohne aktive Behandlung.",
    emptyEscalations: "Keine Eskalationen der Stufe 2 oder höher.",
  },
  buttons: {
    print: "Drucken / PDF",
    save: "Als Report speichern",
    saving: "Speichern…",
    saved: "Report gespeichert.",
  },
};

const en: typeof de = {
  list: {
    title: "Reports",
    description: "Server-side generated, print-optimized reports and direct CSV exports",
    sectionTypes: "Report types",
    sectionCsv: "Direct exports (CSV)",
    sectionGenerated: "Generated reports",
    csv: {
      risks: "Risks (CSV)",
      actions: "Actions (CSV)",
      controls: "Controls (CSV)",
      thirdParties: "Third parties (CSV)",
      compliance: "Compliance mappings (CSV)",
    },
    table: {
      type: "Type",
      title: "Title",
      effectiveDate: "As-of date",
      createdBy: "Created by",
      createdAt: "Created at",
    },
    empty: "No reports generated yet.",
  },
  defs: {
    EXECUTIVE_SUMMARY: {
      title: "Executive Summary",
      description:
        "Management overview: key KPIs of the risk register and the top 10 risks by residual score.",
    },
    TOP_RISKS: {
      title: "Top Risks",
      description: "The ten highest risks by residual score with rating, class and strategy.",
    },
    ABOVE_APPETITE: {
      title: "Risks Above Risk Appetite",
      description: "All risks whose residual score exceeds the defined risk appetite.",
    },
    OVERDUE_ACTIONS: {
      title: "Overdue Actions",
      description:
        "All open actions past their due date, including days overdue and escalation level.",
    },
    ACCEPTANCES: {
      title: "Risk Acceptances",
      description: "All risk acceptances with status, requester, approver and expiry.",
    },
    TPRM_OVERVIEW: {
      title: "Third-Party Overview",
      description: "Third parties with criticality, residual score, due diligence and exit status.",
    },
    ROI_CONCENTRATION: {
      title: "ICT concentration analysis",
      description:
        "Multi-level concentration analytics over the register: provider exposure, chain concentration across independent direct providers, geographic distribution with third-country flag, CTPP exposure with list reconciliation.",
    },
    DORA_READINESS: {
      title: "DORA Readiness",
      description:
        "Implementation status of the DORA and DORA RTS/ITS requirements, including status distribution.",
    },
    CONTROL_EFFECTIVENESS: {
      title: "Control Effectiveness",
      description:
        "Design and operating effectiveness of all controls, including last test and distribution.",
    },
    QUALITY_REVIEW: {
      title: "Quality Reviews",
      description: "Results of the quality reviews (four-eyes principle), including average score.",
    },
    TREND: {
      title: "Trend (12 Months)",
      description: "Monthly development of risk assessments over the last twelve months.",
    },
    DECISION_PAPER: {
      title: "Decision Paper",
      description:
        "Template for management decisions: open acceptance requests, risks above appetite without active treatment, escalations.",
    },
  },
  meta: {
    report: "Report",
    effectiveDate: "As-of date",
    author: "Author",
    generatedAt: "Generated at",
    appliedFilters: "Applied filters",
    filtersAll: "all",
  },
  common: {
    noData: "No data available.",
    yes: "yes",
    no: "no",
  },
  riskTable: {
    riskId: "Risk ID",
    title: "Title",
    category: "Category",
    owner: "Owner",
    inherent: "Inherent",
    residual: "Residual",
    riskClass: "Class",
    status: "Status",
    strategy: "Strategy",
  },
  executiveSummary: {
    kpiHeading: "Key figures",
    openRisks: "Open risks",
    highCritical: "High / Critical (residual)",
    aboveAppetite: "Above risk appetite",
    overdueReviews: "Overdue reviews",
    openActions: "Open actions",
    overdueActions: "Overdue actions",
    openAcceptances: "Open acceptance requests",
    ineffectiveControls: "Ineffective controls",
    criticalThirdParties: "Critical third parties",
    topHeading: "Top 10 risks by residual score",
    emptyRisks: "No assessed risks.",
  },
  topRisks: {
    empty: "No assessed risks available.",
  },
  aboveAppetite: {
    empty: "No risk currently exceeds the risk appetite.",
  },
  overdueActions: {
    actionId: "Action ID",
    title: "Title",
    owner: "Owner",
    dueDate: "Due date",
    daysOverdue: "Days overdue",
    escalationLevel: "Escalation level",
    risk: "Risk",
    empty: "No overdue actions.",
  },
  acceptances: {
    risk: "Risk",
    status: "Status",
    requestedBy: "Requested by",
    approvedBy: "Approved by",
    validUntil: "Valid until",
    compensatingControls: "Compensating controls",
    empty: "No risk acceptances available.",
  },
  roiConc: {
    kpiCifServices: "CIF-supporting services",
    kpiThirdCountry: "Third countries holding data",
    kpiCrossChain: "Chain links under multiple direct providers",
    exposureTitle: "Provider exposure",
    provider: "Provider",
    cifContracts: "CIF arrangements",
    cifServices: "CIF services",
    functions: "Affected functions",
    share: "Share of all CIF services",
    chainTitle: "Chain concentration (multiple independent direct providers)",
    chainMember: "Chain link",
    country: "Country",
    directProviders: "Direct providers",
    providesCif: "Provides CIF service",
    chainEmpty: "No subcontractor appears under multiple direct providers.",
    geoTitle: "Geographic concentration (storage/processing locations)",
    storage: "Storage location (services)",
    processing: "Processing location (services)",
    cifCol: "of which CIF",
    thirdCountry: "Third country",
    ctppTitle: "CTPP exposure (official list reconciliation)",
    ctppMatch: {
      CONFIRMED: "Confirmed (flag + list)",
      FLAGGED_ONLY: "Flagged in the cockpit only",
      LISTED_ONLY: "Listed only (flag missing)",
    } as Record<string, string>,
    ctppEmpty: "No CTPP exposure recorded.",
    ctppListHint: (version: string) =>
      version === "ungepflegt"
        ? "Note: the official CTPP list has not been maintained yet (lib/content/ctpp-list.ts) — only providers flagged in the cockpit are shown."
        : `CTPP list version: ${version}`,
    yes: "Yes",
    no: "No",
  },
  tprm: {
    criticalThirdParties: "Critical third parties",
    concentrationRisks: "Concentration risks",
    missingExit: "Missing exit strategies (critical function)",
    tpId: "TP ID",
    name: "Name",
    status: "Status",
    criticality: "Criticality",
    residual: "Residual",
    dueDiligence: "Due diligence",
    nextReview: "Next review",
    concentration: "Concentration",
    exitStatus: "Exit status",
    empty: "No third parties available.",
  },
  dora: {
    indexHeading: "DORA Resilience Index (requirements catalog FRWK-DORA-001)",
    totalIndex: "Overall index:",
    statusLabel: "Status:",
    openKnockoutsLabel: "Open knockouts:",
    lights: { GREEN: "GREEN", YELLOW: "YELLOW", RED: "RED" },
    chapter: "Chapter",
    chapterAbbrev: "Ch.",
    articles: "Articles",
    weight: "Weight",
    score: "Score",
    status: "Status",
    assessed: "Assessed",
    openKnockouts: "Open knockouts",
    methodology:
      "Methodology: weights MUST 3 / SHOULD 2 / MAY 1; the evidence gate caps unevidenced assessments at maturity level 2; knockouts (maturity level < 3) set the chapter to RED.",
    statusDistribution: "Status distribution",
    refId: "Ref ID",
    framework: "Framework",
    requirement: "Requirement",
    justification: "Justification",
    owner: "Owner",
    nextReview: "Next review",
    empty: "No DORA mappings available.",
  },
  controls: {
    designDistribution: "Design effectiveness distribution",
    operatingDistribution: "Operating effectiveness distribution",
    controlId: "Control ID",
    name: "Name",
    owner: "Owner",
    designEffectiveness: "Design effectiveness",
    operatingEffectiveness: "Operating effectiveness",
    lastTest: "Last test",
    nextTest: "Next test",
    empty: "No controls available.",
  },
  quality: {
    total: "Quality reviews total",
    completedWithScore: "Completed with score",
    averageScore: "Average score",
    risk: "Risk",
    reviewer: "Reviewer",
    outcome: "Outcome",
    score: "Score",
    date: "Date",
    empty: "No quality reviews available.",
  },
  trend: {
    month: "Month",
    assessmentCount: "Number of assessments",
    avgResidualScore: "Avg. residual score",
  },
  decisionPaper: {
    section1: "1. Open acceptance requests",
    section2: "2. Risks above risk appetite without active treatment",
    section3: "3. Escalations (level ≥ 2)",
    risk: "Risk",
    requestedBy: "Requested by",
    status: "Status",
    requestedAt: "Requested at",
    justification: "Justification",
    actionId: "Action ID",
    title: "Title",
    owner: "Owner",
    dueDate: "Due date",
    escalationLevel: "Escalation level",
    decision: "Decision:",
    emptyAcceptances: "No open acceptance requests.",
    emptyUntreated: "No risks above appetite without active treatment.",
    emptyEscalations: "No escalations of level 2 or higher.",
  },
  buttons: {
    print: "Print / PDF",
    save: "Save as report",
    saving: "Saving…",
    saved: "Report saved.",
  },
};

export const REPORTS_MESSAGES: Record<Locale, typeof de> = { de, en };

export type ReportsMessages = typeof de;
