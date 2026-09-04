import { requirePermission } from "@/lib/authz";
import { getLocale } from "@/lib/i18n/server";
import { MARKET_MESSAGES } from "@/lib/i18n/messages/market";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Marktvergleich" };
export const dynamic = "force-dynamic";

/**
 * Marktvergleich ODDO BHF – redaktionelle Analyse auf Basis öffentlich
 * zugänglicher Quellen (Stand 04.09.2026). Bewusst KEINE synthetischen
 * Demo-Daten: Die Seite ist als öffentliche Marktinformation gekennzeichnet
 * und von den fiktiven Cockpit-Daten (Nordlicht Bank AG) getrennt.
 * Inhalt nur auf Deutsch (redaktionelles Dokument); Chrome zweisprachig.
 */

// ── Daten der Analyse (Quellen: siehe SOURCES unten) ────────────────────────

const KEY_FIGURES = [
  { value: "156 Mrd. €", label: "Kundenvermögen 2025 (159 Mrd. € lt. Mitteilung 08/2026)" },
  { value: "905 Mio. €", label: "Nettobankertrag 2025 (2024: 846 Mio. €)" },
  { value: "> 1,2 Mrd. €", label: "Eigenkapital" },
  { value: "~ 3.100", label: "Mitarbeitende" },
  { value: "BBB+", label: "Fitch, Ausblick stabil" },
  { value: "1849", label: "Gründungsjahr (BHF-Wurzeln 1854)" },
];

const AUM_BARS: Array<{ name: string; note: string; width: number; value: string; me?: boolean }> =
  [
    { name: "Pictet", note: "CH", width: 100, value: "802" },
    { name: "Julius Bär", note: "CH", width: 68.8, value: "552" },
    { name: "Lombard Odier", note: "CH", width: 46.1, value: "370" },
    { name: "Vontobel", note: "CH", width: 31.8, value: "255" },
    { name: "J. Safra Sarasin", note: "CH", width: 30.2, value: "242" },
    { name: "Edmond de Rothschild", note: "CH/FR", width: 26.2, value: "210" },
    { name: "Van Lanschot Kempen", note: "NL/BE", width: 22.4, value: "180" },
    { name: "ODDO BHF", note: "FR/DE/CH", width: 19.5, value: "156", me: true },
    { name: "Quintet", note: "LU", width: 13.1, value: "105" },
    { name: "Metzler", note: "DE, AM 2024", width: 9.6, value: "77" },
    { name: "Bethmann HAL", note: "DE, 2026", width: 8.7, value: "70" },
    { name: "M.M. Warburg", note: "DE, 2022", width: 8.2, value: "66" },
    { name: "Berenberg", note: "DE", width: 4.9, value: "39" },
  ];

const MARGIN_BARS: Array<{ name: string; width: number; value: string; me?: boolean }> = [
  { name: "Berenberg", width: 99.2, value: "119 bp" },
  { name: "Julius Bär", width: 61.7, value: "74 bp" },
  { name: "J. Safra Sarasin", width: 61.7, value: "74 bp" },
  { name: "Lombard Odier", width: 52.5, value: "63 bp" },
  { name: "Vontobel", width: 49.2, value: "59 bp" },
  { name: "ODDO BHF", width: 48.3, value: "58 bp", me: true },
  { name: "Quintet", width: 44.2, value: "53 bp" },
  { name: "Pictet", width: 35.0, value: "42 bp" },
];

const PEER_TABLE: Array<{ cells: string[]; me?: boolean }> = [
  {
    cells: [
      "ODDO BHF",
      "Paris / Frankfurt",
      "156 Mrd. €",
      "905 Mio. €",
      "n. v.",
      "n. v.",
      "n. v.",
      "3.100",
    ],
    me: true,
  },
  {
    cells: [
      "Pictet",
      "Genf",
      "757 Mrd. CHF",
      "3.210 Mio. CHF",
      "667 Mio. CHF",
      "n. v.",
      "21,6 %*",
      "5.500",
    ],
  },
  {
    cells: [
      "Julius Bär",
      "Zürich",
      "521 Mrd. CHF",
      "3.861 Mio. CHF",
      "764 Mio. CHF",
      "71,3 %",
      "17,4 %",
      "7.390",
    ],
  },
  {
    cells: [
      "Lombard Odier",
      "Genf",
      "349 Mrd. CHF",
      "1.394 Mio. CHF",
      "200 Mio. CHF",
      "n. v.",
      "33,0 %",
      "n. v.",
    ],
  },
  {
    cells: [
      "Vontobel",
      "Zürich",
      "241 Mrd. CHF",
      "1.431 Mio. CHF",
      "280 Mio. CHF",
      "74,2 %",
      "19,7 %",
      "n. v.",
    ],
  },
  {
    cells: [
      "J. Safra Sarasin",
      "Basel",
      "228 Mrd. CHF",
      "> 1.700 Mio. CHF",
      "522 Mio. CHF",
      "n. v.",
      "34,5 %",
      "2.652",
    ],
  },
  {
    cells: [
      "Edmond de Rothschild",
      "Genf",
      "198 Mrd. CHF",
      "n. v.",
      "211 Mio. CHF†",
      "n. v.",
      "19,1 %*",
      "2.700",
    ],
  },
  {
    cells: [
      "Van Lanschot Kempen",
      "’s-Hertogenbosch",
      "180 Mrd. €",
      "n. v.",
      "157 Mio. €",
      "n. v.",
      "18,2 %",
      "n. v.",
    ],
  },
  {
    cells: [
      "Quintet",
      "Luxemburg",
      "105 Mrd. €",
      "553 Mio. €",
      "66 Mio. €",
      "84,4 %",
      "22,5 %",
      "n. v.",
    ],
  },
  {
    cells: [
      "Berenberg",
      "Hamburg",
      "39 Mrd. €",
      "468 Mio. €",
      "20 Mio. €",
      "90,4 %",
      "12,1 %",
      "1.588",
    ],
  },
];

const THESES = [
  {
    lead: "Mittelgroß in Europa, groß im deutsch-französischen Korridor.",
    text: "Mit rund 156 Mrd. € Kundenvermögen (2025; 159 Mrd. € zum Zeitpunkt der IFSAM-Meldung 08/2026) liegt die Gruppe im europäischen Mittelfeld – deutlich über allen unabhängigen deutschen Häusern, aber bei rund einem Fünftel der Größe von Pictet.",
  },
  {
    lead: "Die Ertragsmarge ist geschäftsmodellbedingt niedrig, nicht schwach.",
    text: "905 Mio. € Nettobankertrag auf 156 Mrd. € entsprechen rund 58 Basispunkten. Der Wert liegt unter Julius Bär (≈ 74 bp), weil ein erheblicher Teil der Volumina margenarmes Fondsservicing und KVG-Administration ist – genau das Segment, das mit IFSAM 2026 weiter ausgebaut wurde.",
  },
  {
    lead: "Die Produktbreite ist der eigentliche Differenzierer.",
    text: "Kaum ein europäischer Wettbewerber deckt Family Office, institutionelles Asset Management, europäisches Aktienresearch mit ECM-Zugang, Handelsfinanzierung und Verwahrstellen-/Fondsdienstleistungen unter einem Dach ab.",
  },
  {
    lead: "Die Schweiz bleibt die strategische Schwachstelle.",
    text: "Rund 8 Mrd. CHF verwaltete Vermögen per Ende 2025 platzieren ODDO BHF in der Schweiz im untersten Größencluster eines Marktes, den UBS mit rund zwei Dritteln aller Vermögen dominiert. Das Ziel von 10 Mrd. CHF ändert daran wenig – Skaleneffekte entstehen dort erst deutlich später.",
  },
  {
    lead: "Der Konsolidierungsdruck kommt von oben und von der Seite.",
    text: "ABN AMRO bündelt Bethmann und Hauck Aufhäuser Lampe zu rund 70 Mrd. € mit einem 100-Mrd.-€-Ziel bis 2030; gleichzeitig wächst die Profitabilitätslücke zwischen großen und kleinen Häusern. ODDO BHF antwortet mit Zukäufen im Servicing und einer Reorganisation entlang von Kundensegmenten ab Juni 2026.",
  },
];

const PILLARS = [
  {
    tag: "Geschäftsfeld I",
    title: "Private Wealth Management",
    items: [
      "16 Standorte in Deutschland, flächendeckend Frankreich, Genf/Zürich",
      "Vermögensverwaltung, Anlageberatung, Wealth Planning",
      "Family Office sowie Stiftungen und Institutionen",
      "Private Equity und Immobilien als Beimischung",
      "Lombard- und Sonderfinanzierungen, Betreuung unabhängiger Vermögensverwalter",
    ],
    competitors: "Wettbewerb: Bethmann HAL, Berenberg, Deutsche Bank PB, Indosuez, Neuflize OBC",
  },
  {
    tag: "Geschäftsfeld II",
    title: "Asset Management & Private Assets",
    items: [
      "64,7 Mrd. € verwaltetes Vermögen (31.12.2025), 341 Mitarbeitende",
      "Investmentzentren Paris, Düsseldorf, Frankfurt, Luxemburg",
      "Schwerpunkte: Zinsen & Kredit 32 %, KVG/Administration 22 %, Multi-Asset 19 %",
      "Fundamentale Aktien 11 %, quantitative Aktien 9 %, Private Assets 7 %",
      "81 % der Publikumsfondsvolumina mit ESG-Integration",
    ],
    competitors: "Wettbewerb: Union Investment, DWS, Amundi, Metzler AM, Candriam",
  },
  {
    tag: "Geschäftsfeld III",
    title: "Investment Banking & Research",
    items: [
      "Coverage von 800 europäischen Titeln in 23 Sektoren, über 700 institutionelle Kunden",
      "Nr. 1 Broker Frankreich und Benelux, Nr. 2 Deutschland, Nr. 6 Spanien (Institutional Investor 2024)",
      "Platz 4 nach Anzahl europäischer ECM-Transaktionen 2024 (21 Transaktionen)",
      "ECM-Allianzen mit ABN AMRO, BBVA, Commerzbank, Natixis, RBI",
      "Über 200 Liquiditäts- und Designated-Sponsor-Mandate",
    ],
    competitors: "Wettbewerb: Kepler Cheuvreux, Berenberg, Jefferies, Rothschild & Co, Lazard",
  },
  {
    tag: "Geschäftsfeld IV",
    title: "Corporate Banking, Asset Servicing & Metals",
    items: [
      "Zahlungsverkehr, Cash Management, Investitions- und Förderkredite",
      "Handelsfinanzierung über 100 Länder, rund 30 % Marktanteil bei bestätigten deutschen Export-Akkreditiven",
      "Korrespondenzbankgeschäft und ECA-gedeckte Finanzierungen",
      "Fondsplattform: mit IFSAM (Übernahme von FNZ, 08/2026) über 90 Mrd. € Assets under Administration",
      "Edelmetallhandel als Nischenkompetenz",
    ],
    competitors: "Wettbewerb: Hauck Aufhäuser (Asset Servicing), Commerzbank, Société Générale SS",
  },
];

const COUNTRIES = [
  {
    flag: "Frankreich · ODDO BHF SCA",
    title: "Heimatmarkt und Kapitalmarktbasis",
    text: "Paris trägt die Gruppengeschichte seit 1849 und die stärkste Kapitalmarktposition: Nr. 1 im französischen Brokerage, führende Stellung im Small- und Mid-Cap-Research. Im Private Banking steht ODDO BHF gegen bankgestützte Schwergewichte – Indosuez (Crédit Agricole), Société Générale Private Banking, BNP Paribas Banque Privée – sowie gegen die unabhängigen Häuser Rothschild & Co, Lazard Frères Gestion und Banque Transatlantique.",
    facts: [
      ["Brokerage-Rang", "Nr. 1"],
      ["Rechtsform", "SCA"],
      ["Aufsicht", "ACPR"],
    ],
  },
  {
    flag: "Deutschland · ODDO BHF SE",
    title: "Mittelstand, Frankfurt, BHF-Erbe",
    text: "Die Frankfurter Einheit trägt das Erbe der BHF-Bank und ist der industrielle Kern der Gruppe: 16 PWM-Standorte, Nr. 2 im deutschen Brokerage, rund 30 % Marktanteil bei bestätigten Export-Akkreditiven. Der Wettbewerb ordnet sich gerade neu: ABN AMRO formt aus Bethmann und Hauck Aufhäuser Lampe die drittgrößte deutsche Vermögensverwaltung (rund 70 Mrd. €, Ziel 100 Mrd. € bis 2030), während Berenberg eine aufsichtsrechtliche Sonderprüfung verarbeitet.",
    facts: [
      ["Bilanzsumme (2024)", "10,0 Mrd. €"],
      ["Jahresüberschuss (2024)", "70,1 Mio. €"],
      ["Aufsicht", "BaFin / EZB"],
    ],
  },
  {
    flag: "Schweiz · ODDO BHF (Schweiz) AG",
    title: "Aufbau in einem gesättigten Markt",
    text: "Aus der Verschmelzung mit Landolt & Cie, der ältesten Bank der Westschweiz, entstand ein eigenständiger Schweizer Bankstandort mit Büros in Genf und Zürich. Seit Oktober 2025 führt Hannes Gallus als CEO, Philippe Oddo amtiert als Verwaltungsratspräsident. Zuflüsse kommen überwiegend aus Deutschland und Frankreich, zunehmend aus dem Nahen Osten. Mit rund 8 Mrd. CHF bleibt das Haus jedoch im untersten Größencluster eines Marktes, in dem UBS etwa zwei Drittel aller Vermögen hält.",
    facts: [
      ["AuM Ende 2025", "8,0 Mrd. CHF"],
      ["Nettoneugeld 2025", "0,5 Mrd. CHF"],
      ["Zielgröße", "10 Mrd. CHF"],
    ],
  },
];

const SWOT: Array<{ title: string; tone: string; items: string[] }> = [
  {
    title: "Stärken",
    tone: "border-t-risk-low",
    items: [
      "Eigentümerstruktur mit 90 % bei Familie und Mitarbeitenden – Unabhängigkeit ohne Quartalsdruck",
      "Einzige Gruppe mit gleichrangiger Verankerung in beiden größten Volkswirtschaften der Eurozone",
      "Führende Research- und Brokerage-Position in Kontinentaleuropa mit fünf ECM-Allianzen",
      "Vier tragende Ertragssäulen dämpfen Zins- und Kapitalmarktzyklen",
    ],
  },
  {
    title: "Schwächen",
    tone: "border-t-risk-critical",
    items: [
      "Bonität BBB+ deutlich unter Schweizer Vergleichshäusern (Lombard Odier AA−)",
      "Ertragsmarge von rund 58 bp im unteren Mittelfeld der Vergleichsgruppe",
      "Sehr geringe Transparenz: weder Segmentergebnisse noch Gruppen-CIR oder CET1 werden veröffentlicht",
      "Schweizer Einheit unterhalb jeder Skalenschwelle",
    ],
  },
  {
    title: "Chancen",
    tone: "border-t-primary",
    items: [
      "Asset Servicing als margenstabile, zinsunabhängige Ertragssäule (> 90 Mrd. € nach IFSAM)",
      "Generationenübergang im deutschen und französischen Mittelstand",
      "Marktanteilsgewinne im deutschen Wettbewerb während der Bethmann-HAL-Integration und der Berenberg-Neuaufstellung",
      "Zuflüsse aus dem Nahen Osten über die Schweizer Plattform",
    ],
  },
  {
    title: "Risiken",
    tone: "border-t-risk-medium",
    items: [
      "Bethmann HAL mit Zielgröße 100 Mrd. € bis 2030 als neuer deutscher Wettbewerber in Skalengröße",
      "Anhaltender Margendruck auf Fonds- und Administrationsvolumina",
      "Zinsrückgang trifft Erträge kleinerer und mittlerer Häuser überproportional",
      "Integrationsrisiko aus Segmentreorganisation und IFSAM parallel",
      "Steigende Regulierungs- und Technologiekosten in drei Aufsichtsregimen",
    ],
  },
];

/** Positionierungsmatrix (x: Vermögen log, y: Diversifikationsgrad). */
const MATRIX_POINTS: Array<{
  x: number;
  y: number;
  label: string;
  lx: number;
  ly: number;
  anchor?: "end";
}> = [
  { x: 111, y: 108, label: "Berenberg", lx: 120, ly: 112 },
  { x: 217, y: 142, label: "Metzler", lx: 226, ly: 146 },
  { x: 202, y: 329, label: "Bethmann HAL", lx: 211, ly: 333 },
  { x: 265, y: 352, label: "Quintet", lx: 274, ly: 356 },
  { x: 349, y: 227, label: "Van Lanschot", lx: 358, ly: 231 },
  { x: 373, y: 252, label: "Edmond de Rothschild", lx: 382, ly: 269 },
  { x: 404, y: 193, label: "Vontobel", lx: 413, ly: 189 },
  { x: 395, y: 295, label: "J. Safra Sarasin", lx: 404, ly: 299 },
  { x: 462, y: 261, label: "Lombard Odier", lx: 471, ly: 265 },
  { x: 524, y: 329, label: "Julius Bär", lx: 516, ly: 333, anchor: "end" },
  { x: 582, y: 227, label: "Pictet", lx: 574, ly: 231, anchor: "end" },
];

const SOURCES: Array<{ href: string; label: string }> = [
  {
    href: "https://www.oddo-bhf.com/2026/08/06/oddo-bhf-acquires-international-fund-services-asset-management-ifsam/",
    label: "ODDO BHF: Übernahme IFSAM, 06.08.2026 – Gruppenkennzahlen 2025",
  },
  {
    href: "https://www.oddo-bhf.com/about-us/",
    label: "ODDO BHF: Über uns – Eigentümerstruktur, Geschäftsfelder, Standorte",
  },
  {
    href: "https://am.oddo-bhf.com/fr-fr/distributeur-cgp/a-propos-notre-identite/",
    label: "ODDO BHF Asset Management: Kennzahlen – 64,7 Mrd. € AuM per 31.12.2025",
  },
  {
    href: "https://www.oddo-bhf.com/equity-research-brokerage/",
    label: "ODDO BHF: Equity Research & Brokerage – Coverage, Rankings, ECM",
  },
  {
    href: "https://www.oddo-bhf.com/international-and-corporate-banking/",
    label: "ODDO BHF: International & Corporate Banking – Akkreditiv-Marktanteil",
  },
  {
    href: "https://www.oddo-bhf.com/2026/01/21/oddo-bhf-creates-the-position-of-deputy-ceo-to-be-filled-by-simone-westerfeld/",
    label: "ODDO BHF: Deputy CEO Simone Westerfeld, 21.01.2026 – Segmentreorganisation",
  },
  {
    href: "https://www.bluewin.ch/fr/infos/economie/oddo-bhf-suisse-vise-les-10-milliards-d-avoirs-sous-gestion-3190297.html",
    label: "blue News: ODDO BHF Suisse, Ziel 10 Mrd. CHF",
  },
  {
    href: "https://www.oddo-bhf.com/2025/10/10/oddo-bhf-strengthens-its-ambitions-in-switzerland-philippe-oddo-becomes-chairman-hannes-gallus-is-appointed-chief-executive-officer/",
    label: "ODDO BHF: Führungswechsel Schweiz, 10.10.2025",
  },
  {
    href: "https://www.finews.com/news/english-news/43630-oddo-bhf-landolt-switzerland-private-wealth-management-joachim-haeger-germany-france",
    label: "finews: ODDO BHF/Landolt, Schweizer Strategie",
  },
  {
    href: "https://thebanks.eu/banks/11122",
    label: "thebanks.eu: ODDO BHF SE – Bilanzsumme und Ergebnis 2024, Fitch-Rating",
  },
  {
    href: "https://www.eqs-news.com/news/ad-hoc/presentation-of-the-2025-full-year-results-for-the-julius-baer-group/802d4961-fef8-4dc1-b0de-f0b99b109618_en",
    label: "Julius Bär: Jahresergebnis 2025",
  },
  {
    href: "https://www.privatebankerinternational.com/news/pictet-aum-growth/",
    label: "Private Banker International: Pictet 2025",
  },
  {
    href: "https://www.lombardodier.com/insights/2026/february/lombard-odier-reports-full-year.html",
    label: "Lombard Odier: Jahresergebnis 2025",
  },
  {
    href: "https://www.vontobel.com/en-ch/about-vontobel/media/communications/vontobel-achieves-successful-2025/",
    label: "Vontobel: Jahresergebnis 2025",
  },
  {
    href: "https://www.privatebankerinternational.com/news/j-safra-sarasin-profit-growth-2025/",
    label: "Private Banker International: J. Safra Sarasin 2025",
  },
  {
    href: "https://www.edmond-de-rothschild.com/en/news/show/1565-16673-strong-momentum-with-chf-10-billion-net-inflows-in-2025-taking-assets-under-management-to-a-record-high-close-to-chf-200-billion",
    label: "Edmond de Rothschild: Jahresergebnis 2025",
  },
  {
    href: "https://newsroom.vanlanschotkempen.com/en/van-lanschot-kempen-publishes-2025-annual-results",
    label: "Van Lanschot Kempen: Jahresergebnis 2025",
  },
  {
    href: "https://www.quintet.com/en-gb/media/quintet-reports-solid-2025-results-with-growing-client-assets-and-strong-capital-position",
    label: "Quintet: Jahresergebnis 2025",
  },
  {
    href: "https://www.private-banking-magazin.de/berenberg-jahresabschluss-2025-gewinneinbruch-bafin/",
    label: "private banking magazin: Berenberg-Jahresabschluss 2025",
  },
  {
    href: "https://www.fuchsbriefe.de/bethmann-hal-entsteht-wie-abn-amro-den-deutschen-private-banking-markt-neu-ordnet-twm2025",
    label: "Fuchsbriefe: Bethmann HAL und die Neuordnung des deutschen Marktes",
  },
  {
    href: "https://www.metzler.com/en/metzler/news/bank/bankhaus/2506-jahrespressegespraech",
    label: "Bankhaus Metzler: Jahrespressegespräch (GJ 2024)",
  },
  {
    href: "https://www.pwc.ch/en/insights/strategy/private-banking-market-update-2026.html",
    label: "PwC Schweiz: Private Banking Market Update 2026",
  },
  {
    href: "https://blog.zhaw.ch/wealth-management/2026/05/03/largest-swiss-private-banks-by-aum-2025/",
    label: "ZHAW: Die größten Schweizer Privatbanken nach AuM 2025",
  },
];

// ── Darstellungsbausteine ───────────────────────────────────────────────────

function BarChart({
  rows,
  ticks,
}: {
  rows: Array<{ name: string; note?: string; width: number; value: string; me?: boolean }>;
  ticks: string[];
}) {
  return (
    <div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.name}
            className="grid grid-cols-[minmax(7.5rem,11rem)_1fr_auto] items-center gap-3"
          >
            <span
              className={cn(
                "text-xs leading-tight",
                r.me ? "font-semibold" : "text-muted-foreground",
              )}
            >
              {r.name}
              {r.note ? (
                <span className="font-normal text-muted-foreground"> ({r.note})</span>
              ) : null}
            </span>
            <span className="relative block h-4 min-w-0 border-l bg-muted">
              <span
                className={cn("block h-full", r.me ? "bg-primary" : "bg-muted-foreground/40")}
                style={{ width: `${r.width}%`, minWidth: 2 }}
              />
            </span>
            <span
              className={cn(
                "min-w-[4.2rem] text-right font-mono text-xs tabular-nums",
                r.me ? "font-semibold" : "text-muted-foreground",
              )}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-[minmax(7.5rem,11rem)_1fr_auto] gap-3 border-t pt-1.5">
        <span />
        <span className="flex justify-between font-mono text-[10px] text-muted-foreground">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </span>
        <span className="min-w-[4.2rem]" />
      </div>
    </div>
  );
}

function SectionCard({
  num,
  title,
  description,
  children,
}: {
  num: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-baseline gap-3">
          <span className="font-mono text-xs font-medium text-primary">{num}</span>
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ── Seite ───────────────────────────────────────────────────────────────────

export default async function MarketComparisonPage() {
  await requirePermission("risk:read");
  const locale = await getLocale();
  const t = MARKET_MESSAGES[locale];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={t.title}
        description={t.description}
        crumbs={[{ label: t.crumbOverview, href: "/overview" }, { label: t.crumbSelf }]}
      />

      <div className="mb-4 rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs leading-relaxed">
        <p>{t.sourceBanner}</p>
        {t.languageNote ? <p className="mt-1 text-muted-foreground">{t.languageNote}</p> : null}
      </div>

      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        Marktanalyse · Private Banking Europa · Stand 04.09.2026 · Vergleichsgruppe: 13 europäische
        Privat- und Vermögensverwaltungsbanken
      </p>

      {/* 01 – Management Summary */}
      <SectionCard num="01" title="Management Summary">
        <p className="mb-4 text-sm leading-relaxed">
          ODDO BHF ist <strong>keine klassische Privatbank</strong>, sondern eine hybride
          Finanzgruppe: Vermögensverwaltung für Privatkunden, institutionelles Asset Management,
          Aktienresearch/Brokerage und Corporate Banking mit Asset Servicing stehen gleichrangig
          nebeneinander. Der Vergleich mit Pictet, Julius Bär oder Lombard Odier greift deshalb
          systematisch zu kurz – die relevante Peergroup sind Rothschild &amp; Co, Metzler,
          Berenberg und Vontobel.
        </p>
        <ol className="divide-y rounded-lg border">
          {THESES.map((th, i) => (
            <li key={i} className="grid grid-cols-[2.2rem_1fr] items-start gap-3 p-3">
              <span className="pt-0.5 font-mono text-xs text-primary">T{i + 1}</span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <strong className="text-foreground">{th.lead}</strong> {th.text}
              </p>
            </li>
          ))}
        </ol>
      </SectionCard>

      {/* 02 – Profil */}
      <SectionCard num="02" title="Profil: eine Gruppe, drei Rechtsräume">
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            Die Gruppe führt zwei gleichrangige Hauptsitze – ODDO BHF SCA in Paris und ODDO BHF SE
            in Frankfurt am Main – und seit der Verschmelzung mit dem Waadtländer Haus Landolt &amp;
            Cie einen eigenständigen Schweizer Bankstandort (ODDO BHF (Schweiz) AG, Genf und
            Zürich). Hinzu kommen Luxemburg als Fondsstandort, Standorte in Spanien, Italien, den
            Niederlanden, Österreich, Großbritannien, den USA, den VAE sowie ein Servicezentrum in
            Tunis. Die IT- und Betriebstochter ODDO BHF Solutions GmbH sitzt in Saarbrücken.
          </p>
          <p>
            Die Eigentümerstruktur ist das strukturelle Alleinstellungsmerkmal:{" "}
            <strong>65 % Familie Oddo, 25 % Mitarbeitende</strong>, der Rest im Wesentlichen bei
            Natixis, der Familie Bettencourt sowie den früheren Landolt-/Lombard-Partnern. Neun von
            zehn Anteilen liegen damit bei Familie und Belegschaft – eine Konstellation, die in
            Europa außerhalb der Schweizer Privatbankiers selten geworden ist.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3 lg:grid-cols-6">
          {KEY_FIGURES.map((f) => (
            <div key={f.value} className="flex flex-col gap-0.5 bg-card p-3">
              <span className="font-mono text-lg font-medium tabular-nums leading-tight">
                {f.value}
              </span>
              <span className="text-[11px] leading-snug text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Nettobankertrag 2025 und Kundenvermögen gemäß Unternehmensangaben in der Pressemitteilung
          zur IFSAM-Übernahme vom 06.08.2026 sowie den Website-Boilerplates 2025/2026.
          Segmentbezogene Ertrags- oder Ergebniszahlen veröffentlicht die Gruppe nicht.
        </p>
      </SectionCard>

      {/* 03 – Größenvergleich */}
      <SectionCard
        num="03"
        title="Größenvergleich: das europäische Feld"
        description="Der Größenvergleich europäischer Privatbanken ist notorisch unsauber, weil die Häuser unterschiedlich abgrenzen – verwaltete Vermögen (AuM), betreute Kundenvermögen inklusive Depotverwahrung, teils inklusive Fondsadministration. Die Basis ist je Institut vermerkt; Schweizer Werte zu 1 CHF = 1,06 € umgerechnet."
      >
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
            <h3 className="text-sm font-semibold">
              Kundenvermögen bzw. verwaltete Vermögen im Vergleich
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Mrd. € · Geschäftsjahr 2025, sofern nicht anders vermerkt
            </span>
          </div>
          <BarChart rows={AUM_BARS} ticks={["0", "200", "400", "600", "800"]} />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Basis je Haus: Pictet = AuM und Depotverwahrung; Julius Bär, Vontobel, J. Safra Sarasin,
            Edmond de Rothschild, Berenberg, M.M. Warburg = AuM; Lombard Odier, Van Lanschot Kempen,
            ODDO BHF, Quintet, Bethmann HAL = betreute Kundenvermögen; Metzler = AuM Asset
            Management (ohne Pension Management, 18 Mrd. €). Zum Maßstab: UBS verwaltet rund 5.584
            Mrd. CHF und damit etwa zwei Drittel aller in der Schweizer Privatbankenstatistik
            erfassten Vermögen – die Skala ist bewusst ohne UBS gezeichnet.
          </p>
        </div>

        <div className="mt-4 rounded-lg border p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
            <h3 className="text-sm font-semibold">Ertragsmarge auf betreute Vermögen</h3>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Basispunkte · Erträge ÷ Kundenvermögen · GJ 2025
            </span>
          </div>
          <BarChart rows={MARGIN_BARS} ticks={["0", "30", "60", "90", "120"]} />
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Eigene Berechnung aus veröffentlichten Erträgen und Vermögensbeständen; nicht
            bilanzanalytisch geprüft. Die Werte sind nur eingeschränkt vergleichbar: Häuser mit
            hohem Depotverwahr- oder Administrationsanteil (Pictet, ODDO BHF, Quintet) weisen
            strukturell niedrigere Margen aus, kapitalmarktlastige Häuser (Berenberg) strukturell
            höhere. Berenberg: Provisions- zzgl. Zinsüberschuss (468 Mio. €); Lombard Odier bezogen
            auf AuM (223 Mrd. CHF), nicht auf Kundenvermögen.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[44rem] text-sm">
            <caption className="border-b p-3 text-left text-sm font-semibold">
              Kennzahlenvergleich Geschäftsjahr 2025
            </caption>
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                {[
                  "Institut",
                  "Sitz",
                  "Vermögen",
                  "Erträge",
                  "Ergebnis",
                  "CIR",
                  "Kernkapital",
                  "Mitarbeitende",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      "whitespace-nowrap px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground",
                      i >= 2 && "text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PEER_TABLE.map((row) => (
                <tr
                  key={row.cells[0]}
                  className={cn("border-b last:border-0", row.me && "bg-primary/5")}
                >
                  {row.cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        "px-3 py-2 text-xs",
                        ci === 0 && row.me && "border-l-2 border-primary font-semibold",
                        ci >= 2 && "whitespace-nowrap text-right font-mono tabular-nums",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          * Gesamtkapitalquote bzw. Solvabilitätsquote statt CET1. † Betriebsergebnis. CIR =
          Aufwand-Ertrags-Relation. „n. v.“ = nicht veröffentlicht. Berenberg 2025: Ergebnisrückgang
          um 75 % und CIR-Anstieg auf 90,4 % im Zuge einer BaFin-Sonderprüfung zu Bilanzierung und
          Bewertung von Eigenhandelspositionen – der Wert ist kein Strukturmaß, sondern ein
          Sondereffekt.
        </p>
      </SectionCard>

      {/* 04 – Positionierungsmatrix */}
      <SectionCard
        num="04"
        title="Positionierung: Skala gegen Geschäftsmodellbreite"
        description="Zwei Dimensionen erklären das Feld besser als jede Rangliste: die verwaltete Größe (horizontal, logarithmisch) und der Anteil der Erträge, der nicht aus klassischer Vermögensverwaltung stammt (vertikal). ODDO BHF liegt im oberen linken Quadranten – mittlere Skala bei hoher Ertragsdiversifikation; das ist die Position von Metzler und Berenberg, nur eine Größenordnung darüber."
      >
        <div className="overflow-x-auto rounded-lg border bg-card p-2">
          <svg
            viewBox="0 0 640 440"
            role="img"
            aria-label="Positionierungsmatrix: verwaltete Vermögen gegen Ertragsdiversifikation. ODDO BHF liegt bei 156 Milliarden Euro mit hohem Diversifikationsgrad."
            className="block h-auto w-full min-w-[34rem]"
          >
            <g stroke="hsl(var(--border))" strokeWidth="1">
              {[149, 258, 366, 474, 582].map((x) => (
                <line key={x} x1={x} y1={40} x2={x} y2={380} />
              ))}
              {[125, 210, 295].map((y) => (
                <line key={y} x1={70} y1={y} x2={600} y2={y} />
              ))}
            </g>
            <g stroke="hsl(var(--muted-foreground))" strokeWidth="1.5">
              <line x1={70} y1={380} x2={600} y2={380} />
              <line x1={70} y1={40} x2={70} y2={380} />
            </g>
            <g
              fontFamily="ui-monospace, monospace"
              fontSize="10"
              fill="hsl(var(--muted-foreground))"
              textAnchor="middle"
            >
              <text x={149} y={398}>
                50
              </text>
              <text x={258} y={398}>
                100
              </text>
              <text x={366} y={398}>
                200
              </text>
              <text x={474} y={398}>
                400
              </text>
              <text x={582} y={398}>
                800
              </text>
              <text x={335} y={418} fill="hsl(var(--foreground))">
                Verwaltete bzw. betreute Vermögen in Mrd. € (logarithmisch)
              </text>
            </g>
            <g
              fontFamily="ui-monospace, monospace"
              fontSize="10"
              fill="hsl(var(--muted-foreground))"
            >
              <text x={62} y={64} textAnchor="end">
                hoch
              </text>
              <text x={62} y={214} textAnchor="end">
                mittel
              </text>
              <text x={62} y={376} textAnchor="end">
                gering
              </text>
              <text
                transform="rotate(-90 20 210)"
                x={20}
                y={210}
                textAnchor="middle"
                fill="hsl(var(--foreground))"
              >
                Ertragsdiversifikation
              </text>
            </g>
            <g fontSize="11" fill="hsl(var(--muted-foreground))">
              {MATRIX_POINTS.map((p) => (
                <g key={p.label}>
                  <circle cx={p.x} cy={p.y} r="4.5" fill="hsl(var(--muted-foreground))" />
                  <text x={p.lx} y={p.ly} textAnchor={p.anchor}>
                    {p.label}
                  </text>
                </g>
              ))}
              <circle cx={327} cy={125} r="7" fill="hsl(var(--primary))" />
              <text x={339} y={122} fontWeight="600" fontSize="12.5" fill="hsl(var(--foreground))">
                ODDO BHF
              </text>
              <text
                x={339}
                y={137}
                fontSize="10"
                fontFamily="ui-monospace, monospace"
                fill="hsl(var(--muted-foreground))"
              >
                156 Mrd. € · 4 Geschäftsfelder
              </text>
            </g>
          </svg>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Vermögenswerte wie im Größenvergleich; der Diversifikationsgrad ist eine qualitative
          Einordnung anhand der veröffentlichten Geschäftsfeldstruktur (Anteil von Asset Management,
          Investment Banking, Corporate Banking und Asset Servicing am Geschäftsmodell), keine
          gemessene Ertragsaufteilung.
        </p>
      </SectionCard>

      {/* 05 – Produkte */}
      <SectionCard
        num="05"
        title="Produkte und Angebote im Wettbewerbsvergleich"
        description="Die Gruppe führt vier Geschäftsfelder. Entscheidend für die Wettbewerbsbewertung ist weniger die Qualität des einzelnen Feldes als deren Kombination: Der Unternehmerkunde erhält Vermögensverwaltung, Nachfolgeberatung, Kapitalmarktzugang für sein Unternehmen und Handelsfinanzierung aus derselben Gruppe."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.tag} className="flex flex-col rounded-lg border p-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {p.tag}
              </span>
              <h3 className="mt-1 text-sm font-semibold">{p.title}</h3>
              <ul className="mt-2 flex flex-col gap-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
                {p.items.map((it, i) => (
                  <li key={i} className="list-disc">
                    {it}
                  </li>
                ))}
              </ul>
              <span className="mt-auto border-t pt-2 font-mono text-[11px] text-primary">
                {p.competitors}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed">
          <strong>Bewertung der Angebotsstruktur.</strong> Reine Wealth-Manager wie Quintet,
          Bethmann HAL oder Edmond de Rothschild bieten kein Aktienresearch und keine
          Handelsfinanzierung. Pictet und Lombard Odier verbinden Vermögensverwaltung mit Asset
          Management und Verwahrdienstleistungen, jedoch ohne Unternehmensfinanzierung. Berenberg
          und Metzler bilden das ODDO-BHF-Modell in Deutschland am ehesten ab – bei einem Viertel
          bis der Hälfte des Volumens und ohne französischen Heimatmarkt. Das nächstliegende
          europäische Vergleichsmodell bleibt Rothschild &amp; Co, das allerdings über eine deutlich
          stärkere M&amp;A-Beratungsfranchise und kein Brokerage-Geschäft verfügt.
        </p>
      </SectionCard>

      {/* 06 – Länder */}
      <SectionCard num="06" title="Länderpositionierung: Frankreich, Deutschland, Schweiz">
        <div className="grid gap-3 lg:grid-cols-3">
          {COUNTRIES.map((c) => (
            <div key={c.flag} className="flex flex-col gap-2 rounded-lg border p-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                {c.flag}
              </span>
              <h3 className="text-sm font-semibold">{c.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{c.text}</p>
              <dl className="mt-auto flex flex-col gap-1 border-t pt-2">
                {c.facts.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 text-xs">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-mono tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Der Dreiländeraufbau ist regulatorisch anspruchsvoll: EZB/BaFin-Aufsicht für die deutsche
          SE, ACPR für die französische SCA, FINMA für die Schweizer Tochter – bei gruppenweit
          einheitlichen Anforderungen aus DORA, NIS-2-Umsetzung und MiFID II.
        </p>
      </SectionCard>

      {/* 07 – Kontext */}
      <SectionCard num="07" title="Europäischer Kontext: Konsolidierung und Margendruck">
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            Der europäische Privatbankenmarkt spreizt sich. Große Häuser erwirtschaften weiterhin
            Eigenkapitalrenditen über 10 %, während kleine und mittelgroße Institute 2025 sinkende
            Profitabilität hinnehmen mussten – überwiegend nicht wegen ausufernder Kosten, sondern
            wegen rückläufiger Zinserträge nach dem Ende des Zinshochs. Die verwalteten Vermögen
            wuchsen über alle Größenklassen hinweg um 5,5 % bis 8,0 %, getragen von Marktentwicklung
            und stabilen Nettozuflüssen.
          </p>
          <p>
            Konsolidiert wird selektiv statt flächendeckend: Die größte Schweizer Transaktion des
            Jahres 2025 war die Übernahme von Cité Gestion durch EFG International mit 7,5 Mrd. CHF
            verwalteten Vermögen. In Deutschland und den Benelux-Ländern verlaufen die Bewegungen
            größer – ABN AMRO mit Bethmann/Hauck Aufhäuser Lampe, Van Lanschot Kempen mit einem
            Gemeinschaftsunternehmen im Aktienbrokerage mit KBC Securities.
          </p>
          <p>
            Für ODDO BHF folgt daraus eine klare Lesart: Die Gruppe befindet sich{" "}
            <strong>oberhalb</strong> der kritischen Größenschwelle, ab der Skaleneffekte tragen,
            aber <strong>unterhalb</strong> der Schwelle, ab der Skala selbst zum Wettbewerbsvorteil
            wird. Ihre Antwort ist nicht Größenwachstum in der Vermögensverwaltung, sondern die
            Verbreiterung margenstabiler Servicing-Erträge – die IFSAM-Übernahme im August 2026 hebt
            die administrierten Fondsvolumina auf über 90 Mrd. €.
          </p>
        </div>
      </SectionCard>

      {/* 08 – Strategie */}
      <SectionCard num="08" title="Strategie und Ausblick">
        <p className="text-sm leading-relaxed">
          Zum 1. Juni 2026 wurde die neu geschaffene Position der stellvertretenden
          Vorstandsvorsitzenden mit Simone Westerfeld besetzt, die in die Leitungsgremien beider
          Hauptgesellschaften einzieht. Der erklärte Umbau: Die Gruppe organisiert sich künftig{" "}
          <strong>nach Kundensegmenten statt nach Fachexpertisen</strong> – Privatkunden,
          Familienunternehmen und Stiftungen, Family Offices, Unternehmensentscheider,
          institutionelle Investoren, unabhängige Vermögensverwalter. Ergänzend wird weiter
          zugekauft; Akquisitionen sind seit Meriten (2015), Frankfurt-Trust, ACG Capital und
          Landolt &amp; Cie fester Bestandteil des Wachstumsmodells.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SWOT.map((s) => (
            <div key={s.title} className={cn("border-t-2 pt-3", s.tone)}>
              <h3 className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wider">
                {s.title}
              </h3>
              <ul className="flex flex-col gap-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
                {s.items.map((it, i) => (
                  <li key={i} className="list-disc">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-lg border bg-muted/40 p-4">
          <h3 className="mb-1 text-sm font-semibold">Fazit</h3>
          <p className="text-sm leading-relaxed">
            ODDO BHF ist im europäischen Vergleich ein{" "}
            <strong>mittelgroßer, ungewöhnlich breit aufgestellter Spezialist</strong> mit einem
            strukturellen Vorteil, den kein Wettbewerber kopieren kann: die gleichrangige
            Verankerung im deutschen und französischen Mittelstand bei unabhängiger
            Eigentümerstruktur. Die Gruppe gewinnt keinen Größenwettbewerb gegen Zürich und Genf und
            versucht es erkennbar auch nicht. Sie gewinnt dort, wo ein Unternehmerkunde
            grenzüberschreitend Vermögensverwaltung, Kapitalmarktzugang und Handelsfinanzierung aus
            einer Hand benötigt. Die offene Flanke bleibt die Schweiz – dort ist ODDO BHF derzeit
            ein Nischenanbieter mit einem Schild aus Genf, nicht ein Schweizer Wettbewerber.
          </p>
        </div>
      </SectionCard>

      {/* 09 – Quellen */}
      <SectionCard
        num="09"
        title="Quellen und Methodik"
        description="Alle Zahlen stammen aus veröffentlichten Unternehmensangaben und Fachpresse; sie wurden nicht bilanzanalytisch verprobt. Vergleichbarkeit ist durch abweichende Vermögensabgrenzungen, Währungen und Stichtage eingeschränkt – die jeweilige Basis ist an den Tabellen und Grafiken vermerkt. Umrechnung CHF/€ zu 1,06."
      >
        <ol className="columns-1 gap-8 text-xs leading-relaxed text-muted-foreground md:columns-2">
          {SOURCES.map((s) => (
            <li key={s.href} className="mb-1.5 break-inside-avoid list-decimal pl-1 ml-4">
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary underline decoration-dotted underline-offset-2 hover:decoration-solid"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
          Erstellt am 04.09.2026. Diese Analyse dient der Marktorientierung und stellt keine
          Anlage-, Rechts- oder Finanzberatung dar. Zahlenangaben beruhen auf öffentlich
          zugänglichen Quellen zum genannten Stand und können sich seither verändert haben; für die
          Richtigkeit der Primärangaben wird keine Gewähr übernommen.
        </p>
      </SectionCard>
    </div>
  );
}
