import type { PermissionKey } from "@/lib/authz-map";

/** Katalog der verfügbaren Berichtstypen (serverseitig gerendert unter /reports/[type]). */

export const REPORT_KEYS = [
  "EXECUTIVE_SUMMARY",
  "TOP_RISKS",
  "ABOVE_APPETITE",
  "OVERDUE_ACTIONS",
  "ACCEPTANCES",
  "TPRM_OVERVIEW",
  "ROI_CONCENTRATION",
  "DORA_READINESS",
  "CONTROL_EFFECTIVENESS",
  "QUALITY_REVIEW",
  "TREND",
  "DECISION_PAPER",
] as const;

export type ReportKey = (typeof REPORT_KEYS)[number];

export interface ReportDef {
  key: ReportKey;
  titel: string;
  beschreibung: string;
  permission: PermissionKey;
}

export const REPORT_DEFS: ReportDef[] = [
  {
    key: "EXECUTIVE_SUMMARY",
    titel: "Executive Summary",
    beschreibung:
      "Management-Überblick: zentrale KPIs des Risikoregisters und die Top-10-Risiken nach Residual-Score.",
    permission: "report:read",
  },
  {
    key: "TOP_RISKS",
    titel: "Top-Risiken",
    beschreibung:
      "Die zehn höchsten Risiken nach Residual-Score mit Bewertung, Klasse und Strategie.",
    permission: "report:read",
  },
  {
    key: "ABOVE_APPETITE",
    titel: "Risiken über Risikoappetit",
    beschreibung:
      "Alle Risiken, deren Residual-Score den festgelegten Risikoappetit überschreitet.",
    permission: "report:read",
  },
  {
    key: "OVERDUE_ACTIONS",
    titel: "Überfällige Maßnahmen",
    beschreibung:
      "Alle offenen Maßnahmen mit überschrittener Fälligkeit inkl. Verzugstagen und Eskalationsstufe.",
    permission: "report:read",
  },
  {
    key: "ACCEPTANCES",
    titel: "Risikoakzeptanzen",
    beschreibung: "Alle Risikoakzeptanzen mit Status, Antragsteller, Genehmiger und Befristung.",
    permission: "report:read",
  },
  {
    key: "TPRM_OVERVIEW",
    titel: "Third-Party-Überblick",
    beschreibung: "Drittparteien mit Kritikalität, Residual-Score, Due-Diligence- und Exit-Status.",
    permission: "report:read",
  },
  {
    key: "ROI_CONCENTRATION",
    titel: "IKT-Konzentrationsanalyse",
    beschreibung:
      "Mehrstufige Konzentrationsanalytik über den Registerbestand (Meldeschicht Welle 5): Exponierung je Dienstleister, Kettenkonzentration, geografische Verteilung, CTPP-Exponierung.",
    permission: "report:read",
  },
  {
    key: "DORA_READINESS",
    titel: "DORA Readiness",
    beschreibung:
      "Umsetzungsstand der DORA- und DORA-RTS/ITS-Anforderungen inkl. Statusverteilung.",
    permission: "report:read",
  },
  {
    key: "CONTROL_EFFECTIVENESS",
    titel: "Kontrollwirksamkeit",
    beschreibung:
      "Design- und operative Wirksamkeit aller Kontrollen inkl. letztem Test und Verteilung.",
    permission: "report:read",
  },
  {
    key: "QUALITY_REVIEW",
    titel: "Quality Reviews",
    beschreibung:
      "Ergebnisse der Qualitätsprüfungen (Vier-Augen-Prinzip) inkl. Durchschnittsscore.",
    permission: "report:read",
  },
  {
    key: "TREND",
    titel: "Trend (12 Monate)",
    beschreibung: "Monatliche Entwicklung der Risikobewertungen der letzten zwölf Monate.",
    permission: "report:read",
  },
  {
    key: "DECISION_PAPER",
    titel: "Entscheidungsvorlage",
    beschreibung:
      "Vorlage für Management-Entscheidungen: offene Akzeptanzanträge, Risiken über Appetit ohne aktive Behandlung, Eskalationen.",
    permission: "report:read",
  },
];

export function getReportDef(key: string): ReportDef | undefined {
  return REPORT_DEFS.find((d) => d.key === key);
}
