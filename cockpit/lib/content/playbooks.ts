/**
 * Initiale Playbook-Definitionen (PB-01 … PB-16).
 * Quelle für den Seed; ausführliche Fassungen: docs/playbooks/PB-XX.md
 */

export interface PlaybookDef {
  code: string;
  scenario: string;
  objective: string;
  activationCriteria: string;
  severityGuidance: string;
  rolesRaci: string;
  initialAssessment: string;
  immediateActions: string;
  riskAnalysis: string;
  decisionTree: string;
  communication: string;
  regulatoryCheck: string;
  measures: string;
  evidenceRequired: string;
  closureCriteria: string;
  postEventReview: string;
}

export const PLAYBOOKS: PlaybookDef[] = [
  {
    code: "PB-01",
    scenario: "Kritisches ICT-Risiko über dem Risikoappetit",
    objective:
      "Kritische Appetit-Überschreitung kurzfristig unter Kontrolle bringen und Managemententscheidung herbeiführen.",
    activationCriteria:
      "Residual Risk in Klasse Critical UND oberhalb der Appetit-Schwelle der Kategorie.",
    severityGuidance: "Critical bei Bezug zu kritischen Funktionen; sonst High.",
    rolesRaci: "R: ICT Risk Manager; A: Risk Owner; C: ISO, Second Line; I: Management.",
    initialAssessment:
      "Bewertung validieren, betroffene Assets/Funktionen bestätigen, Zeithorizont der Exponierung schätzen.",
    immediateActions:
      "Kompensierende Sofortkontrollen prüfen; Exposition wo möglich sofort reduzieren; Owner-Meeting binnen 48 h.",
    riskAnalysis:
      "Ursachenanalyse; Prüfung, ob verwandte Risiken ebenfalls betroffen sind; Szenario- und Auswirkungsanalyse.",
    decisionTree:
      "Kurzfristige Reduktion möglich? → Ja: Sofortmaßnahmen + beschleunigter Behandlungsplan. Nein: Transfer möglich? → Ja: Transfer prüfen. Nein: befristete Akzeptanz mit Auflagen (RB-06) oder Aktivität einstellen (Avoid).",
    communication:
      "Sofortinformation an ISO und Management; Statusupdate wöchentlich bis Rückkehr unter Appetit.",
    regulatoryCheck:
      "DORA Kap. II (IKT-Risikomanagement): Angemessenheit der Maßnahmen dokumentieren; interne Risikoappetit-Vorgaben.",
    measures:
      "Beschleunigte Maßnahmen mit Eskalationsstufe 3; wöchentliches Tracking; ggf. Budget-Sonderfreigabe.",
    evidenceRequired:
      "Validierte Bewertung, Entscheidungsvorlage, Managementbeschluss, Maßnahmenplan.",
    closureCriteria:
      "Residual Risk unter Appetit ODER formell befristete, genehmigte Akzeptanz mit kompensierenden Kontrollen.",
    postEventReview:
      "Warum wurde die Überschreitung nicht früher erkannt? Frühindikatoren und Methodik anpassen.",
  },
  {
    code: "PB-02",
    scenario: "Wesentliche Kontrollschwäche",
    objective:
      "Auswirkung einer wesentlichen Kontrollschwäche eindämmen und Wirksamkeit wiederherstellen.",
    activationCriteria:
      "Kontrolltest mit Ergebnis Failed bei einer Schlüsselkontrolle oder Häufung von Findings.",
    severityGuidance:
      "Critical, wenn die Kontrolle kritische Funktionen oder mehrere hohe Risiken absichert; sonst High/Medium.",
    rolesRaci:
      "R: Control Owner; A: ISO; C: ICT Risk Manager, Second Line; I: Risk Owner, Management.",
    initialAssessment:
      "Umfang der Schwäche, betroffene Risiken und Zeitraum der Unwirksamkeit bestimmen.",
    immediateActions:
      "Kompensierende Kontrollen aktivieren; betroffene Risikobewertungen mit reduzierter Wirksamkeit aktualisieren.",
    riskAnalysis:
      "Alle über RiskControl verknüpften Risiken neu bewerten; Appetit-Überschreitungen identifizieren (→ PB-01).",
    decisionTree:
      "Kurzfristig behebbar (< 30 Tage)? → Ja: Remediation-Plan. Nein: kompensierende Kontrollen ausreichend? → Ja: befristeter Betrieb mit Kompensation. Nein: Eskalation an Management, ggf. Prozess einschränken.",
    communication:
      "ISO und betroffene Risk Owner unverzüglich; Management bei Critical binnen 24 h.",
    regulatoryCheck:
      "DORA Kap. II; ISO/IEC 27001 (Kontrollwirksamkeit); interne Kontrollstandards.",
    measures: "Remediation-Maßnahmen mit hoher Priorität; Nachtest terminieren; Ursachenanalyse.",
    evidenceRequired: "Testprotokoll, Ursachenanalyse, Remediation-Plan, Nachtest-Ergebnis.",
    closureCriteria: "Nachtest bestanden; betroffene Risikobewertungen aktualisiert.",
    postEventReview: "Testfrequenz und -tiefe prüfen; ähnliche Kontrollen proaktiv testen.",
  },
  {
    code: "PB-03",
    scenario: "Kritische Maßnahme überfällig",
    objective:
      "Überfällige kritische Maßnahme priorisiert zum Abschluss bringen oder Alternativen entscheiden.",
    activationCriteria:
      "Maßnahme mit Priorität Critical/High überfällig > 15 Tage oder wiederholt verschoben.",
    severityGuidance: "Nach Priorität der Maßnahme und Klasse des zugehörigen Risikos.",
    rolesRaci: "R: Action Owner; A: Risk Owner; C: ICT Risk Manager; I: ISO, Management.",
    initialAssessment:
      "Verzugsursache (Ressourcen, Abhängigkeiten, Technik) und Restaufwand ermitteln.",
    immediateActions: "Eskalationsstufe setzen (RB-05); Blocker benennen; Interimsschutz prüfen.",
    riskAnalysis:
      "Auswirkung des Verzugs auf das Residual Risk bewerten; Exponierungszeitraum dokumentieren.",
    decisionTree:
      "Blocker auflösbar? → Ja: neuer verbindlicher Termin + wöchentliches Tracking. Nein: Alternative Maßnahme möglich? → Ja: Plan ändern. Nein: Managemententscheidung über Ressourcen oder Risikoakzeptanz.",
    communication: "Statusbericht an Risk Owner und ISO; ab Stufe 3 an Management.",
    regulatoryCheck: "Nachweis der Nachverfolgung (DORA-Governance, interne Vorgaben).",
    measures: "Re-Planung, Ressourcen-Zuweisung, ggf. Ersatzmaßnahme.",
    evidenceRequired: "Eskalationsvermerke, neuer Plan, Managementbeschluss falls erforderlich.",
    closureCriteria:
      "Maßnahme abgeschlossen und validiert ODER formal ersetzte/akzeptierte Alternative.",
    postEventReview: "Planungsqualität und Frühwarnung (Fortschritts-Tracking) verbessern.",
  },
  {
    code: "PB-04",
    scenario: "ICT-Drittpartei mit erhöhtem Risiko",
    objective:
      "Erhöhtes Drittparteirisiko bewerten, eindämmen und Beziehung risikoadäquat steuern.",
    activationCriteria:
      "Review-Ergebnis mit erhöhtem Risiko, negative Marktinformation, Zertifikatsverlust, Incident-Häufung.",
    severityGuidance: "Critical bei Unterstützung kritischer Funktionen; sonst nach Bewertung.",
    rolesRaci:
      "R: Third Party Risk Manager; A: Business Owner; C: ISO, ICT Risk Manager; I: Management, Contract Owner.",
    initialAssessment:
      "Auslöser validieren; betroffene Services und Funktionen bestimmen; aktuelle Nachweise sichten.",
    immediateActions:
      "Ad-hoc-Kontakt mit der Drittpartei; zusätzliche Überwachung; ggf. Datenflüsse einschränken.",
    riskAnalysis:
      "Drittparteirisiko neu bewerten; abhängige Register-Risiken aktualisieren; Konzentrations- und Exit-Lage prüfen.",
    decisionTree:
      "Risiko kurzfristig mitigierbar (Auflagen, Nachbesserung)? → Ja: Maßnahmenplan mit Frist. Nein: Substituierbar? → Ja: Exit-Vorbereitung (RB-13). Nein: verstärkte Überwachung + Managemententscheidung.",
    communication:
      "Business/Contract Owner und ISO informieren; Management bei kritischen Funktionen.",
    regulatoryCheck:
      "DORA Kap. V (IKT-Drittparteirisiko), EBA Outsourcing GL: Meldepflichten und Registerpflege prüfen.",
    measures:
      "Auflagenkatalog, Nachbesserungsfristen, verstärktes Monitoring, Exit-Readiness erhöhen.",
    evidenceRequired: "Neubewertung, Korrespondenz, Auflagen, Monitoring-Berichte.",
    closureCriteria: "Risiko wieder im akzeptierten Bereich oder Exit eingeleitet.",
    postEventReview: "Frühindikatoren (KPI, Meldewege) der Drittparteiüberwachung schärfen.",
  },
  {
    code: "PB-05",
    scenario: "Ausfall eines kritischen ICT-Dienstleisters",
    objective:
      "Auswirkungen eines Ausfalls auf kritische Funktionen begrenzen und Wiederanlauf koordinieren.",
    activationCriteria:
      "Nicht verfügbarer Service eines Dienstleisters, der kritische/wichtige Funktionen unterstützt.",
    severityGuidance:
      "Critical bei Ausfall kritischer Funktionen ohne Workaround; High bei Teilverfügbarkeit.",
    rolesRaci:
      "R: Third Party Risk Manager + Business Owner; A: Management; C: ISO, BCM; I: alle betroffenen Bereiche.",
    initialAssessment:
      "Ausfallumfang, betroffene Funktionen, prognostizierte Dauer, Datenintegrität klären.",
    immediateActions:
      "BCM-/Notfallpläne aktivieren; Workarounds starten; Kommunikationskanal zum Dienstleister etablieren.",
    riskAnalysis:
      "Auswirkungsanalyse je kritischer Funktion; Folgeschäden (Fristen, Kunden, Meldepflichten) bewerten.",
    decisionTree:
      "Wiederanlauf < RTO? → Ja: Monitoring bis Normalbetrieb. Nein: Workaround trägt? → Ja: Notbetrieb + Eskalation an Dienstleister. Nein: Exit-/Ersatzoption aktivieren (RB-13), Management-Krisenentscheidung.",
    communication:
      "Interne Statusmeldungen in festem Takt; Meldepflichten (Aufsicht, Kunden) über Compliance prüfen.",
    regulatoryCheck:
      "DORA (IKT-Vorfallsmanagement, Drittparteirisiko): Meldepflichten fristgerecht prüfen und dokumentieren.",
    measures:
      "Wiederanlaufbegleitung, Nachforderung Root-Cause-Analyse beim Dienstleister, Vertrags-/SLA-Konsequenzen.",
    evidenceRequired: "Incident-Timeline, Entscheidungen, Meldeprüfung, RCA des Dienstleisters.",
    closureCriteria: "Normalbetrieb bestätigt, RCA bewertet, Folgeaktionen angelegt.",
    postEventReview:
      "Exit-Plan- und BCM-Test-Erkenntnisse einarbeiten; Konzentrationslage neu bewerten.",
  },
  {
    code: "PB-06",
    scenario: "Lieferantenbedingter Informationssicherheitsvorfall",
    objective:
      "Sicherheitsvorfall mit Ursprung bei einer Drittpartei eindämmen, bewerten und nachverfolgen.",
    activationCriteria:
      "Meldung eines Sicherheitsvorfalls durch/bei einer Drittpartei mit potenzieller Auswirkung auf eigene Daten/Services.",
    severityGuidance:
      "Nach Datenklassifikation und Funktionsbezug; Critical bei vertraulichen Daten oder kritischen Funktionen.",
    rolesRaci:
      "R: ISO + Third Party Risk Manager; A: Management; C: Datenschutz, Incident Response; I: Business Owner.",
    initialAssessment:
      "Betroffene Daten/Systeme, Angriffsvektor, Zeitraum, eigener Exposure klären.",
    immediateActions:
      "Schnittstellen/Zugänge der Drittpartei prüfen und ggf. einschränken; eigene Detektion schärfen; Incident-Prozess starten.",
    riskAnalysis:
      "Auswirkung auf C/I/A und Datenschutz bewerten; Register-Risiken zur Drittpartei aktualisieren.",
    decisionTree:
      "Eigene Systeme betroffen? → Ja: eigenes Incident Response parallel. Nein: Datenabfluss möglich? → Ja: Melde-/Informationspflichten prüfen. Nein: erhöhtes Monitoring und Nachweisanforderung.",
    communication:
      "Interne Eskalation nach Incident-Prozess; externe Meldungen ausschließlich über Compliance/Datenschutz.",
    regulatoryCheck:
      "DORA (Vorfallsklassifizierung/-meldung), DSGVO Art. 33/34 über Datenschutz, vertragliche Incident-Meldepflichten.",
    measures:
      "Auflagen an die Drittpartei (RCA, Härtung, Nachweise), Nachtest, ggf. Assessment vorziehen (RB-11).",
    evidenceRequired: "Vorfallsmeldung, eigene Bewertungen, Meldeprüfungen, RCA, Abschlussbericht.",
    closureCriteria: "Vorfall geschlossen, Auflagen erfüllt oder terminiert, Risiken aktualisiert.",
    postEventReview:
      "Vertragliche Meldewege und Reaktionszeiten bewerten; Lessons Learned in RB-09/RB-11 einarbeiten.",
  },
  {
    code: "PB-07",
    scenario: "Fehlende oder unzureichende Exit-Strategie",
    objective: "Für kritische Drittparteien kurzfristig eine tragfähige Exit-Strategie herstellen.",
    activationCriteria:
      "Kritische Drittpartei ohne dokumentierte oder ohne getestete Exit-Strategie (RB-13 negativ).",
    severityGuidance:
      "High; Critical bei gleichzeitig schwacher Substituierbarkeit oder erhöhtem Drittparteirisiko.",
    rolesRaci:
      "R: Third Party Risk Manager; A: Business Owner; C: ISO, Contract Owner; I: Management.",
    initialAssessment:
      "Lücke präzisieren (fehlt ganz / veraltet / ungetestet); Abhängigkeitsgrad bestimmen.",
    immediateActions:
      "Interims-Notfalloption dokumentieren; Datenexport-/Migrationsfähigkeit prüfen.",
    riskAnalysis:
      "Risiko 'Vendor Lock-in / fehlgeschlagener Exit' im Register anlegen bzw. aktualisieren.",
    decisionTree:
      "Substituierbar? → Ja: Exit-Plan erstellen + Test terminieren. Nein: Reduktionsoptionen (Datenportabilität, Escrow, Zweitanbieter)? → Ja: umsetzen. Nein: Managemententscheidung über bewusste Abhängigkeit.",
    communication: "Business Owner und Management über Lücke und Zeitplan informieren.",
    regulatoryCheck:
      "DORA Kap. V / EBA Outsourcing GL (Exit-Strategien für kritische Funktionen) – Dokumentationspflicht.",
    measures:
      "Exit-Strategie erstellen, Exit-Plan testen (mind. Desktop-Übung), Vertragsklauseln nachverhandeln.",
    evidenceRequired: "Exit-Strategie, Testprotokoll, Managemententscheidung bei Restlücke.",
    closureCriteria: "Genehmigte Exit-Strategie mit aktuellem Test vorhanden.",
    postEventReview: "Onboarding-Prozess (RB-09) um Exit-Pflichten vor Vertragsschluss schärfen.",
  },
  {
    code: "PB-08",
    scenario: "Konzentrationsrisiko bei ICT-Dienstleistern",
    objective: "Kritische Konzentrationslage transparent machen und steuerbar halten.",
    activationCriteria:
      "RB-12 identifiziert Konzentration mit Bezug zu kritischen Funktionen ohne ausreichende Ausweichoptionen.",
    severityGuidance:
      "High; Critical bei zusätzlicher geografischer oder Subdienstleister-Konzentration.",
    rolesRaci:
      "R: Third Party Risk Manager; A: Management; C: ISO, ICT Risk Manager; I: Business Owner.",
    initialAssessment:
      "Konzentrationsdimension (Anbieter, Konzern, Region, Subdienstleister) und betroffene Funktionen präzisieren.",
    immediateActions:
      "Konzentrationskennzeichnung im Register setzen; Ausfallszenario dokumentieren.",
    riskAnalysis:
      "Aggregiertes Ausfallszenario bewerten; Register-Risiko 'Konzentration' anlegen/aktualisieren.",
    decisionTree:
      "Diversifizierung wirtschaftlich machbar? → Ja: Diversifizierungs-Roadmap. Nein: Resilienz beim Anbieter erhöhbar (Multi-Region, SLA)? → Ja: vertraglich vereinbaren. Nein: bewusste Akzeptanz durch Management mit Monitoring.",
    communication: "Managementvorlage mit Optionen und Empfehlung (RB-15).",
    regulatoryCheck: "DORA Kap. V (Konzentrationsrisiko) – Analyse und Entscheidung dokumentieren.",
    measures:
      "Diversifizierung, vertragliche Resilienzanforderungen, verstärktes Monitoring, Exit-Readiness.",
    evidenceRequired: "Konzentrationsanalyse, Entscheidungsvorlage, Beschluss.",
    closureCriteria: "Entschiedene Strategie mit Umsetzungsplan; Risiko im Register geführt.",
    postEventReview: "Portfolio-Kennzahlen zur Früherkennung von Konzentration etablieren.",
  },
  {
    code: "PB-09",
    scenario: "Unvollständige oder inkonsistente Risikodokumentation",
    objective:
      "Systematische Qualitätsmängel in der Risikodokumentation beheben und Wiederholung verhindern.",
    activationCriteria:
      "RB-14 zeigt systematische Mängel (z. B. > 10 % ohne Owner/Bewertung) oder Audit-Feststellung zur Datenqualität.",
    severityGuidance: "Medium; High bei aufsichtsrechtlicher Relevanz oder bevorstehender Prüfung.",
    rolesRaci: "R: ICT Risk Manager; A: ISO; C: Owner der betroffenen Einträge; I: Management.",
    initialAssessment:
      "Umfang, Muster und Ursachen der Mängel (Prozess, Schulung, Tooling) analysieren.",
    immediateActions:
      "Bereinigungsliste erstellen; Owner mit Fristen beauftragen; kritische Einträge priorisieren.",
    riskAnalysis: "Operationelles Risiko 'Fehlsteuerung durch mangelhafte Datenbasis' bewerten.",
    decisionTree:
      "Ursache prozessual? → Ja: Prozess/Runbook anpassen. Ursache Wissen? → Ja: Schulung. Ursache Tooling? → Ja: Validierungen/Pflichtfelder nachschärfen.",
    communication: "Qualitätsbericht an ISO und Management; Fortschritt wöchentlich.",
    regulatoryCheck: "Nachweisfähigkeit gegenüber Prüfern sicherstellen (Dokumentationspflichten).",
    measures: "Datenbereinigung, Prozess-/Schulungsmaßnahmen, zusätzliche Validierungen.",
    evidenceRequired: "Qualitätsbericht, Bereinigungsnachweise, angepasste Prozesse.",
    closureCriteria: "Qualitätskennzahlen wieder im Zielbereich; Ursachen adressiert.",
    postEventReview: "Qualitätsindikatoren und Review-Frequenz (RB-14) anpassen.",
  },
  {
    code: "PB-10",
    scenario: "Negative Kontrollprüfung",
    objective: "Auf ein negatives Kontrolltest-Ergebnis strukturiert reagieren.",
    activationCriteria: "Kontrolltest mit Ergebnis Failed (RB-07).",
    severityGuidance:
      "Nach Bedeutung der Kontrolle: Schlüsselkontrolle → PB-02 zusätzlich aktivieren.",
    rolesRaci: "R: Control Owner; A: ISO; C: ICT Risk Manager; I: Risk Owner.",
    initialAssessment:
      "Finding-Schwere, betroffene Risiken und Zeitraum der Unwirksamkeit bestimmen.",
    immediateActions:
      "Wirksamkeit in verknüpften Risikobewertungen herabsetzen; Interimskontrollen prüfen.",
    riskAnalysis: "Neuberechnung der Residual-Scores; Appetit-Prüfung (→ RB-18/PB-01).",
    decisionTree:
      "Design-Problem? → Kontrolle neu konzipieren. Ausführungsproblem? → Remediation + Schulung. Nicht mehr benötigt? → Kontrolle formal außer Betrieb nehmen und Risiken neu bewerten.",
    communication: "ISO und betroffene Risk Owner; Management bei wesentlichen Kontrollen.",
    regulatoryCheck: "Kontrollnachweise für Prüfungen aktuell halten (ISO 27001, DORA).",
    measures: "Remediation-Maßnahme mit Frist, Nachtest, Ursachenanalyse.",
    evidenceRequired: "Testprotokoll, Remediation-Plan, Nachtest.",
    closureCriteria: "Nachtest bestanden; Bewertungen aktualisiert.",
    postEventReview: "Erkenntnisse in Kontrolldesign-Standards überführen.",
  },
  {
    code: "PB-11",
    scenario: "Dringende Risikoakzeptanz",
    objective: "Zeitkritische Akzeptanzentscheidung ordnungsgemäß, aber beschleunigt herbeiführen.",
    activationCriteria:
      "Akzeptanzentscheidung erforderlich < 5 Arbeitstage (z. B. Go-live-Termin, auslaufender Vertrag).",
    severityGuidance: "Nach Risikoklasse des zu akzeptierenden Risikos.",
    rolesRaci: "R: Risk Owner; A: Management; C: ISO, Second Line; I: ICT Risk Manager.",
    initialAssessment: "Dringlichkeit validieren: Ist die Frist real oder verschiebbar?",
    immediateActions:
      "Beschleunigtes Verfahren einberufen; Entscheidungsvorlage in Kurzform mit vollständiger Risikodarstellung.",
    riskAnalysis:
      "Verkürzte, aber dokumentierte Bewertung inkl. Appetit-Bezug und kompensierender Kontrollen.",
    decisionTree:
      "Frist verschiebbar? → Ja: Regelprozess RB-06. Nein: Quorum für Eilentscheid erreichbar? → Ja: Eilentscheid mit kurzer Befristung (max. 3 Monate) + Nachprüfung im Regelprozess. Nein: Aktivität bis zur Entscheidung zurückstellen.",
    communication: "Alle Genehmiger synchron informieren; Entscheidung unmittelbar dokumentieren.",
    regulatoryCheck:
      "Auch im Eilverfahren: Begründungs- und Dokumentationspflicht bleibt vollständig bestehen.",
    measures: "Kurzbefristung, Auflagen, verpflichtende Regelnachprüfung binnen 4 Wochen.",
    evidenceRequired: "Eil-Entscheidungsvorlage, Beschluss, Nachprüfungsprotokoll.",
    closureCriteria:
      "Reguläre Nachprüfung abgeschlossen; Akzeptanz regulär befristet oder beendet.",
    postEventReview: "Warum wurde die Entscheidung erst spät nötig? Vorlaufprozesse verbessern.",
  },
  {
    code: "PB-12",
    scenario: "Audit Finding oder aufsichtsrechtliche Feststellung",
    objective: "Externe Feststellungen fristgerecht, nachvollziehbar und nachhaltig abarbeiten.",
    activationCriteria:
      "Formale Feststellung aus interner Revision, externer Prüfung oder Aufsicht mit ICT-/TPRM-Bezug.",
    severityGuidance: "Nach Einstufung des Prüfers (z. B. wesentlich/major → High/Critical).",
    rolesRaci:
      "R: ICT Risk Manager (Koordination); A: Management; C: ISO, betroffene Owner; I: Second Line.",
    initialAssessment:
      "Feststellung, Frist, geforderte Nachweise und betroffene Prozesse erfassen.",
    immediateActions:
      "Feststellung als Risiko/Maßnahme im Register anlegen; Verantwortliche und Termine festlegen.",
    riskAnalysis:
      "Zugrundeliegendes Risiko bewerten; verwandte Bereiche auf gleiche Schwäche prüfen.",
    decisionTree:
      "Frist realistisch? → Ja: Umsetzungsplan. Nein: begründeten Fristverlängerungsantrag über Management. Feststellung strittig? → Stellungnahme über Management/Compliance.",
    communication:
      "Regelmäßige Statusberichte an Management; Kommunikation mit Prüfer über definierten Kanal (RB-16).",
    regulatoryCheck:
      "Fristen und Form der Rückmeldung einhalten; Nachweise im Evidence-Register führen.",
    measures:
      "Maßnahmen mit Prüfungsbezug kennzeichnen; Wirksamkeitsnachweis vor Meldung der Erledigung.",
    evidenceRequired: "Feststellungstext, Maßnahmenplan, Umsetzungsnachweise, Erledigungsmeldung.",
    closureCriteria:
      "Prüfer/Aufsicht bestätigt Erledigung oder interner Wirksamkeitsnachweis erbracht.",
    postEventReview: "Root Cause über Einzelfall hinaus adressiert? Kontrollen/Prozesse angepasst?",
  },
  {
    code: "PB-13",
    scenario: "Management-Eskalation",
    objective: "Entscheidungs- oder Konfliktfälle strukturiert auf Managementebene lösen.",
    activationCriteria:
      "Eskalationsstufe 3 erreicht; Patt zwischen Beteiligten; Ressourcen-/Budgetkonflikt mit Risikofolge.",
    severityGuidance: "Nach Risikoklasse des zugrunde liegenden Sachverhalts.",
    rolesRaci:
      "R: ICT Risk Manager (Vorbereitung); A: Management; C: ISO, betroffene Owner; I: Second Line.",
    initialAssessment:
      "Eskalationsgegenstand, bisherige Lösungsversuche und Entscheidungsbedarf präzisieren.",
    immediateActions:
      "Entscheidungsvorlage mit Optionen, Risiken und Empfehlung erstellen (RB-15).",
    riskAnalysis: "Risiko jeder Option quantifizieren (inkl. Nichtentscheidung).",
    decisionTree:
      "Entscheidung getroffen? → Ja: Umsetzung mit Terminen dokumentieren. Vertagt? → Interimsmaßnahmen festlegen und Wiedervorlage terminieren.",
    communication: "Ergebnis an alle Beteiligten; Umsetzung im Register nachverfolgbar.",
    regulatoryCheck: "Governance-Nachweis: Entscheidung, Entscheider und Begründung dokumentiert.",
    measures: "Beschlossene Aufgaben als Maßnahmen mit Owner und Frist.",
    evidenceRequired: "Entscheidungsvorlage, Beschlussprotokoll.",
    closureCriteria: "Entscheidung dokumentiert und Folgeaufgaben angelegt.",
    postEventReview: "Hätte die Eskalation früher/niedriger gelöst werden können?",
  },
  {
    code: "PB-14",
    scenario: "Neue regulatorische Anforderung",
    objective: "Neue Anforderung bewerten, Gap-Analyse durchführen und Umsetzung steuern.",
    activationCriteria:
      "Veröffentlichung/Änderung relevanter Regulatorik (z. B. RTS zu DORA) mit Anwendungsbezug.",
    severityGuidance: "Nach Umsetzungsfrist und Gap-Größe: kurzfristig + große Lücke → High.",
    rolesRaci: "R: ISO; A: Management; C: ICT Risk Manager, TPRM, Compliance; I: betroffene Owner.",
    initialAssessment: "Anwendbarkeit, Frist und betroffene Prozesse/Systeme klären.",
    immediateActions:
      "Anforderung im Regulatorik-Register anlegen; Compliance-Mapping mit Status Not Assessed erstellen.",
    riskAnalysis: "Gap-Analyse je Anforderung; Nichterfüllungsrisiko bewerten.",
    decisionTree:
      "Bereits erfüllt? → Ja: Status mit Nachweis dokumentieren. Teilweise? → Umsetzungsplan mit Priorität. Nicht anwendbar? → Not Applicable mit Begründung und Review-Datum.",
    communication:
      "Umsetzungsstand regelmäßig an Management; Schnittstellen (Datenschutz, Compliance) einbinden.",
    regulatoryCheck:
      "Kein automatisches Compliance-Urteil: Status je Anforderung mit Begründung, Owner, Nachweis, Reviewer pflegen.",
    measures: "Umsetzungsmaßnahmen je Gap mit Terminen vor Ablauf der Frist.",
    evidenceRequired: "Gap-Analyse, Mapping-Einträge, Umsetzungsnachweise.",
    closureCriteria: "Alle Mappings bewertet; Gaps mit Plan versehen oder geschlossen.",
    postEventReview: "Regulatorik-Monitoring-Prozess auf Vollständigkeit prüfen.",
  },
  {
    code: "PB-15",
    scenario: "Wesentliche Veränderung eines ICT-Services",
    objective:
      "Risikoauswirkungen wesentlicher Service-Änderungen (Migration, Architektur, Anbieterwechsel) beherrschen.",
    activationCriteria:
      "Angekündigte wesentliche Änderung an einem ICT-Service mit Bezug zu kritischen Funktionen.",
    severityGuidance: "Nach Kritikalität des Services und Reversibilität der Änderung.",
    rolesRaci:
      "R: ICT Risk Manager; A: Business Owner; C: ISO, TPRM (bei Drittbezug); I: Management.",
    initialAssessment:
      "Änderungsumfang, Zeitplan, betroffene Funktionen und Rückfalloptionen erfassen.",
    immediateActions:
      "Risikoanalyse vor Umsetzung terminieren; bestehende Bewertungen als überprüfungsbedürftig markieren.",
    riskAnalysis:
      "Neue/veränderte Risiken erfassen (RB-01) und bewerten; Kontrolllandschaft auf Lücken prüfen.",
    decisionTree:
      "Risiken beherrschbar? → Ja: Umsetzung mit Auflagen. Nein: Änderung verschieben/anpassen oder Managemententscheidung.",
    communication: "Ergebnis der Risikoanalyse an Change-/Projektverantwortliche und Management.",
    regulatoryCheck:
      "DORA-Anforderungen an Änderungsmanagement und ggf. Drittparteiregister-Aktualisierung.",
    measures: "Auflagen zur Umsetzung, Kontrollanpassungen, Nach-Implementierungs-Review.",
    evidenceRequired: "Änderungsbeschreibung, Risikoanalyse, Auflagen, Abnahme.",
    closureCriteria: "Änderung umgesetzt, Nachreview durchgeführt, Register aktuell.",
    postEventReview: "Zusammenspiel Change-Prozess ↔ Risikomanagement bewerten.",
  },
  {
    code: "PB-16",
    scenario: "Kritische Abhängigkeit von Subdienstleistern",
    objective: "Transparenz und Steuerbarkeit kritischer Sub-Dienstleisterketten herstellen.",
    activationCriteria:
      "Erkennung eines kritischen Subdienstleisters (RB-12) oder gemeldete Änderung der Subdienstleisterkette.",
    severityGuidance:
      "High bei kritischen Funktionen; Critical bei zusätzlich fehlender Transparenz/Vertragsdeckung.",
    rolesRaci:
      "R: Third Party Risk Manager; A: Business Owner; C: ISO, Contract Owner; I: Management.",
    initialAssessment:
      "Kette dokumentieren: Wer erbringt welchen Leistungsanteil an welchem Standort?",
    immediateActions:
      "Auskunft vom Hauptdienstleister anfordern; Vertragslage zu Subvergabe prüfen.",
    riskAnalysis:
      "Ausfall-/Sicherheitsrisiko je kritischem Subdienstleister bewerten; Konzentrationsbezug prüfen (PB-08).",
    decisionTree:
      "Vertrag deckt Kontrolle der Subvergabe? → Ja: Auflagen durchsetzen. Nein: Nachverhandlung möglich? → Ja: Vertragsanpassung. Nein: Risikobewertung + Managemententscheidung über Fortführung.",
    communication: "Business/Contract Owner einbinden; Management bei kritischen Ketten.",
    regulatoryCheck:
      "DORA/EBA Outsourcing: Anforderungen an Subauslagerungen (Transparenz, Weitergabe von Pflichten) prüfen.",
    measures:
      "Vertragsanpassungen, erweitertes Monitoring, Register-Aktualisierung, ggf. Exit-Vorbereitung.",
    evidenceRequired: "Ketten-Dokumentation, Vertragsanalyse, Auflagen, Beschlüsse.",
    closureCriteria: "Kette dokumentiert, vertraglich gedeckt und risikobewertet.",
    postEventReview: "Meldepflichten zu Subdienstleister-Änderungen in Verträgen verankern.",
  },
];
