import type { Locale } from "@/lib/i18n/config";

/**
 * Chrome-Texte der Marktvergleichs-Seite. Der Analyseinhalt selbst liegt
 * bewusst nur auf Deutsch vor (redaktionelles Dokument, Stand 04.09.2026);
 * im EN-Modus weist ein Hinweis darauf hin.
 */

const de = {
  navLabel: "Marktvergleich",
  title: "ODDO BHF im Privatbanken-Vergleich",
  description:
    "Allgemeine Informationen über die Bank im europäischen Marktumfeld – Größe, Ertragsqualität, Produktbreite und Konsolidierungsposition im Vergleich von 13 Privat- und Vermögensverwaltungsbanken.",
  crumbOverview: "Overview",
  crumbSelf: "Marktvergleich",
  sourceBanner:
    "Öffentliche Marktinformation auf Basis veröffentlichter Geschäftszahlen und Fachpresse (Betrachtungsjahr 2025, Ereignisse bis 08/2026) – im Unterschied zu allen übrigen Cockpit-Inhalten keine synthetischen Demo-Daten. Keine Anlage-, Rechts- oder Finanzberatung; für die Richtigkeit der Primärangaben wird keine Gewähr übernommen.",
  languageNote: "",
};

const en: typeof de = {
  navLabel: "Market Comparison",
  title: "ODDO BHF in the European private-banking peer group",
  description:
    "General information about the bank in its European market context – size, revenue quality, product breadth and consolidation position across a peer group of 13 private and wealth-management banks.",
  crumbOverview: "Overview",
  crumbSelf: "Market Comparison",
  sourceBanner:
    "Public market information based on published financial figures and trade press (reporting year 2025, events through 08/2026) – unlike all other cockpit content, this is not synthetic demo data. Not investment, legal or financial advice; no guarantee is given for the accuracy of the primary figures.",
  languageNote:
    "This analysis is an editorial document and is available in German only. The interface language setting does not affect its content.",
};

export const MARKET_MESSAGES: Record<Locale, typeof de> = { de, en };
