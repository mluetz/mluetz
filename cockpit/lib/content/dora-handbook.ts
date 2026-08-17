/**
 * DORA-Handbuch – vollständige Wissensbasis nach FRWK-DORA-001 v1.0.
 *
 * Deckt die Kapitel 1–8 und 10–15 der Gesamtbetrachtung ab.
 * Kapitel 9 (Anforderungskatalog) ist bewusst ausgenommen: Es ist als
 * interaktives Modul unter /dora/requirements umgesetzt. Kapitel 16/17
 * (Umsetzungsfahrplan, Anhang) sind Dokumentenverwaltung und nicht Teil
 * der Wissensbasis.
 *
 * Texte mit [[Begriff]]-Markierungen werden in der UI als klickbare
 * Glossarbegriffe gerendert (features/dora/knowledge-client.tsx).
 * Die Abbildungen stammen aus dem Quelldokument und liegen unter
 * public/dora/abb-NN.png.
 */

export interface HandbookFigure {
  src: string;
  width: number;
  height: number;
  caption: string;
}

/** Abbildungen 1–16 des Quelldokuments (Abb. 17 gehört zu Kap. 16 – Fahrplan). */
export const HANDBOOK_FIGURES: Record<number, HandbookFigure> = {
  1: {
    src: "/dora/abb-01.png",
    width: 2047,
    height: 1159,
    caption:
      "Regulatorische Landkarte – DORA im Verhältnis zu NIS-2, DSGVO, CRA und den normativen Umsetzungsgrundlagen",
  },
  2: {
    src: "/dora/abb-02.png",
    width: 1732,
    height: 2047,
    caption:
      "Informationsfluss zwischen den DORA-Kapiteln – Kapitel II als zentrale Steuerungsinstanz",
  },
  3: {
    src: "/dora/abb-03.png",
    width: 2046,
    height: 482,
    caption: "Threat-Intelligence-Feedback-Loop über Third- und Fourth-Party-Risiken",
  },
  4: {
    src: "/dora/abb-04.png",
    width: 2046,
    height: 1301,
    caption: "Lebenszyklus der IKT-Drittparteienbeziehung von der Strategie bis zum Exit",
  },
  5: {
    src: "/dora/abb-05.png",
    width: 1556,
    height: 2046,
    caption:
      "Fünfdimensionale Schutzbedarfsbewertung – CIA-Triade erweitert um Authentizität und Verbindlichkeit",
  },
  6: {
    src: "/dora/abb-06.png",
    width: 1834,
    height: 1382,
    caption:
      "Integrationspunkt von ISMS, BCMS und Datenschutz – die orchestrierte Vorfallbehandlung",
  },
  7: {
    src: "/dora/abb-07.png",
    width: 2046,
    height: 1155,
    caption:
      "Parallele Meldefristen nach DORA, NIS-2 und DSGVO ab dem Zeitpunkt der Kenntniserlangung",
  },
  8: {
    src: "/dora/abb-08.png",
    width: 2047,
    height: 1383,
    caption: "Ablauf eines bedrohungsgeleiteten Penetrationstests nach Art. 26 und 27 DORA",
  },
  9: {
    src: "/dora/abb-09.png",
    width: 1292,
    height: 2046,
    caption:
      "Bewertungs- und Aggregationslogik von der Einzelanforderung bis zum DORA Resilience Index",
  },
  10: {
    src: "/dora/abb-10.png",
    width: 1283,
    height: 2045,
    caption:
      "Prozess von der Feststellung über die Korrektur- und Vorbeugemaßnahme bis zur Wirksamkeitsprüfung",
  },
  11: {
    src: "/dora/abb-11.png",
    width: 2046,
    height: 670,
    caption:
      "Kennzahlenbaum vom DORA Resilience Index über die Kapitelebene bis zu den Einzelkennzahlen",
  },
  12: {
    src: "/dora/abb-12.png",
    width: 2045,
    height: 754,
    caption:
      "Verantwortlichkeiten nach dem Modell der drei Verteidigungslinien mit Bezug zu den DORA-Artikeln",
  },
  13: {
    src: "/dora/abb-13.png",
    width: 2046,
    height: 1133,
    caption:
      "Schichtenarchitektur der GRC-Lösung mit Zuordnung der DORA-Kapitel zu den operativen Modulen",
  },
  14: {
    src: "/dora/abb-14.png",
    width: 2047,
    height: 1209,
    caption:
      "Zielansicht Executive Overview des DORA-Dashboards mit Kennzahlenkacheln, Kapitelampel, Reifegradverlauf, Heatmap und Meldefristen-Monitor",
  },
  15: {
    src: "/dora/abb-15.png",
    width: 1958,
    height: 1854,
    caption: "Landkarte der Applikationsansichten mit Zielgruppen und Funktionsumfang",
  },
  16: {
    src: "/dora/abb-16.png",
    width: 2046,
    height: 1867,
    caption: "Entitäten-Beziehungs-Modell des DORA-Dashboards",
  },
};

export type HandbookBlock =
  | { kind: "p"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "list"; ordered?: boolean; items: string[] }
  | { kind: "figure"; num: number }
  | { kind: "table"; title: string; head: string[]; rows: string[][] }
  | { kind: "callout"; tone: "info" | "warn" | "danger"; title: string; text: string };

export interface HandbookSection {
  slug: string;
  /** Kapitelnummer im Quelldokument, z. B. "Kap. 3". */
  chapter: string;
  title: string;
  /** Kurzbeschreibung für die Übersichtskarte. */
  summary: string;
  groupId: string;
  /** Nummern der enthaltenen Abbildungen (für die Übersicht). */
  figures: number[];
  cockpitLinks: Array<{ label: string; href: string }>;
  blocks: HandbookBlock[];
}

export interface HandbookGroup {
  id: string;
  title: string;
  description: string;
}

/** Thematische Teile des Handbuchs – die Steuerungsebene der Übersicht. */
export const HANDBOOK_GROUPS: HandbookGroup[] = [
  {
    id: "grundlagen",
    title: "Teil A – Einordnung & Auftrag",
    description:
      "Warum es das Rahmenwerk gibt, für wen es gilt und wie DORA im Geflecht von NIS-2, DSGVO und den ISO-Normen steht.",
  },
  {
    id: "wirkungsmodell",
    title: "Teil B – Wirkungsmodell & Risikobewertung",
    description:
      "Der DORA-Regelkreis, Threat Intelligence entlang der Lieferkette und die fünfdimensionale Schutzbedarfsbewertung.",
  },
  {
    id: "integration",
    title: "Teil C – Integration, Meldewesen & Testing",
    description:
      "Zusammenspiel von ISMS, BCMS und Datenschutz, die parallelen Meldefristen und das Resilienz-Testprogramm bis zum TLPT.",
  },
  {
    id: "steuerung",
    title: "Teil D – Methodik & Steuerung",
    description:
      "Crosswalk, Reifegrad- und Scoring-Modell, Findings/CAPA, Kennzahlensystem und Governance nach den drei Verteidigungslinien.",
  },
  {
    id: "architektur",
    title: "Teil E – Architektur & Umsetzung",
    description:
      "Die GRC-Zielarchitektur, das Executive Dashboard, das Datenmodell und die Schnittstellen der Applikation.",
  },
];

export const HANDBOOK_SECTIONS: HandbookSection[] = [
  // ───────────────────────── Teil A – Einordnung & Auftrag ─────────────────────────
  {
    slug: "dokumentensteuerung",
    chapter: "Kap. 1",
    title: "Dokumentensteuerung",
    summary:
      "Zweck, Geltungsbereich und Adressaten des Rahmenwerks FRWK-DORA-001 sowie die maßgeblichen Rechtsgrundlagen.",
    groupId: "grundlagen",
    figures: [],
    cockpitLinks: [
      { label: "Anforderungskatalog", href: "/dora/requirements" },
      { label: "Compliance-Mapping", href: "/compliance" },
    ],
    blocks: [
      {
        kind: "p",
        text: "Das Rahmenwerk FRWK-DORA-001 führt drei getrennte Ausarbeitungen zur Verordnung (EU) 2022/2554 (DORA) zu einer konsolidierten Gesamtbetrachtung zusammen: das kapitelübergreifende Zusammenspiel, die operative GRC-Umsetzung einschließlich der Diagramme sowie die Abgrenzung zur NIS-2-Richtlinie. Es verfolgt drei Ziele: den Ausbau zu einem vollständigen, prüfbaren Anforderungskatalog über die DORA-Kapitel II bis VI, das Mapping jeder Anforderung auf ISO/IEC 27001:2022, ISO 22301:2019 und die NIS-2-Umsetzung im BSIG sowie eine Struktur mit Datenmodell, die unmittelbar in eine Dashboard-Applikation überführbar ist – genau das leistet dieses Cockpit.",
      },
      {
        kind: "p",
        text: "Das Dokument ersetzt keine Rechtsberatung. Es setzt die Anforderungen der DORA und der zugehörigen delegierten Rechtsakte in eine für Umsetzung und Nachweis geeignete Struktur um.",
      },
      { kind: "h3", text: "Geltungsbereich und Adressaten" },
      {
        kind: "p",
        text: "Der Geltungsbereich umfasst alle Organisationseinheiten, Prozesse, IKT-Systeme und IKT-Dienstleistungen im Anwendungsbereich der DORA nach Art. 2 – einschließlich der von [[IKT-Drittdienstleistern]] erbrachten Leistungen.",
      },
      {
        kind: "list",
        items: [
          "das [[Leitungsorgan]] als Träger der Letztverantwortung nach Art. 5 Abs. 2 DORA,",
          "die Kontrollfunktion IKT-Risikomanagement und die Informationssicherheit,",
          "das Third-Party-Risk-Management, der Einkauf und die Rechtsabteilung,",
          "der Business-Continuity-Beauftragte und das Krisenmanagement,",
          "der IT-Betrieb, die IT-Architektur und die Security Operations,",
          "die Compliance-Funktion und die Interne Revision,",
          "das Projektteam für die Umsetzung der Dashboard-Applikation.",
        ],
      },
      { kind: "h3", text: "Rechtsgrundlagen und normative Bezüge" },
      {
        kind: "table",
        title: "Tabelle 3: Rechtsgrundlagen und normative Bezüge",
        head: ["Fundstelle", "Bezeichnung", "Status"],
        rows: [
          [
            "VO (EU) 2022/2554",
            "DORA – Digital Operational Resilience Act",
            "Anwendbar seit 17.01.2025",
          ],
          [
            "VO (EU) 2022/2556",
            "DORA-Begleitrichtlinie zur Änderung sektoraler Rechtsakte",
            "In Kraft",
          ],
          ["RL (EU) 2022/2555", "NIS-2-Richtlinie", "Nationale Umsetzung erforderlich"],
          [
            "BSIG n. F. (NIS2UmsuCG)",
            "Deutsches NIS-2-Umsetzungsgesetz",
            "In Kraft seit 06.12.2025",
          ],
          ["VO (EU) 2016/679", "DSGVO", "In Kraft"],
          [
            "ISO/IEC 27001:2022",
            "Informationssicherheits-Managementsysteme",
            "Normativ, zertifizierbar",
          ],
          ["ISO 22301:2019", "Business-Continuity-Managementsysteme", "Normativ, zertifizierbar"],
          [
            "ISO/IEC 27005:2022",
            "Leitfaden zum Informationssicherheits-Risikomanagement",
            "Normativ, Methodik",
          ],
        ],
      },
    ],
  },
  {
    slug: "management-summary",
    chapter: "Kap. 2",
    title: "Management Summary",
    summary:
      "Die fünf Feststellungen, die die DORA-Umsetzung prägen – vom Regelkreis über die Meldefristen bis zur Nachweisführung als Datenproblem.",
    groupId: "grundlagen",
    figures: [],
    cockpitLinks: [
      { label: "DORA-Dashboard", href: "/dora" },
      { label: "Readiness-Report", href: "/reports/DORA_READINESS" },
    ],
    blocks: [
      {
        kind: "p",
        text: "DORA gilt seit dem 17. Januar 2025 unmittelbar in allen Mitgliedstaaten. Sie ist keine Empfehlung und kein Rahmenwerk zur freien Auslegung, sondern unmittelbar anwendbares Recht mit einem eng gefassten Nachweisregime. Für Finanzunternehmen verschiebt sich die Prüfungsfrage von „Haben Sie Sicherheitsmaßnahmen?“ zu „Können Sie deren Wirksamkeit jederzeit belegen?“.",
      },
      { kind: "h3", text: "Fünf Feststellungen prägen die Umsetzung" },
      {
        kind: "list",
        ordered: true,
        items: [
          "Die Kapitel greifen ineinander. DORA ist als Regelkreis konstruiert: Eine Lücke im Testprogramm (Kapitel IV) erzeugt zwangsläufig blinde Flecken im Risikomanagement (Kapitel II) und erhöht die Wahrscheinlichkeit unerkannter Vorfälle (Kapitel III). Eine kapitelweise Abarbeitung in Silos führt systematisch zu Feststellungen.",
          "Die [[Meldefristen]] sind schärfer als unter NIS-2. Die Erstmeldung eines schwerwiegenden Vorfalls ist binnen vier Stunden nach dessen Klassifizierung und spätestens 24 Stunden nach Kenntniserlangung abzusetzen – ohne vorbereitete Klassifizierungslogik und Bereitschaftsorganisation praktisch nicht einzuhalten.",
          "Das Drittparteienrisiko ist der aufwendigste Block. Das [[Informationsregister]] nach Art. 28 Abs. 3 ist jährlich einzureichen und wird gegen die Validierungsregeln der [[ESAs]] geprüft. Hinzu kommen zwingende Vertragsklauseln nach Art. 30 sowie dokumentierte und getestete [[Ausstiegsstrategien]] für jeden Dienstleister kritischer Funktionen.",
          "Die klassische CIA-Triade reicht nicht. Für den Finanzsektor sind Authentizität und Verbindlichkeit gleichrangige Schutzziele. Ohne manipulationssichere Audit-Trails ist die von DORA geforderte Ursachenanalyse nach einem Vorfall nicht führbar – auch dann nicht, wenn das System technisch fehlerfrei läuft.",
          "Nachweisführung ist ein Datenproblem. Die Zahl der zu belegenden Einzelanforderungen, die Verknüpfung von Anforderung, Asset, Funktion, Dienstleister, Vorfall und Nachweis sowie die kurzen Fristen machen eine dokumentenbasierte Verwaltung unpraktikabel – genau hier setzt die in Kapitel 15 spezifizierte Applikation an.",
        ],
      },
      {
        kind: "p",
        text: "Der Katalog gliedert die Kapitel II bis VI der DORA in 133 prüfbare Einzelanforderungen. 122 davon sind MUSS-Anforderungen, 98 sind knockout-relevant: Wird eine dieser Anforderungen mit einem [[Reifegrad]] unterhalb der Stufe 3 bewertet, ist der Status des betroffenen Kapitels unabhängig vom rechnerischen Mittelwert auf Rot zu setzen. Diese Übersteuerung verhindert, dass gute Durchschnittswerte eine harte Compliance-Lücke verdecken.",
      },
      {
        kind: "callout",
        tone: "info",
        title: "Kernaussage",
        text: "DORA verlangt keine Neuerfindung bestehender Managementsysteme, sondern deren tiefe Integration und lückenlose Nachweisbarkeit. Der wirtschaftlichste Weg führt über die Wiederverwendung vorhandener ISO/IEC-27001- und ISO-22301-Kontrollen – ergänzt um die DORA-spezifischen Verschärfungen bei Testtiefe, Drittparteienrisiko und Meldefristen. Der Crosswalk (Kap. 10) weist diese Wiederverwendung je Anforderung nach.",
      },
    ],
  },
  {
    slug: "regulatorischer-rahmen",
    chapter: "Kap. 3",
    title: "Regulatorischer Rahmen",
    summary:
      "DORA im Überblick, die regulatorische Landkarte, die Abgrenzung zu NIS-2 (lex specialis) und die delegierten Rechtsakte (RTS/ITS).",
    groupId: "grundlagen",
    figures: [1],
    cockpitLinks: [
      { label: "Compliance-Mapping", href: "/compliance" },
      { label: "Anforderungskatalog", href: "/dora/requirements" },
    ],
    blocks: [
      {
        kind: "p",
        text: "DORA verfolgt das Ziel, ein einheitliches und hohes Niveau der digitalen operationalen Resilienz im europäischen Finanzsektor herzustellen. Der Regelungsansatz ist fünfteilig: IKT-Risikomanagement und Governance (Kapitel II), Behandlung und Meldung IKT-bezogener Vorfälle (Kapitel III), Testen der digitalen operationalen Resilienz (Kapitel IV), Management des IKT-Drittparteienrisikos einschließlich der unmittelbaren Überwachung kritischer Dienstleister (Kapitel V) und Vereinbarungen über den Austausch von Informationen (Kapitel VI).",
      },
      {
        kind: "p",
        text: "Als Verordnung gilt DORA unmittelbar; ein nationaler Umsetzungsakt ist nicht erforderlich, nationale Abweichungen sind grundsätzlich ausgeschlossen. Die inhaltliche Konkretisierung erfolgt über delegierte Verordnungen und Durchführungsverordnungen ([[RTS/ITS]]), die ihrerseits unmittelbar gelten. Art. 4 verankert das [[Verhältnismäßigkeitsprinzip]]: Es reduziert nicht die Zahl der anwendbaren Pflichten, sondern die Tiefe ihrer Ausgestaltung.",
      },
      { kind: "h3", text: "Regulatorische Landkarte" },
      {
        kind: "p",
        text: "Die Landkarte ordnet DORA in das Geflecht der angrenzenden Rechtsakte und Normen ein. Entscheidend ist das Verhältnis zur NIS-2-Richtlinie: Nach dem Grundsatz [[lex specialis]] verdrängt DORA als das speziellere Recht für den Finanzsektor die allgemeinen Anforderungen der NIS-2-Richtlinie, soweit sie denselben Regelungsgegenstand betreffen.",
      },
      { kind: "figure", num: 1 },
      { kind: "h3", text: "Abgrenzung von DORA und NIS-2" },
      {
        kind: "table",
        title: "Tabelle 5: Kernunterschiede zwischen DORA und der NIS-2-Richtlinie",
        head: ["Merkmal", "DORA – VO (EU) 2022/2554", "NIS-2 – RL (EU) 2022/2555 / BSIG n. F."],
        rows: [
          [
            "Rechtsnatur",
            "EU-Verordnung. Gilt unmittelbar und in allen Mitgliedstaaten identisch, ohne nationalen Umsetzungsakt.",
            "EU-Richtlinie. Muss in nationales Recht umgesetzt werden – in Deutschland durch das BSIG n. F. Nationale Abweichungen sind möglich.",
          ],
          [
            "Geltungsbereich",
            "Sektorspezifisch: rund 20 Kategorien von Finanzunternehmen sowie deren IKT-Drittdienstleister.",
            "Sektorübergreifend: 18 kritische und wichtige Sektoren, u. a. Energie, Verkehr, Gesundheit, verarbeitendes Gewerbe, digitale Infrastrukturen.",
          ],
          [
            "Regelungstiefe",
            "Tiefe Resilienz: Business Continuity, Disaster Recovery, Wiederherstellungsziele, umfassende Tests bis hin zu TLPT.",
            "Breite Basissicherheit: grundlegendes Cybersicherheitsniveau und Meldepflichten in der Breite der Wirtschaft.",
          ],
          [
            "Drittparteienrisiko",
            "Direkte Aufsicht: Als kritisch eingestufte IKT-Drittdienstleister werden unmittelbar durch einen federführenden Überwacher der ESAs geprüft.",
            "Indirekte Aufsicht: Unternehmen sichern ihre Lieferkette selbst ab; geprüft wird i. d. R. nur das beauftragende Unternehmen.",
          ],
          [
            "Meldefristen",
            "Erstmeldung binnen 4 h nach Klassifizierung als schwerwiegend, spätestens 24 h nach Kenntnis; Zwischenmeldung 72 h nach Erstmeldung; Abschlussmeldung 1 Monat.",
            "Frühwarnung binnen 24 h nach Kenntnis; Meldung binnen 72 h nach Kenntnis; Abschlussbericht binnen 1 Monat nach der Meldung.",
          ],
          [
            "Vertragsanforderungen",
            "Verpflichtendes Informationsregister mit jährlicher Einreichung; zwingende Pflichtklauseln nach Art. 30 inkl. Auditrechten, Kündigungsgründen, Ausstiegsstrategien.",
            "Vertragliche Weitergabe von Sicherheitsanforderungen an Zulieferer; kein zentrales Vertragsregister, keine abschließend normierten Pflichtklauseln.",
          ],
          [
            "Testpflichten",
            "Jährliche Tests aller Systeme kritischer Funktionen; TLPT mindestens alle drei Jahre für benannte Unternehmen.",
            "Risikobasierte Bewertung der Wirksamkeit; keine normierte TLPT-Pflicht.",
          ],
          [
            "Aufsicht in Deutschland",
            "BaFin, unterstützt durch EZB und die ESAs (EBA, ESMA, EIOPA).",
            "Bundesamt für Sicherheit in der Informationstechnik (BSI).",
          ],
          [
            "Leitungsverantwortung",
            "Letztverantwortung des Leitungsorgans (Art. 5 Abs. 2) mit ausdrücklicher Fortbildungspflicht (Art. 5 Abs. 4).",
            "Billigungs- und Überwachungspflicht der Geschäftsleitung mit persönlicher Haftung (§ 38 BSIG); Schulungspflicht.",
          ],
        ],
      },
      {
        kind: "p",
        text: "Für ein Finanzunternehmen, das zugleich unter beide Regelwerke fallen könnte, gilt: Die spezifischen Anforderungen der DORA haben Vorrang. Die praktische Konsequenz ist keine Befreiung, sondern eine Verschärfung – DORA übernimmt das Basisniveau der NIS-2 und schneidet es passgenau auf den Finanzsektor zu.",
      },
      { kind: "h3", text: "Überschneidungen und Synergien" },
      {
        kind: "list",
        items: [
          "Vorfallmanagement und Meldewesen: Der Prozessaufbau (Erstmeldung, Zwischenmeldung, Abschlussbericht) ist weitgehend deckungsgleich; Unterschiede liegen in Fristensystematik, Adressat (BSI vs. BaFin) und Klassifizierungstiefe – DORA verlangt eine erheblich detailliertere Klassifizierung nach sieben Kriterien.",
          "Risikomanagement und Business Continuity: Beide fordern eine abteilungsübergreifende Risikoanalyse und Verantwortung der Geschäftsleitung. DORA geht deutlich tiefer: konkrete Vorgaben zur Netzwerktrennung, zu Backup-Strategien und exakt definierte Wiederherstellungsziele ([[RTO/RPO]]) je kritischer Funktion.",
          "Lieferkettensicherheit: NIS-2 verlangt die Bewertung der eigenen Lieferkette und vertragliche Weitergabe von Sicherheitsanforderungen. DORA verschärft radikal: verpflichtendes Informationsregister, zwingende Vertragsklauseln inkl. Auditrechten und vollständige, getestete Ausstiegsstrategien.",
        ],
      },
      { kind: "h3", text: "Delegierte Rechtsakte – RTS und ITS" },
      {
        kind: "p",
        text: "Die operative Verbindlichkeit der DORA entsteht erst über die delegierten Rechtsakte. Sie konkretisieren u. a. den Risikomanagementrahmen, die Vorfallklassifizierung, die Meldeformulare, das Informationsregister und die Durchführung bedrohungsgeleiteter Penetrationstests. Ohne Kenntnis dieser Rechtsakte ist eine belastbare Umsetzung nicht möglich.",
      },
      {
        kind: "table",
        title: "Tabelle 6: Delegierte Verordnungen und Durchführungsverordnungen zur DORA",
        head: ["Rechtsakt", "DORA-Mandat", "Regelungsgegenstand", "Status / Geltung"],
        rows: [
          [
            "DelVO (EU) 2024/1774",
            "Art. 15, 16 Abs. 3",
            "IKT-Risikomanagementrahmen und vereinfachter Rahmen",
            "17.01.2025",
          ],
          [
            "DelVO (EU) 2024/1772",
            "Art. 18 Abs. 3",
            "Klassifizierung schwerwiegender IKT-Vorfälle und erheblicher Cyberbedrohungen",
            "17.01.2025",
          ],
          [
            "DelVO (EU) 2024/1773",
            "Art. 28 Abs. 10",
            "Leitlinie für IKT-Dienstleistungen zur Unterstützung kritischer Funktionen",
            "17.01.2025",
          ],
          [
            "DfVO (EU) 2024/2956",
            "Art. 28 Abs. 9",
            "Informationsregister – Vorlagen und Taxonomie",
            "In Kraft, jährliche Einreichung",
          ],
          [
            "DelVO (EU) 2024/1502",
            "Art. 31 Abs. 6",
            "Kriterien für die Einstufung kritischer IKT-Drittdienstleister (CTPP)",
            "2024",
          ],
          [
            "DelVO (EU) 2024/1505",
            "Art. 43 Abs. 2",
            "Überwachungsgebühren für benannte CTPP",
            "30.05.2024",
          ],
          [
            "DelVO (EU) 2025/295",
            "Art. 41 Abs. 1",
            "Harmonisierung der Überwachungstätigkeit (Lead-Overseer-Regime)",
            "13.02.2025",
          ],
          [
            "DelVO (EU) 2025/301",
            "Art. 20 lit. a",
            "Vorfallmeldung – Inhalte und Fristen",
            "20.02.2025",
          ],
          [
            "DfVO (EU) 2025/302",
            "Art. 20 lit. b",
            "Vorfallmeldung – Formulare, Muster und Verfahren",
            "20.02.2025",
          ],
          [
            "DelVO (EU) 2025/420",
            "Art. 41 Abs. 1 lit. c",
            "Gemeinsame Prüfungsteams (Joint Examination Teams)",
            "16.12.2024",
          ],
          [
            "DelVO (EU) 2025/532",
            "Art. 30 Abs. 5",
            "Unterauftragsvergabe bei IKT-Dienstleistungen für kritische Funktionen",
            "22.07.2025",
          ],
          [
            "DelVO (EU) 2025/1190",
            "Art. 26 Abs. 11",
            "Bedrohungsgeleitete Penetrationstests (TLPT)",
            "08.07.2025",
          ],
        ],
      },
    ],
  },

  // ─────────────────── Teil B – Wirkungsmodell & Risikobewertung ───────────────────
  {
    slug: "zusammenspiel",
    chapter: "Kap. 4",
    title: "Das kapitelübergreifende Zusammenspiel",
    summary:
      "DORA als Regelkreis: Kapitel II als zentrale Steuerungsinstanz und die neun Wirkungsketten zwischen den Kapiteln.",
    groupId: "wirkungsmodell",
    figures: [2],
    cockpitLinks: [
      { label: "DORA-Dashboard", href: "/dora" },
      { label: "Risk Register", href: "/risks" },
    ],
    blocks: [
      {
        kind: "p",
        text: "DORA ist kein statisches Regelwerk, das mit Checklisten abgearbeitet wird. Die Kapitel II bis VI bilden ein dynamisches, ineinandergreifendes System – einen Regelkreis. Eine Schwäche in einem Bereich wirkt unmittelbar auf die anderen.",
      },
      {
        kind: "p",
        text: "Kapitel II (IKT-Risikomanagement und Governance) bildet das Zentrum: Dort werden die Strategie definiert, das Risikoregister geführt und der Risikoappetit festgelegt. Alle übrigen Kapitel speisen Informationen in dieses Zentrum ein oder werden von dort gesteuert.",
      },
      { kind: "figure", num: 2 },
      {
        kind: "p",
        text: "Durchgezogene Pfeile: gesteuerter Regelkreis. Gestrichelte Pfeile: anlassbezogene Auslöser.",
      },
      { kind: "h3", text: "Die neun Wirkungsketten im Einzelnen" },
      {
        kind: "list",
        ordered: true,
        items: [
          "Kapitel VI liefert externe Bedrohungsinformationen. Neue Angriffsvektoren und Schwachstellen fließen als Eingangsgröße in die Risikobewertung ein.",
          "Kapitel V erweitert den Betrachtungsrahmen über die eigene Unternehmensgrenze hinaus. Provider-Risiken und die Vertragslage werden Bestandteil des Risikoregisters.",
          "Kapitel II definiert daraus den Test-Scope und die Testfrequenz. Getestet wird, was risikoseitig relevant ist – nicht, was technisch bequem ist.",
          "Kapitel IV liefert die Validierung zurück. Testbefunde sind Tatsachen und korrigieren die theoretische Risikobewertung.",
          "Kapitel II stellt für den Ernstfall die Fortführungs- und Wiederanlaufpläne bereit, auf die das Vorfallmanagement zugreift.",
          "Kapitel III führt nach jedem schwerwiegenden Vorfall die Erkenntnisse in das Risikoregister zurück. Ohne diesen Rücklauf verliert der Regelkreis seine Lernfähigkeit.",
          "Ein Vorfall bei einem Dienstleister löst unmittelbar eine Vertrags- und Exit-Prüfung nach Kapitel V aus.",
          "Erhebliche Cyberbedrohungen können nach Art. 19 Abs. 2 freiwillig gemeldet und in den Informationsaustausch zurückgegeben werden.",
          "Dienstleister kritischer Funktionen sind nach Art. 26 Abs. 3 in die bedrohungsgeleiteten Tests einzubeziehen.",
        ],
      },
      {
        kind: "callout",
        tone: "warn",
        title: "Prüfungsrelevanz",
        text: "Der Rücklauf aus dem Vorfallmanagement in das Risikoregister (Kette 6) und der Einbezug der Dienstleister in das Testprogramm (Kette 9) sind die beiden Stellen, an denen Prüfungen am häufigsten Feststellungen erzeugen. Beide sind im Katalog als knockout-relevant klassifiziert.",
      },
    ],
  },
  {
    slug: "threat-intelligence",
    chapter: "Kap. 5",
    title: "Threat Intelligence und Drittparteienrisiko",
    summary:
      "Der Threat-Intelligence-Feedback-Loop, Third-/Fourth-Party-Risiken und der Lebenszyklus der Drittparteienbeziehung.",
    groupId: "wirkungsmodell",
    figures: [3, 4],
    cockpitLinks: [
      { label: "Third Parties", href: "/third-parties" },
      { label: "Konzentrationsanalyse", href: "/third-parties/concentration" },
    ],
    blocks: [
      {
        kind: "p",
        text: "Kapitel VI ist kein optionaler Zusatz, sondern der Treibstoff für ein proaktives DORA-Setup. Besonders kritisch ist dies im Kontext der Lieferkette: Angreifer kompromittieren heute selten das Finanzinstitut direkt – sie greifen den IT-Dienstleister (Third Party) oder dessen Software-Zulieferer (Fourth Party) an.",
      },
      { kind: "h3", text: "Der Threat-Intelligence-Feedback-Loop" },
      {
        kind: "p",
        text: "Der Feedback-Loop zwingt dazu, externe Warnungen ([[Cyberbedrohungsinformationen]]) über das GRC-System in messbare interne Aktionen zu übersetzen. Entscheidend ist der zweite Schritt: Ohne ein vollständiges und aktuelles [[Informationsregister]] lässt sich nicht beantworten, welche der eigenen Dienstleister eine gemeldete Schwachstelle überhaupt betrifft.",
      },
      { kind: "figure", num: 3 },
      {
        kind: "p",
        text: "Die im Dashboard geführte Kennzahl [[Time to Assess]] misst die Zeit vom Eingang eines externen Alerts bis zum abgeschlossenen Registerabgleich. Sie ist der belastbarste Einzelindikator für die Reife des Zusammenspiels von Kapitel V und Kapitel VI.",
      },
      { kind: "h3", text: "Third- und Fourth-Party-Risiken" },
      {
        kind: "p",
        text: "Die Verantwortung des Finanzunternehmens endet nicht beim direkten Vertragspartner. Art. 29 Abs. 2 verlangt ausdrücklich die Bewertung von Unterauftragsverhältnissen, insbesondere bei Unterauftragnehmern in Drittländern. Die DelVO (EU) 2025/532 konkretisiert die Anforderungen an die Steuerung der [[Subunternehmerkette]] bei Dienstleistungen, die kritische oder wichtige Funktionen unterstützen.",
      },
      {
        kind: "p",
        text: "Praktisch bedeutet das: Die Kette ist bis zu den wesentlichen Unterauftragnehmern zu erfassen, im Informationsregister abzubilden und laufend zu überwachen. Zustimmungsvorbehalte für den Wechsel wesentlicher Unterauftragnehmer gehören in den Vertrag.",
      },
      { kind: "h3", text: "Lebenszyklus der Drittparteienbeziehung" },
      {
        kind: "p",
        text: "Die Anforderungen des Kapitels V lassen sich als durchgehender Lebenszyklus lesen. Der Registereintrag ist dabei kein Verwaltungsakt am Ende, sondern der Drehpunkt: Er ist zugleich aufsichtliche Pflicht und interne Datenbasis für die Konzentrations- und Abhängigkeitsanalyse ([[Konzentrationsrisiko]]).",
      },
      { kind: "figure", num: 4 },
    ],
  },
  {
    slug: "fuenf-dimensionen",
    chapter: "Kap. 6",
    title: "Erweiterte Risikobewertung – die fünf Dimensionen",
    summary:
      "Von der CIA-Triade zur fünfdimensionalen Schutzbedarfsbewertung mit Authentizität und Verbindlichkeit – inkl. Maximumprinzip und NO-GO-Regel.",
    groupId: "wirkungsmodell",
    figures: [5],
    cockpitLinks: [
      { label: "Risk Register", href: "/risks" },
      { label: "Assets", href: "/admin" },
    ],
    blocks: [
      {
        kind: "p",
        text: "Die klassische Bewertung von Informationssicherheitsrisiken beruht auf der CIA-Triade aus Vertraulichkeit, Integrität und Verfügbarkeit. Für den Finanzsektor und für DORA reicht diese Betrachtung nicht aus – zwei zusätzliche Dimensionen sind erforderlich, um operative Resilienz in einer stark vernetzten Lieferkette überhaupt bewerten zu können:",
      },
      {
        kind: "list",
        items: [
          "Authentizität: Es muss zweifelsfrei und kryptografisch belegbar sein, dass ein Akteur – Mensch oder Maschine – derjenige ist, der er vorgibt zu sein. Bei der Anbindung von Drittanbietern über Schnittstellen muss die Authentizität jeder Anfrage gesichert sein; ein Mangel führt unmittelbar zu hohem IKT-Risiko durch Spoofing.",
          "Verbindlichkeit (Non-Repudiation): Eine durchgeführte Aktion darf im Nachhinein nicht bestreitbar sein. Für die forensische Analyse nach einem Vorfall sind unveränderliche Audit-Trails zwingend. Ohne sie ist die von DORA geforderte Ursachenanalyse wertlos, weil Angreifer ihre Spuren verwischen könnten.",
        ],
      },
      { kind: "figure", num: 5 },
      { kind: "h3", text: "Bewertungsskala und Ableitung des Schutzbedarfs" },
      {
        kind: "p",
        text: "Jede der fünf Dimensionen wird auf einer fünfstufigen Skala bewertet. Der Gesamtschutzbedarf eines Assets ergibt sich nach dem [[Maximumprinzip]] aus der höchsten Einzelbewertung; eine Mittelwertbildung ist ausdrücklich unzulässig, weil sie einen kritischen Einzelbefund verdecken würde.",
      },
      {
        kind: "table",
        title: "Tabelle 7: Bewertungsskala je Schutzdimension",
        head: ["Stufe", "Bezeichnung", "Auswirkung bei Verletzung des Schutzziels"],
        rows: [
          [
            "1",
            "Vernachlässigbar",
            "Keine spürbare Auswirkung auf Geschäftsprozesse, Kunden oder regulatorische Pflichten.",
          ],
          [
            "2",
            "Gering",
            "Begrenzte interne Auswirkung, mit vorhandenen Mitteln kurzfristig kompensierbar.",
          ],
          [
            "3",
            "Mittel",
            "Spürbare Beeinträchtigung von Prozessen oder Kunden; Kompensation erfordert erhöhten Aufwand.",
          ],
          [
            "4",
            "Hoch",
            "Erhebliche Beeinträchtigung einer kritischen oder wichtigen Funktion; Meldepflichten möglich.",
          ],
          [
            "5",
            "Sehr hoch",
            "Ausfall oder Kompromittierung einer kritischen Funktion mit aufsichtlicher und reputationeller Relevanz.",
          ],
        ],
      },
      { kind: "h3", text: "Operative Auswirkung im GRC-System" },
      {
        kind: "p",
        text: "Bei der Risikoanalyse eines kritischen Assets sind alle fünf Dimensionen zu erheben. Beispiel Zahlungsdienstleister-Schnittstelle: Die Vertraulichkeit mag nur mittelmäßig zu bewerten sein, wenn ausschließlich Token ausgetauscht werden – Verfügbarkeit und Authentizität sind jedoch zwingend mit den höchsten Stufen zu bewerten. Ergibt ein Penetrationstest nach Kapitel IV, dass die Protokolle dieser Schnittstelle nachträglich manipulierbar sind, reißt der Schutzbedarf in der Dimension Verbindlichkeit: Das Gesamtrisiko ist unmittelbar in den roten Bereich einzustufen, weil die Nachweispflicht im Vorfallszenario nicht mehr erfüllbar ist – selbst wenn das System technisch fehlerfrei läuft.",
      },
      {
        kind: "callout",
        tone: "danger",
        title: "Knockout-Regel",
        text: "Wird bei einem Asset, das eine kritische oder wichtige Funktion unterstützt, eine der fünf Dimensionen mit einem Erfüllungsgrad unterhalb der Stufe 3 bewertet, gilt das Asset als NO-GO. Der Befund ist zwingend als Finding mit Korrekturmaßnahme zu erfassen und an das Leitungsorgan zu berichten.",
      },
    ],
  },

  // ─────────────── Teil C – Integration, Meldewesen & Testing ───────────────
  {
    slug: "integration-isms-bcms",
    chapter: "Kap. 7",
    title: "Integration von ISMS, BCMS und Datenschutz",
    summary:
      "Der Sweet Spot der Integration bei der Vorfallbehandlung und die parallelen Meldepflichten nach DORA, NIS-2 und DSGVO.",
    groupId: "integration",
    figures: [6, 7],
    cockpitLinks: [
      { label: "Vorfälle & Meldefristen", href: "/dora/incidents" },
      { label: "Playbooks", href: "/playbooks" },
    ],
    blocks: [
      {
        kind: "p",
        text: "DORA fordert keine völlige Neuerfindung des Rades. Die Verordnung zwingt Unternehmen vielmehr dazu, ihre historisch gewachsenen und oft getrennt geführten Managementsysteme tief miteinander zu integrieren:",
      },
      {
        kind: "list",
        items: [
          "ISMS nach ISO/IEC 27001:2022 – Fokus auf der Sicherstellung der Schutzziele; liefert die präventiven Kontrollen und das tägliche operative Sicherheitsmanagement.",
          "BCMS nach ISO 22301:2019 – Fokus auf der Aufrechterhaltung kritischer Geschäftsprozesse im Krisenfall; DORA fordert in Kapitel II ausdrücklich vorhandene und getestete Fortführungs- und Wiederanlaufpläne für IKT-Systeme.",
          "Datenschutz nach DSGVO – Fokus auf dem Schutz personenbezogener Daten; ein IKT-Vorfall ist sehr häufig zugleich eine Verletzung des Schutzes personenbezogener Daten.",
        ],
      },
      { kind: "h3", text: "Der Sweet Spot der Integration" },
      {
        kind: "p",
        text: "Die drei Systeme überschneiden sich massiv bei der Vorfallbehandlung und beim Drittparteienrisiko. Wird ein Dienstleister kompromittiert, müssen drei Pflichtenstränge parallel und ohne Zeitverlust anlaufen.",
      },
      { kind: "figure", num: 6 },
      {
        kind: "p",
        text: "Am Beispiel eines Ransomware-Angriffs bei einem Dienstleister: Das Werkzeug orchestriert die parallele Reaktion. Der CISO klassifiziert den Vorfall nach Art. 18 und meldet ihn nach DORA an die Finanzaufsicht. Gleichzeitig triggert das System für den BCM-Verantwortlichen die Fortführungspläne, um den Betrieb ohne den Dienstleister aufrechtzuerhalten. Parallel prüft es das Asset-Register auf Betroffenheit personenbezogener Daten und alarmiert bei Bedarf den Datenschutzbeauftragten.",
      },
      { kind: "h3", text: "Parallele Meldepflichten und Fristen" },
      {
        kind: "p",
        text: "Die Fristensysteme der drei Regelwerke laufen ab demselben Zeitpunkt – der Kenntniserlangung –, folgen aber unterschiedlichen Logiken. Die DORA-Erstmeldung knüpft an die Klassifizierung als schwerwiegend an, kennt aber eine absolute Obergrenze von 24 Stunden ab Kenntnis. Die NIS-2-Frühwarnung knüpft unmittelbar an die Kenntnis an.",
      },
      { kind: "figure", num: 7 },
      {
        kind: "table",
        title: "Tabelle 8: Meldefristen im direkten Vergleich",
        head: ["Meldestufe", "DORA (Art. 19, RTS 2025/301)", "NIS-2 / BSIG n. F.", "DSGVO"],
        rows: [
          [
            "Erstmeldung / Frühwarnung",
            "4 Stunden nach Klassifizierung als schwerwiegend, spätestens 24 Stunden nach Kenntniserlangung",
            "24 Stunden nach Kenntniserlangung",
            "–",
          ],
          [
            "Zwischenmeldung / Meldung",
            "72 Stunden nach der Erstmeldung; unverzüglich bei Wiederherstellung des Regelbetriebs",
            "72 Stunden nach Kenntniserlangung",
            "72 Stunden nach Kenntniserlangung (Art. 33 DSGVO)",
          ],
          [
            "Abschlussmeldung",
            "1 Monat nach der letzten Zwischenmeldung",
            "1 Monat nach der Meldung",
            "–",
          ],
          [
            "Benachrichtigung Betroffener",
            "Unverzüglich, sofern finanzielle Interessen von Kunden berührt sind (Art. 19 Abs. 3)",
            "Unterrichtung der Empfänger bei erheblichen Auswirkungen (§ 35 BSIG)",
            "Unverzüglich bei hohem Risiko (Art. 34 DSGVO)",
          ],
          [
            "Meldekanal",
            "BaFin, Melde- und Veröffentlichungsportal (MVP)",
            "BSI-Meldeportal",
            "Zuständige Datenschutzaufsichtsbehörde",
          ],
          [
            "Formular",
            "Harmonisierte Vorlagen nach DfVO (EU) 2025/302",
            "Nationale Formulare des BSI",
            "Landesspezifische Formulare",
          ],
        ],
      },
      {
        kind: "callout",
        tone: "warn",
        title: "Häufiger Umsetzungsfehler",
        text: "In vielen Konzepten wird die DORA-Erstmeldung mit 24 Stunden angesetzt und damit mit der NIS-2-Frühwarnung gleichgesetzt. Das ist unzutreffend: Maßgeblich sind vier Stunden ab Klassifizierung als schwerwiegend, wobei die Klassifizierung selbst so zügig zu erfolgen hat, dass die absolute Grenze von 24 Stunden ab Kenntnis eingehalten wird. Wer die Klassifizierung verzögert, verletzt die Frist trotz formaler Einhaltung der 24 Stunden.",
      },
    ],
  },
  {
    slug: "resilienz-testing",
    chapter: "Kap. 8",
    title: "Resilienz-Testing und TLPT",
    summary:
      "Das Testprogramm nach Art. 24/25 und der bedrohungsgeleitete Penetrationstest (TLPT) nach Art. 26/27 mit dem Drei-Jahres-Zyklus.",
    groupId: "integration",
    figures: [8],
    cockpitLinks: [
      { label: "Kontrollbibliothek", href: "/controls" },
      { label: "Katalog: Kapitel IV", href: "/dora/requirements?chapter=K4" },
    ],
    blocks: [
      { kind: "h3", text: "Testprogramm nach Art. 24 und 25" },
      {
        kind: "p",
        text: "Art. 24 verlangt ein solides und umfassendes Testprogramm als integralen Bestandteil des Risikomanagementrahmens. Der Ansatz ist risikobasiert; Tests sind von unabhängigen Parteien durchzuführen und festgestellte Schwachstellen sind vollständig und fristgerecht zu beheben.",
      },
      {
        kind: "p",
        text: "Art. 25 konkretisiert die Testarten. Alle Systeme, die zur Unterstützung [[kritischer oder wichtiger Funktionen]] eingesetzt werden, sind mindestens jährlich zu testen. Das Spektrum reicht von Schwachstellenscans und Analysen quelloffener Software über Quellcodeprüfungen, Szenario- und Leistungstests bis zu End-to-End- und Penetrationstests. Der Nachweis ist je Testart und je System zu führen.",
      },
      { kind: "h3", text: "Der TLPT-Prozess nach Art. 26 und 27" },
      {
        kind: "p",
        text: "Bedrohungsgeleitete Penetrationstests ([[TLPT]]) sind die anspruchsvollste Prüfform der DORA. Sie sind nicht von allen Finanzunternehmen zu erbringen, sondern von denen, die die zuständige Behörde anhand ihrer Bedeutung für den Finanzsektor, der Finanzstabilität und ihres IKT-Risikoprofils benennt. Der Zyklus beträgt mindestens drei Jahre.",
      },
      { kind: "figure", num: 8 },
      {
        kind: "p",
        text: "Zwei Punkte werden in der Praxis regelmäßig unterschätzt: Erstens ist der Scope vor Testbeginn durch die zuständige Behörde zu validieren; er umfasst zwingend auch ausgelagerte Leistungen. Zweitens sind die Tester-Anforderungen des Art. 27 hart – bedeutende Kreditinstitute dürfen ausschließlich externe Tester einsetzen, andere Unternehmen müssen mindestens jeden dritten Test extern durchführen lassen.",
      },
      {
        kind: "p",
        text: "Die DelVO (EU) 2025/1190 konkretisiert Methodik, Phasenmodell ([[TIBER-EU]]) und Anforderungen an die Beteiligten. Die von der Behörde ausgestellte Bescheinigung über die ordnungsgemäße Durchführung ermöglicht die gegenseitige Anerkennung in der gesamten Union und ist revisionssicher zu archivieren.",
      },
    ],
  },

  // ─────────────────────── Teil D – Methodik & Steuerung ───────────────────────
  {
    slug: "crosswalk",
    chapter: "Kap. 10",
    title: "Crosswalk zu ISO 27001, ISO 22301 und NIS-2",
    summary:
      "Methodik des Norm-Mappings: vorhandene Kontrollen nachnutzen, Doppelarbeit vermeiden – Zuordnung, keine Gleichsetzung.",
    groupId: "steuerung",
    figures: [],
    cockpitLinks: [
      { label: "Katalog mit Crosswalk je Anforderung", href: "/dora/requirements" },
      { label: "Compliance-Mapping", href: "/compliance" },
    ],
    blocks: [
      {
        kind: "p",
        text: "Der Crosswalk weist für jede DORA-Anforderung die inhaltlich korrespondierenden Anforderungen der etablierten Managementsystemnormen sowie der NIS-2-Umsetzung im BSIG aus. Er dient zwei Zwecken: der Vermeidung von Doppelarbeit bei bestehenden Zertifizierungen und dem Nachweis gegenüber Prüfern, dass vorhandene Kontrollen bewusst nachgenutzt werden.",
      },
      {
        kind: "callout",
        tone: "info",
        title: "Zuordnung, keine Gleichsetzung",
        text: "Eine Übereinstimmung bedeutet, dass die vorhandene Kontrolle einen belastbaren Ausgangspunkt bildet – nicht, dass die DORA-Anforderung damit bereits erfüllt ist. Wo DORA über die Norm hinausgeht, ist der Zusatzaufwand in der Reifegradbewertung (Kap. 11) zu berücksichtigen.",
      },
      {
        kind: "p",
        text: "Ein Bindestrich bedeutet, dass keine sinnvolle Entsprechung besteht. Das ist regelmäßig bei den finanzsektorspezifischen Anforderungen der Fall – etwa beim [[Informationsregister]], bei den [[TLPT]]-Vorgaben und beim Überwachungsrahmen für kritische Dienstleister ([[CTPP]]).",
      },
      {
        kind: "p",
        text: "Die vollständigen Crosswalk-Tabellen (Tabellen 16–20 des Quelldokuments, alle 133 Anforderungen) sind im Cockpit datenbankgestützt umgesetzt: Jede Detailseite einer Anforderung im Anforderungskatalog zeigt die Zuordnung zu ISO/IEC 27001:2022, ISO 22301:2019, NIS-2/BSIG n. F. und den einschlägigen RTS/ITS.",
      },
      {
        kind: "table",
        title: "Leseprobe: Crosswalk-Auszug aus Kapitel II",
        head: [
          "DORA-ID",
          "ISO/IEC 27001:2022",
          "ISO 22301:2019",
          "NIS-2 / BSIG n. F.",
          "RTS / ITS",
        ],
        rows: [
          [
            "DORA-K2-001",
            "5.1, 5.3, A.5.1, A.5.2",
            "5.1, 5.3",
            "§ 30 Abs. 1, § 38 BSIG",
            "DelVO 2024/1774",
          ],
          ["DORA-K2-004", "6.1.2, 6.1.3", "8.2.2", "§ 30 Abs. 2 BSIG", "DelVO 2024/1774 Art. 3"],
          ["DORA-K2-007", "A.5.19, A.5.20", "8.1", "§ 30 Abs. 2 Nr. 4 BSIG", "DelVO 2024/1773"],
          ["DORA-K6-001", "A.5.6, A.5.7", "–", "§ 34 BSIG", "–"],
        ],
      },
    ],
  },
  {
    slug: "reifegrad-scoring",
    chapter: "Kap. 11",
    title: "Reifegrad- und Scoring-Modell",
    summary:
      "Die sechsstufige Reifegradskala mit Nachweisanforderung, die Berechnungsformeln bis zum DORA Resilience Index und die Ampellogik.",
    groupId: "steuerung",
    figures: [9],
    cockpitLinks: [
      { label: "DORA-Dashboard", href: "/dora" },
      { label: "Anforderungen bewerten", href: "/dora/requirements" },
    ],
    blocks: [
      { kind: "h3", text: "Reifegradskala" },
      {
        kind: "p",
        text: "Die Bewertung erfolgt je Anforderung auf einer sechsstufigen Skala. Maßgeblich ist nicht die Absicht, sondern der belegbare Zustand zum Stichtag. Ohne verknüpften, gültigen Nachweis ist der [[Reifegrad]] auf höchstens Stufe 2 begrenzt ([[Nachweissperre]]) – unabhängig von der Selbsteinschätzung des Fachbereichs.",
      },
      {
        kind: "table",
        title: "Tabelle 21: Reifegradskala mit Nachweisanforderung",
        head: ["Stufe", "Bezeichnung", "Definition", "Erforderlicher Nachweis"],
        rows: [
          [
            "0",
            "Nicht vorhanden",
            "Die Anforderung ist nicht adressiert. Es existieren weder Regelungen noch Aktivitäten.",
            "Kein Nachweis",
          ],
          [
            "1",
            "Initial / ad hoc",
            "Die Anforderung wird anlassbezogen und personenabhängig erfüllt. Keine dokumentierte Regelung.",
            "Einzelnachweise ohne Systematik",
          ],
          [
            "2",
            "Wiederholbar",
            "Aktivitäten werden wiederholt durchgeführt, sind aber nicht vollständig dokumentiert oder nicht flächendeckend.",
            "Teilnachweise, unvollständige Dokumentation",
          ],
          [
            "3",
            "Definiert",
            "Die Anforderung ist dokumentiert geregelt, freigegeben, kommuniziert und wird flächendeckend angewendet.",
            "Freigegebene Regelung plus Anwendungsnachweis",
          ],
          [
            "4",
            "Gesteuert",
            "Die Umsetzung wird anhand von Kennzahlen gemessen, regelmäßig überprüft und bei Abweichungen nachgesteuert.",
            "Kennzahlen, Reviewprotokolle, Abweichungsbehandlung",
          ],
          [
            "5",
            "Optimiert",
            "Die Umsetzung wird kontinuierlich verbessert; Erkenntnisse aus Tests, Vorfällen und Bedrohungslage fließen systematisch ein.",
            "Verbesserungsnachweis über mehrere Zyklen",
          ],
        ],
      },
      { kind: "h3", text: "Berechnungslogik" },
      {
        kind: "p",
        text: "Der Kapitel-Score ergibt sich als Quotient aus der Summe der gewichteten Reifegrade und der Summe der maximal erreichbaren gewichteten Reifegrade. Der Gesamtindex ([[DORA Resilience Index]]) ist der nach Kapitelgewichten gewichtete Mittelwert. Über beiden Ebenen liegt die [[Knockout]]-Übersteuerung.",
      },
      { kind: "figure", num: 9 },
      {
        kind: "table",
        title: "Tabelle 22: Formeln der Score-Berechnung",
        head: ["Größe", "Berechnung"],
        rows: [
          ["Gewicht je Anforderung", "MUSS = 3, SOLL = 2, KANN = 1"],
          ["Score je Anforderung", "Reifegrad (0 bis 5) × Gewicht"],
          ["Maximalscore je Anforderung", "5 × Gewicht"],
          [
            "Kapitel-Score in Prozent",
            "Summe aller Anforderungs-Scores des Kapitels ÷ Summe aller Maximalscores des Kapitels × 100",
          ],
          ["DORA Resilience Index", "Summe (Kapitel-Score × Kapitelgewicht) ÷ 100"],
          [
            "Knockout-Übersteuerung",
            "Existiert im Kapitel mindestens eine Anforderung mit KO-Kennzeichen und Reifegrad < 3, wird der Kapitelstatus auf ROT gesetzt – unabhängig vom rechnerischen Score.",
          ],
          [
            "Nachweissperre",
            "Fehlt ein gültiger, verknüpfter Nachweis, wird der Reifegrad systemseitig auf maximal 2 begrenzt.",
          ],
        ],
      },
      { kind: "h3", text: "Ampellogik" },
      {
        kind: "table",
        title: "Tabelle 23: Ampellogik auf Kapitel- und Gesamtebene",
        head: ["Status", "Bedingung", "Konsequenz"],
        rows: [
          [
            "GRÜN",
            "Score ≥ 85 % und kein offener Knockout und keine überfällige Maßnahme kritischer Schwere.",
            "Regelbetrieb; turnusmäßige Überprüfung im Quartalsrhythmus.",
          ],
          [
            "GELB",
            "Score zwischen 60 und 84 % oder Maßnahmen in fristgerechter Bearbeitung.",
            "Maßnahmenplan mit Terminen; monatliche Nachverfolgung durch die Kontrollfunktion.",
          ],
          [
            "ROT",
            "Score unter 60 % oder mindestens ein offener Knockout.",
            "Unverzügliche Eskalation an das Leitungsorgan; Prüfung der Aussetzung betroffener Funktionen.",
          ],
        ],
      },
      {
        kind: "callout",
        tone: "info",
        title: "Im Cockpit implementiert",
        text: "Genau diese Logik rechnet das Cockpit live: lib/domain/dora-scoring.ts setzt Gewichte, Nachweissperre, Kapitel-Score, Index und Knockout-Übersteuerung deterministisch um – jede Kennzahl im Dashboard ist damit bis zur Einzelanforderung nachvollziehbar.",
      },
    ],
  },
  {
    slug: "findings-capa",
    chapter: "Kap. 12",
    title: "Findings und Maßnahmensteuerung",
    summary:
      "Fünf Feststellungsquellen, der CAPA-Prozess mit Wirksamkeitsprüfung und die Schweregrade mit Fristen und Eskalationsstufen.",
    groupId: "steuerung",
    figures: [10],
    cockpitLinks: [
      { label: "DORA-Findings", href: "/dora/findings" },
      { label: "Maßnahmen (CAPA)", href: "/actions" },
    ],
    blocks: [
      {
        kind: "p",
        text: "Feststellungen entstehen aus fünf Quellen: der Selbstbewertung des Katalogs, den Resilienztests einschließlich TLPT, der Nachbereitung von Vorfällen, der Prüfung von Dienstleistern sowie internen und externen Prüfungen. Alle Quellen münden in ein einheitliches Register, damit Maßnahmen nicht quellenabhängig unterschiedlich behandelt werden.",
      },
      { kind: "h3", text: "Prozessablauf" },
      { kind: "figure", num: 10 },
      {
        kind: "p",
        text: "Der entscheidende Kontrollpunkt liegt am Ende: Ein Finding darf erst geschlossen werden, wenn die Wirksamkeit der Maßnahme anhand des vorab definierten [[Wirksamkeitskriterium]]s nachgewiesen ist. Erst danach wird der Reifegrad der zugehörigen Anforderung neu bewertet. Diese Reihenfolge verhindert, dass [[CAPA]]-Maßnahmen formal abgeschlossen werden, ohne die Ursache zu beseitigen.",
      },
      { kind: "h3", text: "Schweregrade, Fristen und Eskalation" },
      {
        kind: "table",
        title: "Tabelle 24: Schweregrade, Bearbeitungsfristen und Eskalationsstufen",
        head: ["Schweregrad", "Definition", "Reaktionsfrist", "Behebungsfrist", "Eskalation an"],
        rows: [
          [
            "Kritisch",
            "Knockout-relevante MUSS-Anforderung mit Reifegrad unter 3 oder unmittelbare Gefährdung einer kritischen Funktion.",
            "Sofort",
            "10 Arbeitstage",
            "Leitungsorgan",
          ],
          [
            "Hoch",
            "MUSS-Anforderung mit Reifegrad unter 3 ohne unmittelbare CIF-Gefährdung oder wesentlicher Nachweismangel.",
            "5 Arbeitstage",
            "30 Arbeitstage",
            "CISO",
          ],
          [
            "Mittel",
            "SOLL-Anforderung nicht erfüllt oder MUSS-Anforderung mit Reifegrad 3 und erkennbarem Verbesserungsbedarf.",
            "10 Arbeitstage",
            "90 Arbeitstage",
            "Fachbereichsleitung",
          ],
          [
            "Gering",
            "Formale oder dokumentarische Mängel ohne Auswirkung auf die Wirksamkeit der Kontrolle.",
            "20 Arbeitstage",
            "180 Arbeitstage",
            "Prozessverantwortlicher",
          ],
        ],
      },
      {
        kind: "p",
        text: "Bei Überschreitung der Behebungsfrist erfolgt eine automatische Eskalation auf die nächsthöhere Ebene. Überfällige Maßnahmen der Schwere „kritisch“ werden im Executive Overview des Dashboards gesondert ausgewiesen und sind Bestandteil jeder Berichterstattung an das [[Leitungsorgan]].",
      },
    ],
  },
  {
    slug: "kennzahlen",
    chapter: "Kap. 13",
    title: "Kennzahlensystem – KPI und KRI",
    summary:
      "Der Kennzahlenbaum vom DORA Resilience Index bis zur Einzelkennzahl und der vollständige KPI/KRI-Katalog mit Zielwerten.",
    groupId: "steuerung",
    figures: [11],
    cockpitLinks: [
      { label: "DORA-Dashboard (KPI-Liste)", href: "/dora" },
      { label: "Reports", href: "/reports" },
    ],
    blocks: [
      {
        kind: "p",
        text: "Das Kennzahlensystem unterscheidet zwischen Leistungskennzahlen (KPI), die den Umsetzungsgrad messen, und Risikokennzahlen (KRI), die auf Gefährdungen hinweisen. Beide sind je Kapitel verankert und aggregieren zum [[DORA Resilience Index]].",
      },
      { kind: "figure", num: 11 },
      { kind: "h3", text: "Kennzahlenkatalog" },
      {
        kind: "p",
        text: "Die folgende Tabelle definiert je Kennzahl die Berechnung, den Zielwert, die Erhebungsfrequenz und die Datenquelle. Die Definitionen sind unmittelbar in Abfragen der Applikation überführbar – eine Auswahl davon wird im DORA-Dashboard des Cockpits live berechnet.",
      },
      {
        kind: "table",
        title: "Tabelle 25: Katalog der Leistungs- und Risikokennzahlen",
        head: ["ID", "Bezeichnung", "Ebene", "Berechnung", "Zielwert", "Frequenz"],
        rows: [
          [
            "KPI-K2-01",
            "Abdeckung kritischer Funktionen mit BIA",
            "Kapitel II",
            "CIF mit freigegebener BIA / Anzahl CIF",
            "100 %",
            "Quartal",
          ],
          [
            "KPI-K2-02",
            "Assets mit vollständiger 5D-Schutzbedarfsbewertung",
            "Kapitel II",
            "Assets mit allen fünf Dimensionen / CIF-relevante Assets",
            "100 %",
            "Quartal",
          ],
          [
            "KPI-K2-03",
            "Erfolgsquote BCP- und DRP-Tests",
            "Kapitel II",
            "Bestandene Tests / geplante Tests im Zyklus",
            "≥ 95 %",
            "Halbjahr",
          ],
          [
            "KRI-K2-04",
            "Risiken oberhalb des Risikoappetits",
            "Kapitel II",
            "Offene Risiken oberhalb der Toleranzschwelle",
            "0",
            "Monat",
          ],
          [
            "KRI-K2-05",
            "Anteil Legacy-Systeme in CIF-Ketten",
            "Kapitel II",
            "Legacy-Assets in CIF-Ketten / CIF-Assets gesamt",
            "≤ 10 %",
            "Halbjahr",
          ],
          [
            "KPI-K3-01",
            "Meldefristentreue",
            "Kapitel III",
            "Fristgerechte Meldungen / meldepflichtige Vorfälle",
            "100 %",
            "Monat",
          ],
          [
            "KPI-K3-02",
            "Mean Time to Detect (MTTD)",
            "Kapitel III",
            "Mittlere Zeit von Eintritt bis Erkennung",
            "≤ 1 Stunde",
            "Monat",
          ],
          [
            "KPI-K3-03",
            "Mean Time to Restore (MTTR)",
            "Kapitel III",
            "Mittlere Zeit von Erkennung bis Wiederherstellung",
            "≤ RTO der betroffenen CIF",
            "Monat",
          ],
          [
            "KPI-K3-04",
            "Lessons Learned überführt",
            "Kapitel III",
            "Vorfälle mit Eintrag im Risikoregister / schwerwiegende Vorfälle",
            "100 %",
            "Quartal",
          ],
          [
            "KRI-K3-05",
            "Schwerwiegende Vorfälle je Quartal",
            "Kapitel III",
            "Anzahl als schwerwiegend klassifizierter Vorfälle",
            "Trendbeobachtung",
            "Quartal",
          ],
          [
            "KPI-K4-01",
            "Testplanerfüllung",
            "Kapitel IV",
            "Durchgeführte Tests / geplante Tests im Jahreszyklus",
            "≥ 95 %",
            "Quartal",
          ],
          [
            "KPI-K4-02",
            "TLPT-Zykluseinhaltung",
            "Kapitel IV",
            "Zeit seit letztem abgeschlossenen TLPT",
            "≤ 36 Monate",
            "Halbjahr",
          ],
          [
            "KPI-K4-03",
            "Nachtestquote nach Remediation",
            "Kapitel IV",
            "Nachgetestete Befunde / behobene Befunde",
            "100 %",
            "Quartal",
          ],
          [
            "KRI-K4-04",
            "Offene Testbefunde nach Schweregrad",
            "Kapitel IV",
            "Offene Befunde je Schweregrad, gewichtet nach Alter",
            "0 kritisch",
            "Monat",
          ],
          [
            "KPI-K5-01",
            "Vollständigkeit des Informationsregisters",
            "Kapitel V",
            "Verträge mit vollständigem Datensatz / Verträge gesamt",
            "100 %",
            "Monat",
          ],
          [
            "KPI-K5-02",
            "Vertragsklausel-Konformität nach Art. 30",
            "Kapitel V",
            "Verträge mit allen Pflichtklauseln / CIF-Verträge",
            "100 %",
            "Quartal",
          ],
          [
            "KPI-K5-03",
            "Getestete Ausstiegsstrategien",
            "Kapitel V",
            "CIF-Dienstleister mit getestetem Exit-Plan / CIF-Dienstleister",
            "100 %",
            "Halbjahr",
          ],
          [
            "KRI-K5-04",
            "Konzentrationsrisiko je Provider",
            "Kapitel V",
            "Anzahl CIF, die von einem einzelnen Provider abhängen",
            "≤ 2 je Provider",
            "Quartal",
          ],
          [
            "KRI-K5-05",
            "Nicht substituierbare Dienstleister",
            "Kapitel V",
            "CIF-Dienstleister ohne verfügbare Alternative",
            "0",
            "Halbjahr",
          ],
          [
            "KPI-K6-01",
            "Auswertungsquote Threat Intelligence",
            "Kapitel VI",
            "Ausgewertete Alerts / eingegangene Alerts",
            "100 %",
            "Monat",
          ],
          [
            "KPI-K6-02",
            "Time to Assess nach externem Alert",
            "Kapitel VI",
            "Mittlere Zeit vom Alert bis zum abgeschlossenen Registerabgleich",
            "≤ 24 Stunden",
            "Monat",
          ],
          [
            "KPI-GOV-01",
            "DORA Resilience Index",
            "Gesamt",
            "Gewichteter Mittelwert der Kapitel-Scores mit Knockout-Übersteuerung",
            "≥ 85 %",
            "Quartal",
          ],
          [
            "KRI-GOV-02",
            "Offene Knockouts",
            "Gesamt",
            "MUSS-Anforderungen mit Reifegrad unter 3",
            "0",
            "Monat",
          ],
          [
            "KRI-GOV-03",
            "Überfällige CAPA",
            "Gesamt",
            "Maßnahmen mit überschrittenem Fälligkeitsdatum",
            "0",
            "Monat",
          ],
        ],
      },
    ],
  },
  {
    slug: "governance-raci",
    chapter: "Kap. 14",
    title: "Governance und Verantwortlichkeiten",
    summary:
      "Das Modell der drei Verteidigungslinien und die RACI-Matrix über die DORA-Kapitel II bis VI – inkl. Unvereinbarkeitsregel für die Revision.",
    groupId: "steuerung",
    figures: [12],
    cockpitLinks: [
      { label: "Administration (Rollen)", href: "/admin" },
      { label: "Audit Trail", href: "/audit" },
    ],
    blocks: [
      {
        kind: "p",
        text: "DORA verlangt eine klare Trennung von Ausführung, Kontrolle und Prüfung. Art. 6 Abs. 4 fordert eine unabhängige Kontrollfunktion für das IKT-Risiko, Art. 6 Abs. 6 die regelmäßige Prüfung des Rahmens durch die Interne Revision. Die Zuordnung folgt dem [[Drei-Linien-Modell]].",
      },
      { kind: "figure", num: 12 },
      { kind: "h3", text: "RACI-Übersicht je DORA-Kapitel" },
      {
        kind: "p",
        text: "Die Matrix ordnet jeder Rolle ihre Beteiligung je Kapitel zu. A steht für die Letztverantwortung, R für die Durchführungsverantwortung, C für die verpflichtende Konsultation und I für die Information.",
      },
      {
        kind: "table",
        title: "Tabelle 26: RACI-Matrix über die DORA-Kapitel II bis VI",
        head: ["Rolle", "II", "III", "IV", "V", "VI", "Schwerpunkt der Aufgabe"],
        rows: [
          [
            "Leitungsorgan / Vorstand",
            "A",
            "I",
            "I",
            "A",
            "I",
            "Genehmigt Strategie, Risikoappetit und Auslagerungsleitlinie; trägt die Letztverantwortung nach Art. 5 Abs. 2.",
          ],
          [
            "CISO / IKT-Risikomanagement",
            "R",
            "R",
            "R",
            "C",
            "R",
            "Führt den Risikomanagementrahmen, verantwortet Klassifizierung und Meldung, steuert das Testprogramm.",
          ],
          [
            "Third-Party-Risk-Management",
            "C",
            "C",
            "C",
            "R",
            "C",
            "Führt Informationsregister und Providerbewertung, steuert Konzentrationsrisiko und Exit-Strategien.",
          ],
          [
            "BCM-Beauftragter",
            "R",
            "C",
            "C",
            "C",
            "I",
            "Verantwortet BIA, BCP und DRP sowie RTO-/RPO-Festlegung und deren Tests.",
          ],
          [
            "IT-Betrieb und Architektur",
            "R",
            "C",
            "R",
            "C",
            "I",
            "Setzt technische Kontrollen um, pflegt CMDB, Patch- und Änderungsmanagement.",
          ],
          [
            "Security Operations (SOC)",
            "C",
            "R",
            "C",
            "I",
            "R",
            "Detection und Erstreaktion, Forensik, Auswertung der Threat Intelligence.",
          ],
          [
            "Fachbereiche / CIF-Owner",
            "R",
            "C",
            "C",
            "C",
            "I",
            "Prozessverantwortung, BIA-Input, Schutzbedarfsfeststellung.",
          ],
          [
            "Einkauf und Recht",
            "I",
            "I",
            "I",
            "R",
            "I",
            "Vertragsverhandlung und Sicherstellung der Pflichtklauseln nach Art. 30.",
          ],
          [
            "Compliance",
            "C",
            "C",
            "C",
            "C",
            "C",
            "Regulatorische Auslegung, Aufsichtskommunikation, Abgrenzung paralleler Meldepflichten.",
          ],
          [
            "Datenschutzbeauftragter",
            "I",
            "C",
            "I",
            "C",
            "I",
            "Bewertung der datenschutzrechtlichen Meldepflichten und Schnittstelle zur DSGVO.",
          ],
          [
            "Interne Revision",
            "I",
            "I",
            "I",
            "I",
            "I",
            "Unabhängige Prüfung des Rahmens nach Art. 6 Abs. 6; kein operatives Mandat.",
          ],
        ],
      },
      {
        kind: "callout",
        tone: "danger",
        title: "Unvereinbarkeit",
        text: "Die Interne Revision darf in keinem Kapitel als R oder A geführt werden. Eine Doppelrolle aus operativer Umsetzung und unabhängiger Prüfung verstößt gegen Art. 6 Abs. 4 und 6 und ist in aufsichtlichen Prüfungen ein regelmäßiger Beanstandungsgrund.",
      },
    ],
  },

  // ─────────────────── Teil E – Architektur & Umsetzung ───────────────────
  {
    slug: "architektur-dashboard",
    chapter: "Kap. 15",
    title: "GRC-Architektur und Dashboard-Spezifikation",
    summary:
      "Die vierschichtige Zielarchitektur, das Executive Overview, die View-Landkarte, das Datenmodell und die Schnittstellen der Applikation.",
    groupId: "architektur",
    figures: [13, 14, 15, 16],
    cockpitLinks: [
      { label: "DORA-Dashboard (Umsetzung von Abb. 14)", href: "/dora" },
      { label: "Vorfälle & Meldefristen-Monitor", href: "/dora/incidents" },
      { label: "Reports & Exporte", href: "/reports" },
    ],
    blocks: [
      {
        kind: "p",
        text: "Dokumente und einfache Ticketsysteme reichen zur Abbildung der DORA-Anforderungen nicht aus. Die Zahl der Einzelanforderungen, die Verknüpfungsdichte zwischen Anforderung, Asset, Funktion, Dienstleister und Vorfall sowie die kurzen [[Meldefristen]] erzwingen eine strukturierte Anwendung mit einer einzigen verbindlichen Datenbasis.",
      },
      { kind: "h3", text: "Zielarchitektur" },
      {
        kind: "p",
        text: "Die Architektur ist in vier Schichten aufgebaut: Die Basis bildet das Asset-Inventar als Single Source of Truth. Darüber liegt der Geschäftskontext mit den kritischen und wichtigen Funktionen, der den Business Impact an die operativen Module vererbt. Die dritte Schicht bilden die DORA-Module, die vierte das Management- und Aufsichtsreporting.",
      },
      { kind: "figure", num: 13 },
      {
        kind: "p",
        text: "Der Kern der Architektur ist die Verknüpfung: Jedes Risiko, jeder Vorfall und jeder Dienstleister muss mit einem konkreten IKT-Asset und darüber mit einer kritischen Funktion verbunden sein. Nur so lässt sich automatisiert berechnen, welche Auswirkung der Ausfall einer Komponente auf das Gesamtgeschäft hat – und nur so ist die Klassifizierung eines Vorfalls innerhalb der Vier-Stunden-Frist überhaupt leistbar.",
      },
      { kind: "h3", text: "Dashboard – Executive Overview" },
      {
        kind: "p",
        text: "Die Zielansicht für das [[Leitungsorgan]] ist die verbindliche Gestaltungsvorlage der Umsetzung und enthält alle Elemente, die für die Berichterstattung nach Art. 5 Abs. 2 erforderlich sind. Die dargestellten Werte sind Beispielwerte.",
      },
      { kind: "figure", num: 14 },
      {
        kind: "list",
        items: [
          "Die Kachel „Offene Knockouts“ steht gleichrangig neben dem Gesamtindex. Sie verhindert, dass ein guter Durchschnittswert eine harte Compliance-Lücke verdeckt.",
          "Die Kapitelampel wird durch Knockouts übersteuert. Im Beispiel steht Kapitel V trotz 67 Prozent auf Rot, weil Ausstiegsstrategien für Dienstleister kritischer Funktionen fehlen.",
          "Die Heatmap verbindet die Kapitelsicht mit der Sicht auf kritische Funktionen und macht die Frage beantwortbar, welcher Geschäftsprozess konkret gefährdet ist.",
          "Der Meldefristen-Monitor zeigt die Restlaufzeit je laufendem Vorfall und prüft automatisch die drei parallelen Pflichtenstränge nach DORA, NIS-2 und DSGVO.",
        ],
      },
      { kind: "h3", text: "View-Landkarte" },
      {
        kind: "p",
        text: "Die Applikation gliedert sich in sieben Arbeitsflächen, die jeweils einer Zielgruppe und einem DORA-Kapitel zugeordnet sind. Die Trennung ist bewusst gewählt: Das Leitungsorgan erhält eine verdichtete Sicht, die Fachbereiche arbeiten in ihrer jeweiligen Domäne.",
      },
      { kind: "figure", num: 15 },
      { kind: "h3", text: "Datenmodell" },
      {
        kind: "p",
        text: "Das Entitäten-Beziehungs-Modell bildet die fachlichen Objekte und ihre Beziehungen ab. Es ist so entworfen, dass es unmittelbar auf relationale Tabellen abbildbar ist – im Cockpit ist es in prisma/schema.prisma umgesetzt (DoraChapter, DoraRequirement, DoraAssessment, DoraFinding, Incident, IncidentReport, Evidence u. a.). Kardinalitäten sind in Krähenfußnotation dargestellt.",
      },
      { kind: "figure", num: 16 },
      { kind: "h3", text: "Berechnungs- und Statuslogik" },
      {
        kind: "list",
        items: [
          "Der Reifegrad einer Anforderung wird auf höchstens 2 begrenzt, solange kein gültiger Nachweis verknüpft ist. Ein Nachweis gilt als gültig, wenn sein Gültigkeitsdatum nicht überschritten und der Prüfvermerk gesetzt ist.",
          "Der Kapitel-Score wird bei jeder Bewertungsänderung neu berechnet und mit Stichtag historisiert. Historische Stände dürfen nicht überschrieben werden.",
          "Die Knockout-Prüfung läuft nach jeder Bewertungsänderung und nach jedem Statuswechsel eines Findings. Sie setzt den Kapitelstatus, ohne den Score zu verändern.",
          "Bei Erfassung eines Vorfalls berechnet das System aus Kenntniserlangung und Klassifizierung die Fälligkeiten und startet die Fristenüberwachung.",
          "Der Meldefristen-Monitor prüft je Vorfall die Anwendbarkeit der Pflichtenstränge nach DORA, BSIG und DSGVO und dokumentiert die Prüfentscheidung auch dann, wenn keine Meldepflicht besteht.",
          "Jede Änderung an Bewertungen, Findings, Maßnahmen und Nachweisen wird im Audit-Log mit Altwert, Neuwert, Benutzer und Zeitstempel festgeschrieben. Das Audit-Log ist ausschließlich schreibend zu befüllen.",
          "Der Konzentrationsrisiko-Indikator zählt je Dienstleister die Anzahl abhängiger kritischer Funktionen und markiert Dienstleister ohne dokumentierte Alternative gesondert.",
        ],
      },
      { kind: "h3", text: "Rollen- und Berechtigungskonzept" },
      {
        kind: "table",
        title: "Tabelle 28: Rollen- und Berechtigungskonzept der Applikation",
        head: ["Rolle", "Katalog", "Vorfälle", "Provider", "Register", "Threat Intel", "Anmerkung"],
        rows: [
          [
            "Leitungsorgan",
            "Lesen",
            "Lesen",
            "Lesen",
            "Lesen",
            "Lesen",
            "Executive Overview und Managementbericht; keine Schreibrechte.",
          ],
          [
            "CISO",
            "Schreiben",
            "Schreiben",
            "Schreiben",
            "Lesen",
            "Schreiben",
            "Vollzugriff auf Bewertung, Findings, Vorfälle und Freigaben.",
          ],
          [
            "TPRM",
            "Lesen",
            "Lesen",
            "Schreiben",
            "Schreiben",
            "Lesen",
            "Vollzugriff auf Provider, Verträge und Informationsregister.",
          ],
          [
            "Fachbereich / CIF-Owner",
            "Schreiben (eigene)",
            "Lesen",
            "Lesen",
            "Lesen",
            "Lesen",
            "Schreibrecht nur auf die eigenen zugeordneten Anforderungen.",
          ],
          [
            "SOC",
            "Lesen",
            "Schreiben",
            "Lesen",
            "Lesen",
            "Schreiben",
            "Vollzugriff auf Vorfälle und Threat Intelligence.",
          ],
          [
            "Interne Revision",
            "Lesen",
            "Lesen",
            "Lesen",
            "Lesen",
            "Lesen",
            "Lesezugriff auf alle Daten einschließlich Audit-Trail; keine Schreibrechte.",
          ],
          [
            "Administrator",
            "Verwalten",
            "Verwalten",
            "Verwalten",
            "Verwalten",
            "Verwalten",
            "Stammdaten, Rollen und Konfiguration; keine fachliche Bewertung.",
          ],
        ],
      },
      { kind: "h3", text: "Schnittstellen und Datenaustausch" },
      {
        kind: "table",
        title: "Tabelle 29: Erforderliche Schnittstellen",
        head: ["Schnittstelle", "Richtung", "Zweck und Format"],
        rows: [
          [
            "CMDB / Asset-Management",
            "Eingehend",
            "Turnusmäßiger Abgleich des Asset-Inventars; Abgleichschlüssel ist die Asset-ID. Format JSON oder CSV.",
          ],
          [
            "Informationsregister",
            "Ausgehend",
            "Erzeugung der Einreichungsdatei für die BaFin im xBRL-Format nach ITS (EU) 2024/2956 oder als Excel-Vorlage, inkl. Vorabvalidierung.",
          ],
          [
            "Vorfallmeldung",
            "Ausgehend",
            "Befüllung der harmonisierten Meldeformulare nach DfVO (EU) 2025/302 zur Einreichung über das MVP-Portal.",
          ],
          [
            "SIEM / Security Operations",
            "Eingehend",
            "Übernahme klassifizierungsrelevanter Vorfalldaten zur Auslösung der Fristenüberwachung.",
          ],
          [
            "Threat-Intelligence-Feeds",
            "Eingehend",
            "Automatisierter Abgleich eingehender Advisories gegen Asset-Inventar und Informationsregister; Format STIX oder JSON.",
          ],
          [
            "Nachweisablage",
            "Beidseitig",
            "Verknüpfung von Nachweisdokumenten mit Versionierung und Aufbewahrungsfrist.",
          ],
          [
            "Managementreporting",
            "Ausgehend",
            "Erzeugung des Nachweispakets und des Managementberichts als PDF-Export mit Datenstand und Prüfsumme.",
          ],
        ],
      },
    ],
  },
];

export function getHandbookSection(slug: string): HandbookSection | undefined {
  return HANDBOOK_SECTIONS.find((s) => s.slug === slug);
}

/** Nachbar-Navigation (vorheriges/nächstes Kapitel) in Katalogreihenfolge. */
export function getHandbookNeighbors(slug: string): {
  prev?: HandbookSection;
  next?: HandbookSection;
} {
  const i = HANDBOOK_SECTIONS.findIndex((s) => s.slug === slug);
  if (i < 0) return {};
  return {
    prev: i > 0 ? HANDBOOK_SECTIONS[i - 1] : undefined,
    next: i < HANDBOOK_SECTIONS.length - 1 ? HANDBOOK_SECTIONS[i + 1] : undefined,
  };
}
