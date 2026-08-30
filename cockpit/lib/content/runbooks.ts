/**
 * Initiale Runbook-Definitionen (RB-01 … RB-20).
 * Quelle für den Seed; ausführliche Fassungen: docs/runbooks/RB-XX.md
 */

export interface RunbookStepDef {
  title: string;
  description: string;
  role: string;
  decision?: boolean;
  evidence?: string;
}

export interface RunbookDef {
  code: string;
  title: string;
  purpose: string;
  scope: string;
  trigger: string;
  prerequisites: string;
  input: string;
  roles: string;
  sla: string;
  escalation: string;
  output: string;
  kpi: string;
  controlPoints: string;
  reviewCycle: string;
  steps: RunbookStepDef[];
}

const RM = "ICT Risk Manager";
const TPRM = "Third Party Risk Manager";
const ISO = "Information Security Officer";
const RO = "Risk Owner";
const CO = "Control Owner";
const AO = "Action Owner";
const SL = "Reviewer / Second Line";
const MGMT = "Management";

export const RUNBOOKS: RunbookDef[] = [
  {
    code: "RB-01",
    title: "Neues Informationssicherheitsrisiko erfassen",
    purpose:
      "Einheitliche, vollständige Ersterfassung eines Informationssicherheits- oder ICT-Risikos im Risk Register.",
    scope:
      "Alle neu identifizierten ICT- und Informationssicherheitsrisiken aller Gesellschaften und Standorte.",
    trigger:
      "Risikomeldung aus Fachbereich, Assessment-Ergebnis, Audit Finding, Incident-Nachbereitung oder Kontrolltest.",
    prerequisites: "Zugriff auf das Risk Register; Grundinformationen zum Sachverhalt liegen vor.",
    input:
      "Sachverhaltsbeschreibung, betroffene Assets/Prozesse/Services, erste Einschätzung der Quelle.",
    roles: `Durchführung: ${RM}; Unterstützung: ${ISO}; Freigabe der Zuordnung: ${RO}.`,
    sla: "Ersterfassung innerhalb von 5 Arbeitstagen nach Bekanntwerden.",
    escalation:
      "Bei potenziell kritischen Risiken sofortige Information an ISO und Management (PB-01 prüfen).",
    output: "Vollständiger Risk-Register-Eintrag im Status In Assessment.",
    kpi: "Anteil vollständig erfasster Risiken beim ersten Quality Review (> 90 %).",
    controlPoints:
      "Pflichtfeld-Validierung; Vier-Augen-Prüfung im nachgelagerten Quality Review (RB-03).",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Risikomeldung sichten",
        description: "Eingang prüfen, Dubletten im Register ausschließen, Quelle dokumentieren.",
        role: RM,
      },
      {
        title: "Risiko strukturiert beschreiben",
        description:
          "Titel, Beschreibung, Ursache, Ereignis und Auswirkung getrennt erfassen; Bedrohung und Schwachstelle benennen.",
        role: RM,
      },
      {
        title: "Zuordnungen erfassen",
        description:
          "Assets, Geschäftsprozesse, ICT-Services, kritische Funktionen, Kategorie, Standort und Gesellschaft zuordnen.",
        role: RM,
      },
      {
        title: "Risk Owner benennen",
        description: "Fachlich verantwortlichen Risk Owner abstimmen und eintragen.",
        role: RM,
        decision: true,
      },
      {
        title: "Bestehende Kontrollen dokumentieren",
        description:
          "Vorhandene Kontrollen aus der Control Library verknüpfen und narrativ beschreiben.",
        role: CO,
      },
      {
        title: "Erstbewertung anstoßen",
        description:
          "Status auf In Assessment setzen und Bewertung nach RB-02/Methodik durchführen.",
        role: RM,
        evidence: "Risk-Register-Eintrag mit Ersterfassung",
      },
    ],
  },
  {
    code: "RB-02",
    title: "Bestehendes Risiko neu bewerten",
    purpose: "Regelmäßige oder anlassbezogene Neubewertung eines Risikos nach der 5×5-Methodik.",
    scope: "Alle Risiken im Status Open, Treatment, Monitoring oder Accepted.",
    trigger:
      "Fälliges Review-Datum, wesentliche Änderung der Bedrohungslage, Kontrolltest-Ergebnis, Incident.",
    prerequisites:
      "Aktueller Registereintrag; Kontrollwirksamkeit aus letztem Kontrolltest bekannt.",
    input: "Bisherige Bewertung, neue Erkenntnisse, Kontrolltest-Ergebnisse, Nachweise.",
    roles: `Durchführung: ${RM} oder ${RO}; fachliche Prüfung: ${ISO}.`,
    sla: "Neubewertung innerhalb von 10 Arbeitstagen nach Trigger.",
    escalation: "Residual Risk über Risikoappetit → RB-18 / PB-01 auslösen.",
    output:
      "Neue, begründete Bewertung mit Inherent- und Residual-Score; aktualisiertes Review-Datum.",
    kpi: "Anteil überfälliger Risiko-Reviews (< 5 %).",
    controlPoints: "Begründungspflicht je Bewertung; Historie bleibt unveränderlich erhalten.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Anlass und Kontext prüfen",
        description:
          "Trigger dokumentieren; relevante Änderungen seit letzter Bewertung zusammenstellen.",
        role: RM,
      },
      {
        title: "Eintrittswahrscheinlichkeit bewerten",
        description: "Likelihood 1–5 anhand der Methodik-Skala einstufen und begründen.",
        role: RO,
      },
      {
        title: "Auswirkung je Dimension bewerten",
        description:
          "Alle relevanten Auswirkungsdimensionen (C/I/A, finanziell, regulatorisch …) einstufen; Maximum bestimmt den Impact.",
        role: RO,
      },
      {
        title: "Kontrollwirksamkeit ansetzen",
        description: "Wirksamkeit gemäß letztem Kontrolltest (0/25/50/75/100 %) übernehmen.",
        role: CO,
      },
      {
        title: "Residual Risk prüfen",
        description:
          "Berechneten Residual-Score fachlich plausibilisieren; gegen Risikoappetit prüfen.",
        role: ISO,
        decision: true,
      },
      {
        title: "Review-Datum setzen",
        description: "Nächste Überprüfung terminieren (Critical: 3 Monate, High: 6, sonst 12).",
        role: RM,
        evidence: "Bewertung mit Begründung im Register",
      },
    ],
  },
  {
    code: "RB-03",
    title: "Quality Review einer Risikoanalyse",
    purpose:
      "Unabhängige Qualitätsprüfung einer Risikoanalyse anhand der 13 Prüfkriterien vor Freigabe.",
    scope: "Alle Risiken im Status Quality Review.",
    trigger: "Abschluss des Self Assessments (Statuswechsel auf Quality Review).",
    prerequisites: "Vollständige Risikoanalyse inkl. Bewertung und Begründung.",
    input: "Risk-Register-Eintrag, Bewertung, verknüpfte Kontrollen und Nachweise.",
    roles: `Durchführung: ${ISO} oder ${SL} (nicht der Ersteller – Funktionstrennung).`,
    sla: "Review innerhalb von 10 Arbeitstagen.",
    escalation: "Zweimalige Rückgabe → Eskalation an Management.",
    output: "Dokumentiertes Review-Ergebnis mit Qualitätsscore; Freigabe oder begründete Rückgabe.",
    kpi: "Durchschnittlicher Qualitätsscore (> 80 %); Erstfreigabe-Quote.",
    controlPoints: "Checkliste vollständig; Reviewer ≠ Ersteller (systemseitig erzwungen).",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Review starten",
        description: "Quality Review im Cockpit anlegen; Checkliste wird automatisch erzeugt.",
        role: ISO,
      },
      {
        title: "Prüfkriterien bewerten",
        description:
          "Alle 13 Kriterien einzeln als erfüllt/nicht erfüllt bewerten und kommentieren.",
        role: ISO,
      },
      {
        title: "Qualitätsscore prüfen",
        description:
          "Score (Anteil erfüllter Kriterien) bewerten; unter 70 % ist eine Rückgabe zu begründen.",
        role: ISO,
      },
      {
        title: "Entscheidung treffen",
        description:
          "Freigeben, zur Nachbearbeitung zurückgeben oder ablehnen – jeweils mit Begründung.",
        role: ISO,
        decision: true,
        evidence: "Review-Protokoll mit Checkliste",
      },
      {
        title: "Ergebnis kommunizieren",
        description:
          "Ersteller und Risk Owner informieren; bei Rückgabe konkrete Nacharbeiten benennen.",
        role: ISO,
      },
    ],
  },
  {
    code: "RB-04",
    title: "Risikobehandlungsplan erstellen",
    purpose:
      "Ableitung einer Behandlungsstrategie (Avoid/Reduce/Transfer/Accept) mit konkreten, SMARTen Maßnahmen.",
    scope: "Alle freigegebenen Risiken oberhalb des Zielrisikos.",
    trigger: "Freigabe eines Risikos (Status Open) mit Residual über Zielrisiko.",
    prerequisites: "Freigegebene Bewertung; Risikoappetit und Zielrisiko bekannt.",
    input: "Bewertung, Kontrolllandschaft, Budgetrahmen.",
    roles: `Strategie: ${RO}; Maßnahmenplanung: ${RM} mit ${AO}; Prüfung: ${ISO}.`,
    sla: "Behandlungsplan innerhalb von 20 Arbeitstagen nach Freigabe.",
    escalation: "Keine tragfähige Strategie → Managemententscheidung (RB-15).",
    output: "Behandlungsstrategie im Register; angelegte Maßnahmen mit Owner und Terminen.",
    kpi: "Anteil Risiken mit aktivem Behandlungsplan (> 95 % der offenen Risiken über Ziel).",
    controlPoints: "SMART-Check je Maßnahme im Quality Review; Terminplausibilität.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Strategie festlegen",
        description: "Avoid, Reduce, Transfer oder Accept wählen und begründen.",
        role: RO,
        decision: true,
      },
      {
        title: "Maßnahmen ableiten",
        description: "Konkrete Maßnahmen SMART formulieren; erwartete Risikoreduktion angeben.",
        role: RM,
      },
      {
        title: "Owner und Termine festlegen",
        description: "Action Owner, Start-/Fälligkeitsdatum, Priorität und Aufwand erfassen.",
        role: RM,
      },
      {
        title: "Abhängigkeiten klären",
        description: "Abhängigkeiten zu anderen Maßnahmen/Projekten dokumentieren.",
        role: AO,
      },
      {
        title: "Plan prüfen und freigeben",
        description: "Behandlungsplan fachlich prüfen; Maßnahmen auf Approved setzen.",
        role: ISO,
        evidence: "Maßnahmenliste mit Freigabe",
      },
    ],
  },
  {
    code: "RB-05",
    title: "Überfällige Maßnahme eskalieren",
    purpose: "Strukturierte Eskalation überfälliger Maßnahmen bis zur Management-Ebene.",
    scope: "Alle Maßnahmen mit überschrittenem Fälligkeitsdatum.",
    trigger: "Fälligkeitsdatum überschritten ohne Abschluss.",
    prerequisites: "Maßnahme mit gepflegtem Status und Owner.",
    input: "Maßnahme, Verzugsdauer, Begründung des Action Owners.",
    roles: `Durchführung: ${RM}; Stellungnahme: ${AO}; Entscheidung ab Stufe 3: ${MGMT}.`,
    sla: "Stufe 1 nach 5, Stufe 2 nach 15, Stufe 3 nach 30 Tagen Verzug.",
    escalation: "Kritische Maßnahmen: sofort Stufe 2 (PB-03 prüfen).",
    output: "Dokumentierte Eskalation mit neuem Plantermin oder Managemententscheidung.",
    kpi: "Anteil überfälliger Maßnahmen (< 10 %); mittlere Verzugsdauer.",
    controlPoints: "Eskalationsstufe und Begründung im System; Audit Trail.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Verzug feststellen",
        description:
          "Überfällige Maßnahme identifizieren; Verzugsdauer und Kritikalität ermitteln.",
        role: RM,
      },
      {
        title: "Stellungnahme einholen",
        description: "Action Owner um Begründung und realistischen neuen Termin bitten.",
        role: AO,
      },
      {
        title: "Eskalationsstufe festlegen",
        description:
          "Stufe nach Verzugsdauer und Priorität setzen; bei kritischen Maßnahmen PB-03 aktivieren.",
        role: RM,
        decision: true,
      },
      {
        title: "Eskalation dokumentieren",
        description: "Eskalationsstufe, Begründung und neuen Termin im System erfassen.",
        role: RM,
        evidence: "Eskalationsvermerk",
      },
      {
        title: "Nachverfolgen",
        description: "Neuen Termin überwachen; bei erneutem Verzug nächste Stufe.",
        role: RM,
      },
    ],
  },
  {
    code: "RB-06",
    title: "Risikoakzeptanz vorbereiten und genehmigen",
    purpose:
      "Ordnungsgemäße, befristete Genehmigung einer Risikoakzeptanz inkl. kompensierender Kontrollen.",
    scope: "Risiken mit Behandlungsstrategie Accept oder ohne wirtschaftliche Behandlungsoption.",
    trigger: "Antrag des Risk Owners; Behandlungsplan nicht umsetzbar.",
    prerequisites: "Aktuelle Bewertung; geprüfte Alternativen dokumentiert.",
    input: "Risikoanalyse, Begründung, kompensierende Kontrollen, beantragte Befristung.",
    roles: `Antrag: ${RO}; Prüfung: ${ISO} und ${SL}; Genehmigung: ${MGMT}.`,
    sla: "Entscheidung innerhalb von 20 Arbeitstagen; dringende Fälle: PB-11.",
    escalation: "Über Appetit ohne kompensierende Kontrollen → zwingend Managementvorlage.",
    output: "Befristete, dokumentierte Akzeptanz mit Wiedervorlagedatum – oder Ablehnung.",
    kpi: "Anteil fristgerecht überprüfter Akzeptanzen (100 %).",
    controlPoints: "Befristung verpflichtend; Genehmiger ≠ Antragsteller; Audit Trail.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Antrag erstellen",
        description:
          "Begründung, geprüfte Alternativen und kompensierende Kontrollen dokumentieren.",
        role: RO,
      },
      {
        title: "Fachliche Prüfung",
        description: "ISO prüft Bewertung, Appetit-Bezug und Kompensationswirkung.",
        role: ISO,
      },
      {
        title: "Second-Line-Prüfung",
        description: "Unabhängige Prüfung der Entscheidungsgrundlage.",
        role: SL,
      },
      {
        title: "Managemententscheidung",
        description: "Genehmigung mit Befristung und Auflagen – oder Ablehnung mit Begründung.",
        role: MGMT,
        decision: true,
        evidence: "Genehmigungsvermerk",
      },
      {
        title: "Wiedervorlage einrichten",
        description:
          "Review-Datum vor Ablauf der Befristung terminieren; Risiko auf Accepted setzen.",
        role: RM,
      },
    ],
  },
  {
    code: "RB-07",
    title: "Kontrollwirksamkeit prüfen",
    purpose:
      "Test von Design- und operativer Wirksamkeit einer Kontrolle mit dokumentiertem Ergebnis.",
    scope: "Alle Kontrollen der Control Library gemäß Testplan.",
    trigger: "Fälliger Testtermin; anlassbezogen nach Incident oder Änderung.",
    prerequisites: "Kontrollbeschreibung aktuell; Nachweise zugänglich.",
    input: "Kontrolldefinition, Testverfahren, Stichprobe, Nachweise.",
    roles: `Test: ${CO} oder ${ISO} (nicht der operative Ausführende); Qualitätssicherung: ${SL}.`,
    sla: "Testdurchführung innerhalb von 15 Arbeitstagen nach Fälligkeit.",
    escalation: "Ergebnis Failed → PB-10; wesentliche Schwäche → PB-02.",
    output: "Testprotokoll mit Design-/Operating-Effectiveness und Findings.",
    kpi: "Testabdeckung gemäß Plan (> 95 %); Anteil wirksamer Kontrollen.",
    controlPoints: "Tester ≠ Ausführender; Nachweispflicht je Testschritt.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Test vorbereiten",
        description: "Testziel, Verfahren und Stichprobe festlegen.",
        role: CO,
      },
      {
        title: "Design-Effectiveness prüfen",
        description: "Ist die Kontrolle geeignet, das Risiko zu adressieren?",
        role: CO,
      },
      {
        title: "Operating-Effectiveness prüfen",
        description: "Wird die Kontrolle konsistent und nachweisbar ausgeführt?",
        role: CO,
      },
      {
        title: "Findings dokumentieren",
        description: "Abweichungen, Ursachen und Empfehlungen festhalten.",
        role: CO,
        evidence: "Testprotokoll mit Nachweisen",
      },
      {
        title: "Ergebnis bewerten",
        description: "Gesamtergebnis festlegen; bei Failed sofort ISO informieren.",
        role: ISO,
        decision: true,
      },
      {
        title: "Folgeaktivitäten anstoßen",
        description:
          "Wirksamkeit in Risikobewertungen aktualisieren; Maßnahmen bei Findings anlegen.",
        role: RM,
      },
    ],
  },
  {
    code: "RB-08",
    title: "Monatliches ICT-Risk-Reporting erstellen",
    purpose:
      "Erstellung des monatlichen Management-Reports zu ICT- und Informationssicherheitsrisiken.",
    scope: "Alle Risiken, Maßnahmen, Kontrollen und Drittparteien des Berichtsmonats.",
    trigger: "Monatsultimo (Stichtag).",
    prerequisites: "Monatsabschluss des Risk Registers (RB-17) abgeschlossen.",
    input: "Register-Daten zum Stichtag, KPI-Definitionen, Vormonatsbericht.",
    roles: `Erstellung: ${RM}; Qualitätssicherung: ${ISO}; Empfänger: ${MGMT}.`,
    sla: "Versand bis zum 5. Arbeitstag des Folgemonats.",
    escalation: "Kritische Entwicklungen → Ad-hoc-Vorabinformation an Management.",
    output: "Management-Report (Executive Summary, Top-Risiken, Trends, Entscheidungsbedarfe).",
    kpi: "Termintreue des Reports (100 %).",
    controlPoints: "Vier-Augen-Prüfung vor Versand; Stichtag und Filter im Report ausgewiesen.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Datenstand einfrieren",
        description: "Stichtag festlegen; Report-Snapshot im Cockpit erzeugen.",
        role: RM,
      },
      {
        title: "Kennzahlen prüfen",
        description: "KPIs, Heatmap und Trends auf Plausibilität prüfen.",
        role: RM,
      },
      {
        title: "Kommentierung erstellen",
        description:
          "Wesentliche Veränderungen, Top-Risiken und Entscheidungsbedarfe kommentieren.",
        role: RM,
      },
      {
        title: "Qualitätssicherung",
        description: "Inhaltliche und methodische Prüfung des Berichts.",
        role: ISO,
      },
      {
        title: "Bericht freigeben und verteilen",
        description: "Freigabe dokumentieren; Versand an Verteiler.",
        role: ISO,
        decision: true,
        evidence: "Freigegebener Monatsreport",
      },
    ],
  },
  {
    code: "RB-09",
    title: "Neue ICT-Drittpartei bewerten",
    purpose: "Onboarding-Assessment einer neuen ICT-Drittpartei vor Vertragsschluss.",
    scope: "Alle neuen Drittparteien mit ICT-Leistungsbezug.",
    trigger: "Beschaffungsanfrage / geplanter Vertragsschluss.",
    prerequisites: "Leistungsbeschreibung; Ansprechpartner der Drittpartei.",
    input: "Leistungsumfang, Datenarten, Standorte, Subdienstleister, Zertifikate.",
    roles: `Durchführung: ${TPRM}; Sicherheitsbewertung: ${ISO}; Freigabe: ${MGMT} bei kritischen Funktionen.`,
    sla: "Assessment vor Vertragsunterzeichnung abgeschlossen.",
    escalation: "Unterstützung kritischer Funktionen ohne ausreichende Nachweise → keine Freigabe.",
    output: "Registereintrag mit Kritikalität, Risikobewertung und Auflagen.",
    kpi: "Anteil Drittparteien mit abgeschlossenem Assessment vor Go-live (100 %).",
    controlPoints:
      "DORA-Pflichtangaben vollständig; Vertragsklauseln (Audit, Exit, Incident) geprüft.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Initial Screening",
        description: "Leistung, Datenarten und Standorte erfassen; Registereintrag anlegen.",
        role: TPRM,
      },
      {
        title: "Kritikalität bewerten",
        description: "RB-10 durchführen: Unterstützung kritischer/wichtiger Funktionen bestimmen.",
        role: TPRM,
        decision: true,
      },
      {
        title: "Due Diligence durchführen",
        description: "Zertifikate, Sicherheitskonzepte, Finanzlage und Subdienstleister prüfen.",
        role: TPRM,
      },
      {
        title: "Risiko bewerten",
        description: "Inhärentes und residuales Drittparteirisiko einschätzen.",
        role: ISO,
      },
      {
        title: "Vertragsanforderungen prüfen",
        description:
          "Audit-/Zugangsrechte, Incident-Meldepflichten, Exit-Klauseln, Kündigungsfristen.",
        role: TPRM,
      },
      {
        title: "Freigabeentscheidung",
        description: "Aufnahme genehmigen, mit Auflagen genehmigen oder ablehnen.",
        role: MGMT,
        decision: true,
        evidence: "Assessment-Bericht",
      },
    ],
  },
  {
    code: "RB-10",
    title: "Kritikalitätsbewertung einer Drittpartei",
    purpose:
      "Einstufung, ob eine Drittpartei kritische oder wichtige Funktionen unterstützt (DORA).",
    scope: "Alle ICT-Drittparteien bei Onboarding und wesentlichen Änderungen.",
    trigger: "Neues Onboarding (RB-09), Leistungsänderung, jährliches Review.",
    prerequisites: "Zuordnung der unterstützten Geschäftsprozesse und Funktionen.",
    input: "Leistungsbeschreibung, Prozesslandkarte, Kritische-Funktionen-Register.",
    roles: `Durchführung: ${TPRM}; Bestätigung: Business Owner und ${ISO}.`,
    sla: "10 Arbeitstage.",
    escalation: "Uneinigkeit über Einstufung → Entscheidung durch Management.",
    output: "Dokumentierte Kritikalitätseinstufung mit Begründung.",
    kpi: "Anteil Drittparteien mit aktueller Kritikalitätsbewertung (100 %).",
    controlPoints: "Bezug zu kritischen/wichtigen Funktionen nachvollziehbar dokumentiert.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Unterstützte Funktionen ermitteln",
        description: "Welche Geschäftsprozesse und Funktionen hängen an der Leistung?",
        role: TPRM,
      },
      {
        title: "Ausfallwirkung analysieren",
        description: "Auswirkung eines Ausfalls auf kritische/wichtige Funktionen bewerten.",
        role: TPRM,
      },
      {
        title: "Substituierbarkeit prüfen",
        description: "Wechselbarkeit, Marktalternativen und Migrationsaufwand einschätzen.",
        role: TPRM,
      },
      {
        title: "Einstufung festlegen",
        description: "Kritikalität (Low–Critical) mit Begründung dokumentieren.",
        role: TPRM,
        decision: true,
        evidence: "Kritikalitätsbewertung",
      },
      {
        title: "Bestätigung einholen",
        description: "Business Owner und ISO bestätigen die Einstufung.",
        role: ISO,
      },
    ],
  },
  {
    code: "RB-11",
    title: "Regelmäßiges Third-Party-Review durchführen",
    purpose:
      "Periodische Überprüfung bestehender Drittparteien (Leistung, Risiko, Vertrag, Nachweise).",
    scope:
      "Alle aktiven Drittparteien; Frequenz nach Kritikalität (Critical: jährlich, sonst 24 Monate).",
    trigger: "Fälliges Review-Datum; anlassbezogen nach Incident oder Vertragsänderung.",
    prerequisites: "Aktueller Registereintrag; letzte Assessment-Ergebnisse.",
    input: "Performance-Daten, Incidents, aktuelle Zertifikate, Vertragsstatus.",
    roles: `Durchführung: ${TPRM}; Sicherheitsbewertung: ${ISO}.`,
    sla: "Abschluss innerhalb von 20 Arbeitstagen nach Fälligkeit.",
    escalation: "Erhöhtes Risiko festgestellt → PB-04.",
    output: "Aktualisierte Bewertung, ggf. Maßnahmen und neue Auflagen.",
    kpi: "Anteil fristgerecht durchgeführter Reviews (> 95 %).",
    controlPoints: "Nachweise (Zertifikate, Berichte) auf Gültigkeit geprüft.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Review vorbereiten",
        description: "Unterlagen, Incidents und offene Findings zusammenstellen.",
        role: TPRM,
      },
      {
        title: "Leistung und Incidents bewerten",
        description: "SLA-Erfüllung und sicherheitsrelevante Vorfälle des Zeitraums prüfen.",
        role: TPRM,
      },
      {
        title: "Nachweise aktualisieren",
        description: "Zertifikate (z. B. ISO 27001) und Berichte auf Aktualität prüfen (RB-19).",
        role: TPRM,
      },
      {
        title: "Risikobewertung aktualisieren",
        description: "Inhärentes/residuales Risiko und Kritikalität neu bewerten.",
        role: ISO,
      },
      {
        title: "Ergebnis dokumentieren",
        description: "Review-Ergebnis, Maßnahmen und nächstes Review-Datum festhalten.",
        role: TPRM,
        decision: true,
        evidence: "Review-Protokoll",
      },
    ],
  },
  {
    code: "RB-12",
    title: "Konzentrationsrisiko bewerten",
    purpose: "Identifikation und Bewertung von Konzentrationsrisiken im Drittparteien-Portfolio.",
    scope: "Gesamtes Drittparteien-Portfolio inkl. Subdienstleister-Ketten.",
    trigger: "Halbjährlicher Turnus; Onboarding einer Drittpartei mit bestehendem Anbieter-Bezug.",
    prerequisites: "Vollständiges Register inkl. Subdienstleister und Datenstandorten.",
    input: "Drittparteien-Register, ICT-Service-Zuordnungen, Subdienstleister-Angaben.",
    roles: `Durchführung: ${TPRM}; Bewertung: ${ISO}; Kenntnisnahme: ${MGMT}.`,
    sla: "Analyse innerhalb von 15 Arbeitstagen.",
    escalation: "Kritische Konzentration ohne Ausweichoption → PB-08.",
    output: "Konzentrationsanalyse mit Kennzeichnung betroffener Drittparteien.",
    kpi: "Anzahl unbewerteter Konzentrationslagen (0).",
    controlPoints: "Mehrfachabhängigkeiten je Anbieter, Region und Subdienstleister geprüft.",
    reviewCycle: "Halbjährlich",
    steps: [
      {
        title: "Abhängigkeiten aggregieren",
        description: "Leistungen je Anbieter, Konzern, Region und Subdienstleister zusammenführen.",
        role: TPRM,
      },
      {
        title: "Konzentrationslagen identifizieren",
        description:
          "Mehrere kritische Services bei einem Anbieter oder gemeinsamer Subdienstleister?",
        role: TPRM,
      },
      {
        title: "Auswirkung bewerten",
        description: "Ausfallszenario je Konzentrationslage auf kritische Funktionen bewerten.",
        role: ISO,
      },
      {
        title: "Kennzeichnung setzen",
        description:
          "Betroffene Drittparteien als Konzentrationsrisiko markieren; Risiken im Register anlegen.",
        role: TPRM,
        evidence: "Konzentrationsanalyse",
      },
      {
        title: "Handlungsoptionen ableiten",
        description:
          "Diversifizierung, vertragliche Absicherung oder bewusste Akzeptanz vorschlagen.",
        role: TPRM,
        decision: true,
      },
    ],
  },
  {
    code: "RB-13",
    title: "Exit-Strategie und Exit-Plan überprüfen",
    purpose: "Sicherstellung tragfähiger, getesteter Exit-Strategien für kritische Drittparteien.",
    scope: "Alle Drittparteien, die kritische oder wichtige Funktionen unterstützen.",
    trigger: "Jährlicher Turnus; Vertragsverlängerung; erhöhtes Drittparteirisiko.",
    prerequisites: "Dokumentierte Exit-Strategie vorhanden (sonst PB-07).",
    input: "Exit-Strategie, Exit-Plan, letzter Testbericht, Vertragsklauseln.",
    roles: `Durchführung: ${TPRM}; Bewertung: ${ISO}; Kenntnisnahme: ${MGMT}.`,
    sla: "Überprüfung innerhalb von 20 Arbeitstagen nach Fälligkeit.",
    escalation: "Fehlende oder ungetestete Exit-Strategie bei kritischer Drittpartei → PB-07.",
    output: "Bewerteter, ggf. aktualisierter Exit-Plan mit Testnachweis.",
    kpi: "Anteil kritischer Drittparteien mit getestetem Exit-Plan (> 90 %).",
    controlPoints: "Test nicht älter als 24 Monate; Substitutionsoptionen aktuell.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Unterlagen sichten",
        description: "Exit-Strategie, Plan und letzten Test zusammenstellen.",
        role: TPRM,
      },
      {
        title: "Aktualität prüfen",
        description: "Passen Strategie und Plan noch zu Leistungsumfang und Datenlage?",
        role: TPRM,
      },
      {
        title: "Testbedarf feststellen",
        description: "Test fällig? Testtiefe (Desktop-Übung vs. Teilmigration) festlegen.",
        role: ISO,
        decision: true,
      },
      {
        title: "Test durchführen/begleiten",
        description: "Exit-Test durchführen; Ergebnisse und Lücken dokumentieren.",
        role: TPRM,
        evidence: "Exit-Test-Protokoll",
      },
      {
        title: "Plan aktualisieren",
        description: "Erkenntnisse einarbeiten; Status im Register aktualisieren.",
        role: TPRM,
      },
    ],
  },
  {
    code: "RB-14",
    title: "GRC-Datenqualität prüfen",
    purpose: "Regelmäßige Prüfung der Datenqualität im Risk Register und den verbundenen Modulen.",
    scope: "Risiken, Maßnahmen, Kontrollen, Drittparteien, Nachweise.",
    trigger: "Monatlicher Turnus vor dem Reporting (RB-08).",
    prerequisites: "Zugriff auf alle Register.",
    input:
      "Vollständigkeits- und Konsistenzregeln (Risiken ohne Owner, ohne aktuelle Bewertung, überfällige Reviews …).",
    roles: `Durchführung: ${RM}; Nacharbeit: jeweilige Owner; Bericht: ${ISO}.`,
    sla: "Prüfung bis 2. Arbeitstag des Monats.",
    escalation: "Systematische Qualitätsmängel → PB-09.",
    output: "Datenqualitätsbericht mit Bereinigungsaufträgen.",
    kpi: "Anteil Risiken ohne Owner (0 %); ohne aktuelle Bewertung (< 5 %).",
    controlPoints: "Automatische Qualitätsindikatoren im Dashboard; Stichproben.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Qualitätsindikatoren auswerten",
        description:
          "Dashboard-Kennzahlen (fehlende Owner, veraltete Bewertungen, überfällige Reviews) ziehen.",
        role: RM,
      },
      {
        title: "Stichproben prüfen",
        description:
          "Stichprobe auf inhaltliche Qualität (Beschreibung, Trennung Ursache/Ereignis/Wirkung) prüfen.",
        role: RM,
      },
      {
        title: "Bereinigung beauftragen",
        description: "Mängel den Ownern mit Frist zuweisen.",
        role: RM,
      },
      {
        title: "Nacharbeit verfolgen",
        description: "Erledigung überwachen; Restmängel dokumentieren.",
        role: RM,
        evidence: "Datenqualitätsbericht",
      },
    ],
  },
  {
    code: "RB-15",
    title: "Managemententscheidung dokumentieren",
    purpose: "Nachvollziehbare Dokumentation risikorelevanter Managemententscheidungen.",
    scope: "Alle Entscheidungen zu Risikoakzeptanzen, Eskalationen, Budget- und Strategiefragen.",
    trigger: "Entscheidungsvorlage an das Management; Gremiensitzung.",
    prerequisites: "Vollständige Entscheidungsvorlage mit Optionen und Empfehlung.",
    input: "Entscheidungsvorlage, Risikoanalyse, Stellungnahmen.",
    roles: `Vorbereitung: ${RM}; Entscheidung: ${MGMT}; Protokoll: ${RM}.`,
    sla: "Dokumentation innerhalb von 3 Arbeitstagen nach Entscheidung.",
    escalation: "Entfällt (Endpunkt der Eskalationskette).",
    output: "Dokumentierte Entscheidung mit Begründung, Auflagen und Terminen im System.",
    kpi: "Anteil dokumentierter Entscheidungen mit vollständiger Begründung (100 %).",
    controlPoints: "Entscheidung, Entscheider, Datum und Auflagen im Audit Trail.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Vorlage erstellen",
        description: "Sachverhalt, Optionen, Risiken und Empfehlung strukturiert aufbereiten.",
        role: RM,
      },
      {
        title: "Entscheidung herbeiführen",
        description: "Vorlage im Gremium behandeln; Entscheidung festhalten.",
        role: MGMT,
        decision: true,
      },
      {
        title: "Entscheidung erfassen",
        description: "Ergebnis, Begründung, Auflagen und Verantwortliche im Cockpit dokumentieren.",
        role: RM,
        evidence: "Entscheidungsdokumentation",
      },
      {
        title: "Umsetzung anstoßen",
        description: "Folgeaufgaben als Maßnahmen anlegen und zuweisen.",
        role: RM,
      },
    ],
  },
  {
    code: "RB-16",
    title: "Audit- oder Regulatorenanfrage bearbeiten",
    purpose:
      "Fristgerechte, vollständige und konsistente Beantwortung externer Prüfungs- und Aufsichtsanfragen.",
    scope: "Anfragen interner Revision, externer Prüfer und Aufsichtsbehörden mit ICT-/TPRM-Bezug.",
    trigger: "Eingang einer Anfrage.",
    prerequisites: "Benannter Koordinator; Zugriff auf Register und Nachweise.",
    input: "Anfrage, Fristen, angefragte Unterlagen.",
    roles: `Koordination: ${RM}; Zulieferung: Owner; Qualitätssicherung: ${ISO}; Freigabe: ${MGMT}.`,
    sla: "Gemäß gesetzter Frist; interne Vorlage 3 Arbeitstage vor Abgabe.",
    escalation: "Frist nicht haltbar → sofortige Information an Management und Anfragesteller.",
    output: "Freigegebene, versionierte Antwort mit Nachweisliste.",
    kpi: "Fristeinhaltung (100 %).",
    controlPoints:
      "Vier-Augen-Prinzip vor Abgabe; alle übermittelten Nachweise im Evidence-Register erfasst.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Anfrage erfassen und bewerten",
        description:
          "Umfang, Fristen und Zuständigkeiten klären; Auditor-Zugang (read-only) bereitstellen, falls vorgesehen.",
        role: RM,
      },
      {
        title: "Unterlagen zusammenstellen",
        description: "Angeforderte Auszüge und Nachweise aus dem Cockpit exportieren.",
        role: RM,
      },
      {
        title: "Qualitätssicherung",
        description: "Konsistenz und Vollständigkeit prüfen; Widersprüche klären.",
        role: ISO,
      },
      {
        title: "Freigabe",
        description: "Antwort durch Management freigeben.",
        role: MGMT,
        decision: true,
      },
      {
        title: "Übermittlung dokumentieren",
        description: "Abgabe, Empfänger und übermittelte Artefakte protokollieren.",
        role: RM,
        evidence: "Antwortpaket mit Nachweisliste",
      },
    ],
  },
  {
    code: "RB-17",
    title: "Risk Register Monatsabschluss",
    purpose:
      "Definierter Monatsabschluss als konsistente Datenbasis für Reporting und Trendanalysen.",
    scope: "Gesamtes Risk Register inkl. Maßnahmen und Akzeptanzen.",
    trigger: "Monatsultimo.",
    prerequisites: "Datenqualitätsprüfung (RB-14) abgeschlossen.",
    input: "Registerstand, offene Workflows, fällige Reviews.",
    roles: `Durchführung: ${RM}; Bestätigung: ${ISO}.`,
    sla: "Abschluss bis 3. Arbeitstag des Folgemonats.",
    escalation: "Ungeklärte Bestände → Eskalation an Owner mit Frist.",
    output: "Abgeschlossener Monatsstand (Report-Snapshot) für RB-08.",
    kpi: "Termintreue Monatsabschluss (100 %).",
    controlPoints: "Keine Risiken im Status Draft älter 30 Tage; überfällige Reviews adressiert.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Offene Workflows prüfen",
        description: "Lang laufende Drafts, Reviews und Freigaben identifizieren und nachfassen.",
        role: RM,
      },
      {
        title: "Fällige Reviews anstoßen",
        description: "Überfällige Risiko-Reviews den Ownern zuweisen (RB-02).",
        role: RM,
      },
      {
        title: "Statuskonsistenz prüfen",
        description: "Maßnahmen-, Akzeptanz- und Risikostatus auf Konsistenz prüfen.",
        role: RM,
      },
      {
        title: "Monatsstand einfrieren",
        description: "Report-Snapshot mit Stichtag erzeugen.",
        role: RM,
        evidence: "Monats-Snapshot",
      },
      {
        title: "Abschluss bestätigen",
        description: "ISO bestätigt den Abschluss; Basis für RB-08.",
        role: ISO,
        decision: true,
      },
    ],
  },
  {
    code: "RB-18",
    title: "Abweichung vom Risikoappetit behandeln",
    purpose:
      "Strukturierte Behandlung von Risiken, deren Residual Risk den Risikoappetit überschreitet.",
    scope: "Alle Risiken oberhalb der Appetit-Schwelle ihrer Kategorie.",
    trigger: "Bewertung oder Neubewertung ergibt Residual über Appetit.",
    prerequisites: "Aktuelle, freigegebene Bewertung.",
    input: "Bewertung, Appetit-Schwelle, Behandlungsoptionen.",
    roles: `Analyse: ${RM}; Entscheidung: ${RO} und ${MGMT}; Prüfung: ${SL}.`,
    sla: "Behandlungsentscheidung innerhalb von 15 Arbeitstagen.",
    escalation: "Kritische Überschreitung → PB-01 sofort aktivieren.",
    output:
      "Entschiedene Behandlung: zusätzliche Maßnahmen, Transfer oder formale befristete Akzeptanz.",
    kpi: "Anzahl unbehandelter Appetit-Überschreitungen älter 30 Tage (0).",
    controlPoints: "Keine stillschweigende Akzeptanz; Managementbeschluss verpflichtend.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Überschreitung analysieren",
        description: "Höhe und Ursache der Überschreitung sowie Zeithorizont bewerten.",
        role: RM,
      },
      {
        title: "Optionen erarbeiten",
        description:
          "Zusätzliche Maßnahmen, Transfer, Vermeidung oder befristete Akzeptanz mit Kosten/Nutzen darstellen.",
        role: RM,
      },
      {
        title: "Entscheidung einholen",
        description: "Risk Owner und Management entscheiden über die Option (ggf. RB-06, RB-15).",
        role: MGMT,
        decision: true,
      },
      {
        title: "Umsetzung verfolgen",
        description:
          "Beschlossene Maßnahmen anlegen und bis zur Rückkehr unter den Appetit überwachen.",
        role: RM,
        evidence: "Behandlungsentscheidung",
      },
    ],
  },
  {
    code: "RB-19",
    title: "Evidenz auf Gültigkeit und Vollständigkeit prüfen",
    purpose:
      "Sicherstellung, dass Nachweise aktuell, vollständig und den richtigen Objekten zugeordnet sind.",
    scope: "Alle Einträge im Evidence-Register.",
    trigger: "Quartalsweiser Turnus; ablaufende Gültigkeitsdaten.",
    prerequisites: "Gepflegtes Evidence-Register.",
    input: "Evidence-Einträge, Gültigkeitsdaten, Verknüpfungen.",
    roles: `Durchführung: ${RM} / ${TPRM} je Bereich; Prüfung: ${ISO}.`,
    sla: "Prüfung innerhalb von 10 Arbeitstagen nach Quartalsbeginn.",
    escalation:
      "Abgelaufene Nachweise für kritische Kontrollen/Drittparteien → Owner mit Frist, danach ISO.",
    output: "Bereinigtes Register; Liste nachzuliefernder Nachweise.",
    kpi: "Anteil gültiger Nachweise (> 95 %).",
    controlPoints: "Ablaufende Nachweise werden 60 Tage vorher angezeigt.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Ablaufende Nachweise identifizieren",
        description: "Einträge mit Gültigkeit < 60 Tage und ohne Review filtern.",
        role: RM,
      },
      {
        title: "Gültigkeit prüfen",
        description: "Inhaltliche Aktualität und Zuordnung (Risiko/Kontrolle/Drittpartei) prüfen.",
        role: RM,
      },
      {
        title: "Nachlieferung anfordern",
        description: "Owner um aktualisierte Nachweise mit Frist bitten.",
        role: RM,
      },
      {
        title: "Reviewstatus setzen",
        description: "Geprüfte Einträge als Reviewed markieren; abgelaufene als Expired.",
        role: ISO,
        evidence: "Prüfvermerk je Nachweis",
      },
    ],
  },
  {
    code: "RB-20",
    title: "Projektübergabe und nachhaltige Verankerung durchführen",
    purpose: "Geordnete Übergabe von Prozessen, Werkzeugen und Wissen in die Linienorganisation.",
    scope: "Alle im Projekt aufgebauten Prozesse, Register, Runbooks und Playbooks.",
    trigger: "Projektende oder Meilenstein-Übergabe.",
    prerequisites: "Dokumentation aktuell; Zielorganisation benannt.",
    input: "Prozessdokumentation, offene Punkte, Lessons Learned.",
    roles: `Durchführung: ${RM}; Abnahme: ${ISO} und ${MGMT}; Empfänger: Linienorganisation.`,
    sla: "Übergabe vollständig bis Projektende.",
    escalation: "Nicht übernehmbare Aufgaben → Managemententscheidung über Ressourcen.",
    output: "Abgenommenes Übergabeprotokoll; verankerte Regelprozesse mit Ownern.",
    kpi: "Anteil übergebener Prozesse mit benanntem Owner (100 %).",
    controlPoints: "Übergabe-Checkliste; Wirksamkeitskontrolle nach 3 Monaten.",
    reviewCycle: "Einmalig / bei Bedarf",
    steps: [
      {
        title: "Übergabeumfang festlegen",
        description: "Prozesse, Register, Berichte und offene Punkte inventarisieren.",
        role: RM,
      },
      {
        title: "Owner benennen",
        description: "Für jeden Regelprozess einen Owner in der Linie festlegen.",
        role: MGMT,
        decision: true,
      },
      {
        title: "Wissenstransfer durchführen",
        description: "Schulungen und begleitete Durchläufe der Runbooks durchführen.",
        role: RM,
      },
      {
        title: "Offene Punkte übergeben",
        description: "Restpunkte mit Prioritäten und Terminen dokumentiert übergeben.",
        role: RM,
      },
      {
        title: "Abnahme einholen",
        description: "Übergabeprotokoll durch ISO und Management abnehmen lassen.",
        role: ISO,
        evidence: "Übergabeprotokoll",
      },
      {
        title: "Wirksamkeit nachhalten",
        description:
          "Nach 3 Monaten prüfen, ob Prozesse gelebt werden; Lessons Learned dokumentieren.",
        role: ISO,
      },
    ],
  },
];
