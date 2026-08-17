/**
 * DORA ISRM Wissensbasis (Verordnung (EU) 2022/2554).
 *
 * Fachlich redaktionierte Zusammenfassungen der fünf DORA-Kernsäulen aus
 * Sicht des Informationssicherheits-Risikomanagements (ISRM) einer Bank.
 * In den Texten markierte Fachbegriffe ([[Begriff]]) verweisen auf das
 * GLOSSARY und werden in der UI als klickbare Begriffe mit Erklär-Modal
 * gerendert.
 *
 * Hinweis: Die Texte sind Arbeits- und Schulungsmaterial. Sie ersetzen
 * keine rechtliche Prüfung der Verordnung und der zugehörigen RTS/ITS.
 */

export interface DoraPillar {
  id: string;
  chapter: string;
  articles: string;
  title: string;
  /** Absätze; [[Begriff]] markiert Glossar-Verweise. */
  paragraphs: string[];
  /** Konkrete ISRM-Aufgaben in einer Bank. */
  isrmTasks: string[];
  /** Verweise in die operativen Module des Cockpits. */
  cockpitLinks: Array<{ label: string; href: string }>;
}

export const DORA_PILLARS: DoraPillar[] = [
  {
    id: "ict-risk",
    chapter: "Kapitel II",
    articles: "Art. 5–16",
    title: "IKT-Risikomanagement",
    paragraphs: [
      "Kapitel II verpflichtet Finanzunternehmen zu einem soliden, umfassenden und gut dokumentierten IKT-Risikomanagementrahmen, der als integraler Bestandteil des Gesamtrisikomanagements mindestens jährlich sowie anlassbezogen überprüft wird. Die Endverantwortung liegt ausdrücklich beim [[Leitungsorgan]]: Es genehmigt die digitale Resilienzstrategie, legt die [[Risikotoleranz]] für IKT-Risiken fest, budgetiert die Umsetzung und muss ausreichende eigene Kenntnisse über IKT-Risiken aufbauen und aktuell halten.",
      "Inhaltlich folgt der Rahmen einem vollständigen Lebenszyklus: Identifikation aller Informations- und IKT-Assets, Geschäftsfunktionen und Abhängigkeiten (inklusive der Einstufung [[kritischer oder wichtiger Funktionen]]), Schutz und Prävention (u. a. Sicherheitsrichtlinien, Netzwerksegmentierung, Verschlüsselung, Zugriffssteuerung), Erkennung anomaler Aktivitäten, Reaktion und Wiederherstellung mit definierten [[RTO/RPO]]-Zielen, Backup- und Wiederanlaufverfahren sowie Lernen und Weiterentwickeln — etwa durch Auswertung von Vorfällen und Tests. Nach dem [[Verhältnismäßigkeitsprinzip]] dürfen Umfang und Tiefe an Größe und Risikoprofil des Instituts ausgerichtet werden; für bestimmte kleine Institute gilt ein vereinfachter Rahmen (Art. 16).",
    ],
    isrmTasks: [
      "IKT-Risikomethodik, Risikoappetit und Schwellwerte definieren, dokumentieren und dem Leitungsorgan zur Genehmigung vorlegen (im Cockpit: Risikomethodik und Appetit je Kategorie in der Administration).",
      "Vollständiges Register der Assets, ICT-Services und Abhängigkeiten pflegen und Risiken daraus ableiten (Risk Register, RB-01/RB-02).",
      "Business-Impact-Analysen ([[BIA]]) mit den Fachbereichen durchführen und RTO/RPO-Vorgaben je kritischer Funktion nachhalten.",
      "Wirksamkeit der Schutz-, Erkennungs- und Wiederherstellungskontrollen regelmäßig testen lassen (Control Library, RB-07).",
      "Management-Reporting zu IKT-Risiken etablieren und Lessons Learned aus Vorfällen in den Rahmen zurückspielen (RB-08).",
    ],
    cockpitLinks: [
      { label: "Risk Register", href: "/risks" },
      { label: "Control Library", href: "/controls" },
      { label: "DORA-Mapping (Governance)", href: "/governance" },
    ],
  },
  {
    id: "incidents",
    chapter: "Kapitel III",
    articles: "Art. 17–23",
    title: "Behandlung, Klassifizierung und Meldung IKT-bezogener Vorfälle",
    paragraphs: [
      "Kapitel III verlangt einen definierten Prozess für das Management IKT-bezogener Vorfälle: Erkennung, Protokollierung, Klassifizierung, Eskalation, Kommunikation und Ursachenanalyse. Jeder [[IKT-Vorfall]] ist anhand einheitlicher Kriterien zu klassifizieren — unter anderem betroffene Kunden und Transaktionen, Dauer und geografische Ausbreitung, Datenverluste, Kritikalität der betroffenen Dienste und wirtschaftliche Auswirkungen. Überschreitet ein Vorfall die in den technischen Standards konkretisierten Wesentlichkeitsschwellen, gilt er als [[schwerwiegender IKT-Vorfall]] mit verpflichtender Meldung an die zuständige Aufsichtsbehörde.",
      "Für schwerwiegende Vorfälle gelten gestaffelte [[Meldefristen]]: eine Erstmeldung kurz nach Klassifizierung, eine Zwischenmeldung bei Statusänderung bzw. spätestens nach den in den RTS festgelegten Fristen und ein Abschlussbericht mit Ursachenanalyse. Erhebliche Cyberbedrohungen können freiwillig gemeldet werden; betroffene Kunden sind über schwerwiegende Vorfälle und wesentliche Bedrohungen zu informieren, wenn deren finanzielle Interessen berührt sind. Für das ISRM entscheidend ist die enge Verzahnung mit dem Incident-Response-Prozess: Die Vorfallsklassifizierung muss in Minuten funktionieren, nicht in Tagen — inklusive belastbarer Datengrundlage aus Monitoring und [[SOC]].",
    ],
    isrmTasks: [
      "Klassifizierungslogik nach den DORA-Kriterien implementieren und mit dem Incident-Response-Prozess (CTL-016) verzahnen; Playbooks PB-05/PB-06 für dienstleisterbezogene Vorfälle bereithalten.",
      "Melde-Workflows mit Fristenüberwachung für Erst-, Zwischen- und Abschlussmeldung etablieren und regelmäßig üben.",
      "Vorfallsdaten als Frühindikatoren in die Risikobewertung zurückführen (RB-02) und Kontrolllücken als Maßnahmen nachverfolgen.",
      "Kommunikationswege zu Aufsicht, Kunden und internen Gremien dokumentieren und im Krisenfall abrufbar halten.",
    ],
    cockpitLinks: [
      { label: "Playbook PB-05 (Dienstleisterausfall)", href: "/playbooks" },
      { label: "Runbooks", href: "/runbooks" },
    ],
  },
  {
    id: "testing",
    chapter: "Kapitel IV",
    articles: "Art. 24–27",
    title: "Testen der digitalen operationalen Resilienz",
    paragraphs: [
      "Kapitel IV verpflichtet Finanzunternehmen zu einem risikobasierten Programm zum Testen der digitalen operationalen Resilienz als fester Bestandteil des IKT-Risikomanagementrahmens. Alle IKT-Systeme und -Anwendungen, die [[kritische oder wichtige Funktionen]] unterstützen, sind mindestens jährlich zu testen — das Spektrum reicht von Schwachstellenscans, Open-Source-Analysen und Netzwerksicherheitsbewertungen über szenariobasierte Tests und Kompatibilitätstests bis zu Penetrationstests. Festgestellte Schwachstellen sind vollständig nachzuverfolgen und zu beheben; das Cockpit bildet dies über Maßnahmen mit Wirksamkeitsprüfung ab.",
      "Für Institute mit entsprechender Bedeutung und entsprechendem Risikoprofil kommt der bedrohungsorientierte Penetrationstest [[TLPT]] hinzu: mindestens alle drei Jahre, auf Produktionssystemen, gegen kritische Funktionen und auf Basis realer Bedrohungsszenarien — methodisch angelehnt an [[TIBER-EU]]. Werden kritische Funktionen von [[IKT-Drittdienstleistern]] betrieben, sind diese in den Test einzubeziehen (ggf. über gepoolte Tests). Das ISRM steuert Scoping, Risikofreigaben und die vertrauliche Behandlung der Ergebnisse und überführt Findings in den Maßnahmenprozess.",
    ],
    isrmTasks: [
      "Jährliches Testprogramm risikobasiert planen (Scope aus Kritikalität der Funktionen ableiten) und mit dem Kontrolltest-Kalender verzahnen (RB-07).",
      "TLPT-Pflicht des eigenen Hauses klären, Scoping-Dokumente und Managementfreigaben vorbereiten, Dienstleister vertraglich zur Mitwirkung verpflichten.",
      "Alle Testergebnisse als Findings mit Maßnahmen, Fristen und Wirksamkeitsprüfung nachverfolgen (Actions, PB-10).",
      "Nachweise der Tests revisionssicher im Evidence-Register führen (RB-19).",
    ],
    cockpitLinks: [
      { label: "Maßnahmen", href: "/actions" },
      { label: "Evidence-Register", href: "/evidence" },
    ],
  },
  {
    id: "third-party",
    chapter: "Kapitel V",
    articles: "Art. 28–44",
    title: "Management des IKT-Drittparteienrisikos",
    paragraphs: [
      "Kapitel V behandelt IKT-Drittparteienrisiken als integralen Bestandteil des IKT-Risikomanagements. Finanzunternehmen benötigen eine Strategie für [[IKT-Drittdienstleister]], müssen vor Vertragsschluss eine Risikoanalyse durchführen (inklusive [[Konzentrationsrisiko]] und Prüfung der [[Subunternehmerkette]]) und ein vollständiges [[Informationsregister]] über alle vertraglichen Vereinbarungen führen — mit jährlicher Berichtspflicht an die Aufsicht. Verträge über IKT-Dienstleistungen müssen die [[vertraglichen Mindestinhalte]] nach Art. 30 enthalten; bei Unterstützung kritischer oder wichtiger Funktionen gelten erweiterte Anforderungen wie uneingeschränkte Audit- und Zugangsrechte, Mitwirkung an Resilienztests und dokumentierte [[Ausstiegsstrategien]] mit getesteten Exit-Plänen.",
      "Neu ist der europäische Überwachungsrahmen für kritische IKT-Drittdienstleister ([[CTPP]]): Die europäischen Aufsichtsbehörden ([[ESAs]]) stufen Anbieter mit systemischer Bedeutung ein, und ein [[Lead Overseer]] überwacht sie direkt — mit Auskunfts-, Prüfungs- und Empfehlungsbefugnissen. Für die Bank bedeutet das keine Entlastung: Die Verantwortung für ausgelagerte Funktionen bleibt vollständig beim Institut. Das ISRM muss daher Kritikalität, Substituierbarkeit und Konzentrationslagen laufend bewerten und die Registerdaten in aufsichtstauglicher Qualität halten.",
    ],
    isrmTasks: [
      "Informationsregister vollständig und meldefähig pflegen (Third-Party-Register inkl. Verträgen, Subdienstleistern, Datenstandorten — RB-09 bis RB-11).",
      "Kritikalitäts- und Konzentrationsbewertungen regelmäßig durchführen (RB-10, RB-12; Playbooks PB-04/PB-08/PB-16).",
      "Vertragsklausel-Standard nach Art. 30 durchsetzen (CTL-014) und Bestandsverträge auf Lücken prüfen.",
      "Exit-Strategien für alle kritischen Drittparteien dokumentieren und testen (RB-13, PB-07).",
    ],
    cockpitLinks: [
      { label: "Third-Party-Register", href: "/third-parties" },
      { label: "TPRM-Report", href: "/reports/TPRM_OVERVIEW" },
    ],
  },
  {
    id: "info-sharing",
    chapter: "Kapitel VI",
    articles: "Art. 45",
    title: "Vereinbarungen über den Austausch von Informationen",
    paragraphs: [
      "Kapitel VI ermöglicht — und ermutigt — Finanzunternehmen, untereinander [[Cyberbedrohungsinformationen]] auszutauschen: Indikatoren für Kompromittierungen, Taktiken und Vorgehensweisen von Angreifern, Warnungen und Konfigurationsempfehlungen. Voraussetzung sind geschützte Vereinbarungen innerhalb vertrauenswürdiger Gemeinschaften, die die Sensibilität der Informationen wahren und Datenschutz- sowie Wettbewerbsvorgaben einhalten. Die Teilnahme an solchen Vereinbarungen ist der Aufsicht mitzuteilen.",
      "Für das ISRM einer Bank ist dieser Baustein die Brücke zwischen externer Bedrohungslage und interner Risikosteuerung: Erkenntnisse aus Sharing-Communities (z. B. sektorale CERTs oder branchenspezifische Austauschkreise) fließen in die Bedrohungsanalyse, in die Neubewertung betroffener Risiken und in die Priorisierung von Kontrollen ein. Umgekehrt stärkt eigene Beteiligung die kollektive Resilienz des Sektors.",
    ],
    isrmTasks: [
      "Teilnahme an geeigneten Threat-Intelligence-Gemeinschaften prüfen, Vereinbarungen dokumentieren und der Aufsicht anzeigen.",
      "Prozess etablieren, der externe Bedrohungsinformationen in Risiko-Neubewertungen überführt (RB-02, PB-14 bei neuen Anforderungen).",
      "Vertraulichkeits- und Datenschutzregeln für geteilte Informationen festlegen (Klassifizierung im Evidence-Register).",
    ],
    cockpitLinks: [
      { label: "Risiko neu bewerten (RB-02)", href: "/runbooks" },
      { label: "Governance-Mapping", href: "/governance" },
    ],
  },
];

/** Glossar: Fachbegriffe im Bankenkontext, kurz und prägnant. */
export const DORA_GLOSSARY: Record<string, { title: string; definition: string }> = {
  Leitungsorgan: {
    title: "Leitungsorgan",
    definition:
      "Vorstand bzw. Geschäftsleitung des Instituts. DORA weist ihm die letzte Verantwortung für das IKT-Risikomanagement zu: Genehmigung der digitalen Resilienzstrategie und der Risikotoleranz, Budgetverantwortung, regelmäßige Befassung mit IKT-Risiken und schwerwiegenden Vorfällen sowie Pflicht, eigene Kenntnisse über IKT-Risiken aktuell zu halten. Delegation an CISO oder ISRM entbindet nicht von dieser Verantwortung.",
  },
  Risikotoleranz: {
    title: "Risikotoleranz für IKT-Risiken",
    definition:
      "Vom Leitungsorgan festgelegtes Maß an IKT-Risiko, das das Institut zur Erreichung seiner Geschäftsziele bewusst einzugehen bereit ist. Im Cockpit als Risikoappetit-Schwelle je Risikokategorie umgesetzt: Residual-Risiken oberhalb der Schwelle erfordern Behandlung oder eine formale, befristete Akzeptanzentscheidung des Managements.",
  },
  "kritischer oder wichtiger Funktionen": {
    title: "Kritische oder wichtige Funktion",
    definition:
      "Funktion, deren Ausfall die finanzielle Leistungsfähigkeit, die Kontinuität der Dienstleistungen oder die Einhaltung aufsichtsrechtlicher Pflichten des Instituts erheblich beeinträchtigen würde — z. B. Zahlungsverkehr, Wertpapierabwicklung oder das regulatorische Meldewesen. An dieser Einstufung hängen verschärfte DORA-Pflichten: jährliche Tests, TLPT-Scope, erweiterte Vertragsklauseln und Exit-Strategien bei Drittvergabe.",
  },
  "RTO/RPO": {
    title: "RTO / RPO",
    definition:
      "Recovery Time Objective: maximal tolerierte Zeit bis zur Wiederherstellung eines Dienstes nach Ausfall. Recovery Point Objective: maximal tolerierter Datenverlust, gemessen als Zeitspanne seit der letzten Sicherung. DORA verlangt, dass beide je Funktion festgelegt, in Wiederanlaufplänen hinterlegt und durch Tests (z. B. Ausweich-RZ-Übungen) nachweislich erreichbar sind — für den Zahlungsverkehr einer Bank typisch im Minuten- bis Stundenbereich.",
  },
  Verhältnismäßigkeitsprinzip: {
    title: "Verhältnismäßigkeitsprinzip (Art. 4)",
    definition:
      "Die DORA-Anforderungen sind unter Berücksichtigung von Größe, Gesamtrisikoprofil sowie Art, Umfang und Komplexität der Dienstleistungen umzusetzen. Es erlaubt Abstufungen in der Tiefe — nicht den Verzicht auf Kernpflichten. Kleinstinstitute und bestimmte befreite Einrichtungen dürfen den vereinfachten Rahmen nach Art. 16 anwenden.",
  },
  BIA: {
    title: "Business-Impact-Analyse (BIA)",
    definition:
      "Systematische Bewertung, wie sich der Ausfall eines Prozesses oder IKT-Services über die Zeit auf das Institut auswirkt (finanziell, regulatorisch, Kunden, Reputation). Liefert die Grundlage für die Einstufung kritischer Funktionen, für RTO/RPO-Vorgaben und für die Priorisierung von Resilienzmaßnahmen.",
  },
  "IKT-Vorfall": {
    title: "IKT-bezogener Vorfall",
    definition:
      "Ein von dem Institut nicht geplantes Ereignis oder eine Verkettung von Ereignissen, das die Sicherheit der Netzwerk- und Informationssysteme beeinträchtigt und negative Auswirkungen auf Verfügbarkeit, Authentizität, Integrität oder Vertraulichkeit von Daten oder auf die erbrachten Dienstleistungen hat. Jeder Vorfall ist zu erfassen und nach einheitlichen Kriterien zu klassifizieren.",
  },
  "schwerwiegender IKT-Vorfall": {
    title: "Schwerwiegender IKT-Vorfall",
    definition:
      "IKT-Vorfall, der die in den technischen Regulierungsstandards konkretisierten Wesentlichkeitsschwellen überschreitet — etwa nach betroffenen Kunden/Transaktionen, Dauer, Datenverlust, geografischer Ausbreitung oder Kritikalität der betroffenen Dienste. Löst die verpflichtende, fristgebundene Meldekette an die zuständige Aufsichtsbehörde aus und ist dem Leitungsorgan zu berichten.",
  },
  Meldefristen: {
    title: "Meldefristen bei schwerwiegenden Vorfällen",
    definition:
      "DORA sieht eine dreistufige Meldekette an die zuständige Behörde vor: frühe Erstmeldung nach Klassifizierung des Vorfalls als schwerwiegend, Zwischenbericht bei relevanter Statusänderung und Abschlussbericht mit Ursachenanalyse nach Abschluss der Aufarbeitung. Die konkreten Fristen und Formulare sind in den RTS/ITS zur Vorfallsmeldung festgelegt — im Institut gehören sie in einen geübten Workflow mit Fristenüberwachung.",
  },
  SOC: {
    title: "Security Operations Center (SOC)",
    definition:
      "Organisationseinheit (intern oder als Managed Service), die sicherheitsrelevante Ereignisse rund um die Uhr überwacht, korreliert und bewertet. Liefert die Datengrundlage für die DORA-Pflichten zur Anomalieerkennung (Kap. II) und zur schnellen Vorfallsklassifizierung (Kap. III). Bei Fremdvergabe ist das SOC selbst eine kritische IKT-Drittdienstleistung.",
  },
  TLPT: {
    title: "TLPT – Threat-Led Penetration Testing",
    definition:
      "Bedrohungsorientierter Penetrationstest nach Art. 26/27: simuliert auf Basis aktueller Bedrohungsanalysen reale Angriffe auf Produktionssysteme kritischer Funktionen — mindestens alle drei Jahre für dafür bestimmte Institute. Durchführung durch qualifizierte, unabhängige Tester unter strenger Geheimhaltung; unterstützende IKT-Drittdienstleister sind einzubeziehen. Methodischer Referenzrahmen in Europa ist TIBER-EU.",
  },
  "TIBER-EU": {
    title: "TIBER-EU",
    definition:
      "Threat Intelligence-based Ethical Red Teaming: das EZB-Rahmenwerk für nachrichtendienstlich fundierte Red-Team-Tests im Finanzsektor. Definiert Rollen (u. a. White Team, Threat-Intelligence- und Red-Team-Provider), Phasen und Vertraulichkeitsregeln. DORA-TLPT ist an TIBER-EU angelehnt; nationale Umsetzungen konkretisieren die Durchführung.",
  },
  "IKT-Drittdienstleister": {
    title: "IKT-Drittdienstleister",
    definition:
      "Unternehmen, das IKT-Dienstleistungen für das Institut erbringt — von Cloud- und Rechenzentrumsleistungen über Software-as-a-Service bis zu Netzwerk- und Sicherheitsdiensten. Für sie gelten die Pflichten aus Kap. V: Risikoanalyse vor Vertragsschluss, Registerführung, Vertragsmindestinhalte, laufende Überwachung und — bei kritischen Funktionen — Exit-Strategien.",
  },
  "IKT-Drittdienstleistern": {
    title: "IKT-Drittdienstleister",
    definition:
      "Unternehmen, das IKT-Dienstleistungen für das Institut erbringt — von Cloud- und Rechenzentrumsleistungen über Software-as-a-Service bis zu Netzwerk- und Sicherheitsdiensten. Für sie gelten die Pflichten aus Kap. V: Risikoanalyse vor Vertragsschluss, Registerführung, Vertragsmindestinhalte, laufende Überwachung und — bei kritischen Funktionen — Exit-Strategien.",
  },
  Informationsregister: {
    title: "Informationsregister (Art. 28 Abs. 3)",
    definition:
      "Vollständiges, aktuelles Verzeichnis aller vertraglichen Vereinbarungen über IKT-Dienstleistungen — auf Einzelinstituts-, teilkonsolidierter und konsolidierter Ebene, mit Kennzeichnung der Verträge, die kritische oder wichtige Funktionen unterstützen. Es ist der Aufsicht mindestens jährlich zu melden; Struktur und Datenfelder sind durch ITS vorgegeben. Im Cockpit entspricht dem das Third-Party-Register mit Verträgen und Subdienstleistern.",
  },
  Konzentrationsrisiko: {
    title: "IKT-Konzentrationsrisiko",
    definition:
      "Risiko aus der Abhängigkeit von einem einzelnen oder wenigen Anbietern, von schwer substituierbaren Leistungen oder von gemeinsamen Subdienstleistern mehrerer eigener Provider. Vor Vertragsschluss und laufend zu bewerten — inklusive Blick auf Datenstandorte und Regionen. Kritische Konzentrationslagen erfordern eine bewusste Managemententscheidung (Diversifizierung, vertragliche Resilienz oder dokumentierte Akzeptanz).",
  },
  Subunternehmerkette: {
    title: "Subunternehmerkette",
    definition:
      "Kette der Unterauftragnehmer, über die ein IKT-Drittdienstleister Teile seiner Leistung erbringt. DORA verlangt Transparenz über wesentliche Subvergaben, vertragliche Regelungen zu deren Kontrolle und die Bewertung der Risiken langer oder komplexer Ketten — insbesondere wenn Subdienstleister kritische Leistungsanteile tragen oder in Drittländern sitzen.",
  },
  "vertraglichen Mindestinhalte": {
    title: "Vertragliche Mindestinhalte (Art. 30)",
    definition:
      "Pflichtinhalte jedes IKT-Dienstleistungsvertrags: u. a. Leistungsbeschreibung, Datenstandorte, Regelungen zu Verfügbarkeit, Integrität und Vertraulichkeit, Unterstützung bei Vorfällen, Kündigungsrechte und Mitwirkung bei Ausstieg. Bei kritischen oder wichtigen Funktionen zusätzlich: vollständige Audit- und Zugangsrechte (auch für die Aufsicht), Leistungsziele/SLA, Mitwirkung an TLPT und verbindliche Exit-Unterstützung.",
  },
  Ausstiegsstrategien: {
    title: "Ausstiegsstrategie / Exit-Plan",
    definition:
      "Dokumentierte Strategie, wie eine an einen Drittdienstleister vergebene kritische Leistung geordnet beendet oder übertragen werden kann — ohne unzumutbare Unterbrechung der Geschäftstätigkeit oder Verstoß gegen aufsichtsrechtliche Pflichten. Umfasst Substitutionsoptionen, Datenportabilität, Übergangsfristen und ist regelmäßig zu testen (im Cockpit: RB-13, Playbook PB-07).",
  },
  CTPP: {
    title: "CTPP – Kritischer IKT-Drittdienstleister",
    definition:
      "Critical Third-Party Provider: IKT-Drittdienstleister, den die europäischen Aufsichtsbehörden wegen seiner systemischen Bedeutung für den Finanzsektor als kritisch einstufen (typisch: große Cloud-Hyperscaler). CTPPs unterliegen der direkten europäischen Überwachung durch einen Lead Overseer. Wichtig: Die Einstufung entlastet das einzelne Institut nicht von seiner eigenen Drittparteien-Verantwortung.",
  },
  "Lead Overseer": {
    title: "Lead Overseer (federführende Überwachungsbehörde)",
    definition:
      "Diejenige der drei europäischen Aufsichtsbehörden (EBA, EIOPA oder ESMA), die für die direkte Überwachung eines als kritisch eingestuften IKT-Drittdienstleisters benannt wird. Befugnisse: Auskunftsersuchen, Untersuchungen, Vor-Ort-Prüfungen und Empfehlungen — bei deren Nichtbeachtung die Aufsicht den Instituten im Extremfall die Nutzung des Anbieters untersagen kann.",
  },
  ESAs: {
    title: "ESAs – Europäische Aufsichtsbehörden",
    definition:
      "Sammelbegriff für EBA (Banken), EIOPA (Versicherungen) und ESMA (Wertpapiermärkte). Unter DORA erarbeiten sie gemeinsam die technischen Regulierungs- und Durchführungsstandards (RTS/ITS), betreiben den Überwachungsrahmen für kritische IKT-Drittdienstleister und benennen die Lead Overseer.",
  },
  Reifegrad: {
    title: "Reifegrad (0–5)",
    definition:
      "Sechsstufige Bewertungsskala je Anforderung (FRWK-DORA-001, Kap. 11): 0 nicht vorhanden, 1 initial, 2 wiederholbar, 3 definiert, 4 gesteuert, 5 optimiert. Maßgeblich ist der belegbare Zustand zum Stichtag – ohne gültigen, geprüften Nachweis begrenzt die Nachweissperre den wirksamen Reifegrad auf höchstens 2.",
  },
  Nachweissperre: {
    title: "Nachweissperre",
    definition:
      "Berechnungsregel des Anforderungskatalogs: Fehlt einer Anforderung ein gültiger, geprüfter Nachweis, wird ihr wirksamer Reifegrad systemseitig auf höchstens 2 begrenzt – unabhängig von der Selbsteinschätzung. Sie erzwingt das DORA-Prinzip, dass nicht die Absicht zählt, sondern der belegbare Zustand.",
  },
  Knockout: {
    title: "Knockout (KO)",
    definition:
      "Kennzeichnung derjenigen MUSS-Anforderungen, deren Nichterfüllung in einer aufsichtlichen Prüfung mit hoher Wahrscheinlichkeit unmittelbar zu einer Feststellung führt oder eine kritische Funktion direkt gefährdet (98 von 133 Anforderungen). Steht eine KO-Anforderung wirksam unter Reifegrad 3, wird der Kapitelstatus auf ROT gesetzt – unabhängig vom rechnerischen Durchschnitt. Reaktion: Playbook PB-17.",
  },
  CAPA: {
    title: "CAPA – Korrektur- und Vorbeugemaßnahme",
    definition:
      "Corrective and Preventive Action: Maßnahme zu einem Finding mit Owner, Fälligkeit und vorab definiertem Wirksamkeitskriterium. Ein Finding darf erst geschlossen werden, wenn die Wirksamkeit nachgewiesen ist – erst danach wird der Reifegrad der zugehörigen Anforderung neu bewertet (FRWK-DORA-001, Kap. 12).",
  },
  "DORA Resilience Index": {
    title: "DORA Resilience Index",
    definition:
      "Gesamtkennzahl des Anforderungskatalogs: der nach Kapitelgewichten (Kap. II 30 %, III 25 %, IV 15 %, V 25 %, VI 5 %) gewichtete Mittelwert der Kapitel-Scores, übersteuert durch offene Knockouts. Zielwert ≥ 85 % (GRÜN); 60–84 % GELB; darunter oder bei offenem Knockout ROT.",
  },
  Cyberbedrohungsinformationen: {
    title: "Cyberbedrohungsinformationen (Threat Intelligence)",
    definition:
      "Informationen über Bedrohungslagen, die zwischen Finanzunternehmen geteilt werden dürfen: Kompromittierungsindikatoren (IoCs), Taktiken/Techniken/Prozeduren von Angreifern, Warnungen und Härtungsempfehlungen. Der Austausch erfolgt in vertrauenswürdigen Gemeinschaften auf Basis geschützter Vereinbarungen; die Teilnahme ist der Aufsicht anzuzeigen.",
  },
  "lex specialis": {
    title: "Lex specialis derogat legi generali",
    definition:
      "Kollisionsregel des Rechts: Das speziellere Gesetz verdrängt das allgemeinere. Für den Finanzsektor bedeutet das, dass DORA als sektorspezifisches Recht die allgemeinen Anforderungen der NIS-2-Richtlinie verdrängt, soweit beide denselben Regelungsgegenstand betreffen. Praktische Konsequenz ist keine Befreiung, sondern eine Verschärfung: DORA übernimmt das NIS-2-Basisniveau und schneidet es auf den Finanzsektor zu.",
  },
  "RTS/ITS": {
    title: "RTS / ITS – delegierte Rechtsakte",
    definition:
      "Regulatory Technical Standards (delegierte Verordnungen) und Implementing Technical Standards (Durchführungsverordnungen), entworfen von den Europäischen Aufsichtsbehörden und von der EU-Kommission erlassen. Sie konkretisieren die DORA operativ – u. a. Risikomanagementrahmen (DelVO 2024/1774), Vorfallklassifizierung (2024/1772), Meldeformulare (2025/301, 2025/302), Informationsregister (2024/2956) und TLPT (2025/1190) – und gelten unmittelbar.",
  },
  Maximumprinzip: {
    title: "Maximumprinzip",
    definition:
      "Regel zur Ableitung des Gesamtschutzbedarfs eines Assets: Maßgeblich ist die höchste Einzelbewertung über die fünf Schutzdimensionen (Vertraulichkeit, Integrität, Verfügbarkeit, Authentizität, Verbindlichkeit) – nicht der Durchschnitt. Eine Mittelwertbildung ist unzulässig, weil sie einen kritischen Einzelbefund verdecken würde.",
  },
  "Time to Assess": {
    title: "Time to Assess",
    definition:
      "Kennzahl KPI-K6-02: die mittlere Zeit vom Eingang eines externen Threat-Intelligence-Alerts bis zum abgeschlossenen Abgleich gegen Asset-Inventar und Informationsregister (Zielwert ≤ 24 Stunden). Sie ist der belastbarste Einzelindikator für die Reife des Zusammenspiels von DORA-Kapitel V und VI – ohne aktuelles Register ist die Frage „betrifft uns das?“ nicht beantwortbar.",
  },
  Wirksamkeitskriterium: {
    title: "Wirksamkeitskriterium",
    definition:
      "Vorab definierter, messbarer Maßstab, an dem die Wirksamkeit einer CAPA-Maßnahme geprüft wird, bevor das zugehörige Finding geschlossen werden darf (FRWK-DORA-001, Kap. 12.1). Die Reihenfolge – erst Wirksamkeitsnachweis, dann Schließung, erst danach Neubewertung des Reifegrads – verhindert, dass Maßnahmen formal abgeschlossen werden, ohne die Ursache zu beseitigen.",
  },
  "Drei-Linien-Modell": {
    title: "Modell der drei Verteidigungslinien",
    definition:
      "Governance-Modell zur Trennung von Ausführung, Kontrolle und Prüfung: Erste Linie sind die operativen Einheiten (Fachbereiche, IT-Betrieb, SOC), zweite Linie die unabhängige Kontrollfunktion für das IKT-Risiko nach Art. 6 Abs. 4 DORA (CISO/IKT-Risikomanagement, Compliance), dritte Linie die Interne Revision mit der Prüfpflicht nach Art. 6 Abs. 6. Die Revision darf nirgends operativ verantwortlich (R/A) sein.",
  },
};
