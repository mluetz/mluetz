import type { Locale } from "@/lib/i18n/config";

/** Übersetzungen der Wissensbasis-Oberfläche (Inhalte liegen in lib/content/*). */

const de = {
  page: {
    title: "DORA ISRM Wissensbasis",
    description:
      "Die fünf Kernsäulen der Verordnung (EU) 2022/2554 und das vollständige Handbuch der Gesamtbetrachtung FRWK-DORA-001 (Kapitel 1–15) – aufbereitet für das Informationssicherheits-Risikomanagement einer Bank. Markierte Fachbegriffe sind anklickbar; jede Säule zeigt den eigenen Umsetzungsstand aus dem Anforderungskatalog.",
    crumbOverview: "Overview",
    crumbSelf: "DORA Wissensbasis",
    bannerLead: "Eigener Umsetzungsstand:",
    bannerKnockouts: "offene Knockouts",
    bannerDashboard: "zum DORA-Compliance-Dashboard",
    bannerCatalog: "Anforderungskatalog (133)",
    bannerReport: "DORA-Readiness-Report",
    handbookTitle: "Das vollständige Handbuch (FRWK-DORA-001)",
    handbookDescription:
      "Die Gesamtbetrachtung als navigierbares Handbuch: Kapitel 1–8 und 10–15 in fünf thematischen Teilen, inklusive aller Original-Abbildungen und Tabellen des Dokuments. Kapitel 9 (Anforderungskatalog) ist nicht als Text abgebildet, sondern als interaktives Modul umgesetzt.",
    figureBadgeTitle: (n: number) => `${n} Abbildung(en) aus dem Originaldokument`,
    chapter9Label: "Kap. 9",
    chapter9Title: "Anforderungskatalog – als interaktives Modul",
    chapter9Text:
      "Die 133 Anforderungen der Kapitel II–VI sind nicht als Text, sondern vollständig bewertbar im Katalog umgesetzt – mit Reifegrad, Nachweisen, Crosswalk und Knockout-Logik.",
    excludedNote:
      "Nicht Teil der Wissensbasis: Kap. 16 (Umsetzungsfahrplan) und Kap. 17 (Anhang) – sie betreffen die Projekt- und Dokumentensteuerung des Rahmenwerks.",
    chainsTitle: "Der DORA-Regelkreis: 9 Wirkungsketten",
    chainsDescription:
      "DORA ist als Regelkreis konstruiert – eine Schwäche in einem Kapitel wirkt unmittelbar auf die anderen. Kapitel II ist die zentrale Steuerungsinstanz (FRWK-DORA-001, Kap. 4). Die Ketten 6 und 9 erzeugen in Prüfungen am häufigsten Feststellungen.",
    glossaryTitle: "Glossar – alle Fachbegriffe",
    glossaryDescription: "Alphabetischer Schnellzugriff auf alle in den Texten erklärten Begriffe.",
  },
  pillars: {
    tasksHeading: "Konkrete ISRM-Aufgaben in der Bank",
    cockpitLead: "Im Cockpit:",
    chapterRequirements: "Anforderungen dieses Kapitels",
    scoreTitleKnockouts: (n: number) => `${n} offene Knockout-Anforderungen`,
    scoreTitleDefault: "Umsetzungsstand aus dem Anforderungskatalog",
    light: { GREEN: "GRÜN", YELLOW: "GELB", RED: "ROT" },
  },
  modal: {
    close: "Schließen",
    footer:
      "Kurzdefinition im Bankenkontext – maßgeblich sind die Verordnung (EU) 2022/2554 und die zugehörigen RTS/ITS.",
    explainTerm: (title: string) => `Begriff erklären: ${title}`,
  },
  handbook: {
    figure: "Abbildung",
    zoomTitle: "Abbildung vergrößern",
    cockpitLead: "Im Cockpit umgesetzt:",
    navAria: "Kapitelnavigation",
    sourceNote: (group: string) =>
      `${group} · Quelle: FRWK-DORA-001 v1.0 (Gesamtbetrachtung DORA). Markierte Fachbegriffe sind anklickbar, Abbildungen öffnen per Klick eine Großansicht.`,
    fallbackGroup: "DORA-Handbuch",
  },
};

const en: typeof de = {
  page: {
    title: "DORA ISRM Knowledge Base",
    description:
      "The five core pillars of Regulation (EU) 2022/2554 and the complete handbook of the consolidated framework FRWK-DORA-001 (chapters 1–15) – prepared for a bank's information security risk management. Highlighted terms are clickable; each pillar shows its own implementation status from the requirements catalog.",
    crumbOverview: "Overview",
    crumbSelf: "DORA Knowledge Base",
    bannerLead: "Your implementation status:",
    bannerKnockouts: "open knockouts",
    bannerDashboard: "DORA compliance dashboard",
    bannerCatalog: "Requirements catalog (133)",
    bannerReport: "DORA readiness report",
    handbookTitle: "The complete handbook (FRWK-DORA-001)",
    handbookDescription:
      "The consolidated framework as a navigable handbook: chapters 1–8 and 10–15 in five thematic parts, including all original figures and tables of the document. Chapter 9 (requirements catalog) is not reproduced as text – it is implemented as an interactive module.",
    figureBadgeTitle: (n: number) => `${n} figure(s) from the original document`,
    chapter9Label: "Ch. 9",
    chapter9Title: "Requirements catalog – as an interactive module",
    chapter9Text:
      "The 133 requirements of chapters II–VI are not reproduced as text: they are fully assessable in the catalog – with maturity levels, evidence, crosswalk and knockout logic.",
    excludedNote:
      "Not part of the knowledge base: Ch. 16 (implementation roadmap) and Ch. 17 (annex) – they concern the project and document governance of the framework.",
    chainsTitle: "The DORA control loop: 9 cause-effect chains",
    chainsDescription:
      "DORA is designed as a control loop – a weakness in one chapter directly affects the others. Chapter II is the central steering instance (FRWK-DORA-001, ch. 4). Chains 6 and 9 most frequently produce findings in audits.",
    glossaryTitle: "Glossary – all terms",
    glossaryDescription: "Alphabetical quick access to all terms explained in the texts.",
  },
  pillars: {
    tasksHeading: "Concrete ISRM tasks in the bank",
    cockpitLead: "In the cockpit:",
    chapterRequirements: "Requirements of this chapter",
    scoreTitleKnockouts: (n: number) => `${n} open knockout requirements`,
    scoreTitleDefault: "Implementation status from the requirements catalog",
    light: { GREEN: "GREEN", YELLOW: "YELLOW", RED: "RED" },
  },
  modal: {
    close: "Close",
    footer:
      "Short definition in the banking context – authoritative are Regulation (EU) 2022/2554 and the associated RTS/ITS.",
    explainTerm: (title: string) => `Explain term: ${title}`,
  },
  handbook: {
    figure: "Figure",
    zoomTitle: "Enlarge figure",
    cockpitLead: "Implemented in the cockpit:",
    navAria: "Chapter navigation",
    sourceNote: (group: string) =>
      `${group} · Source: FRWK-DORA-001 v1.0 (consolidated DORA framework). Highlighted terms are clickable; click a figure to open an enlarged view.`,
    fallbackGroup: "DORA handbook",
  },
};

export const KNOWLEDGE_MESSAGES: Record<Locale, typeof de> = { de, en };
