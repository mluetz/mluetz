# RACI-Matrix und Funktionstrennung

**Dokument:** Governance – Rollen- und Verantwortlichkeitsmodell
**Anwendung:** ICT & Third Party Risk Management Cockpit
**Status:** Freigegeben | **Version:** 1.0 | **Stand:** 2026-08

---

## 1. Zweck und Geltungsbereich

Dieses Dokument definiert die Verantwortlichkeiten der zehn Anwendungsrollen über die Kernprozesse des Cockpits nach dem RACI-Schema. Es dient als verbindliche Referenz für die Rechtekonfiguration (RBAC), für interne Kontrollen und für Prüfungen durch Interne Revision und Aufsicht (DORA-Kontext, Art. 5 ff. – ICT-Risikomanagement-Rahmenwerk).

**Legende:** **R** = Responsible (führt aus) | **A** = Accountable (rechenschaftspflichtig, genau eine Rolle je Prozess) | **C** = Consulted (wird einbezogen) | **I** = Informed (wird informiert) | – = keine Beteiligung

## 2. Rollenübersicht

| Rolle                              | Kurzbeschreibung                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------- |
| Administrator                      | Technische Administration, Benutzer- und Rechteverwaltung, Konfiguration (AppSetting)  |
| ICT Risk Manager                   | Methodenhoheit ICT-Risiken, Koordination Risikoprozess, Qualitätssicherung First Line  |
| Third Party Risk Manager           | Steuerung Drittparteirisiken, Due Diligence, Vertrags- und Exit-Strategie-Prozess      |
| Information Security Officer (ISO) | Fachliche Bewertung Informationssicherheit, Kontrollanforderungen, Sicherheitsvorgaben |
| Risk Owner                         | Fachliche Verantwortung für einzelne Risiken, Genehmigung der Bewertung                |
| Control Owner                      | Verantwortung für Design und Betrieb zugeordneter Kontrollen                           |
| Action Owner                       | Umsetzung zugewiesener Maßnahmen                                                       |
| Reviewer/Second Line               | Unabhängige Zweitprüfung (Second Line of Defense), Qualitäts- und Second-Line-Review   |
| Management                         | Freigaben (insb. Risikoakzeptanzen), Kenntnisnahme Berichte; ansonsten Read-only       |
| Auditor                            | Lesender Zugriff auf alle Daten inkl. Audit Trail; keine Schreibrechte                 |

## 3. RACI-Matrix Kernprozesse

| Prozess                                             | Admin | ICT RM | TP RM | ISO | Risk Owner | Control Owner | Action Owner | Reviewer/2nd Line | Management | Auditor |
| --------------------------------------------------- | ----- | ------ | ----- | --- | ---------- | ------------- | ------------ | ----------------- | ---------- | ------- |
| Risiko erfassen & bewerten (Draft, Self Assessment) | –     | A      | C¹    | C   | R          | C             | –            | I                 | I          | I       |
| Quality Review (Risikobewertung)                    | –     | R/A    | C¹    | C   | I          | –             | –            | C                 | –          | I       |
| Risikofreigabe (Risk Owner Approval)                | –     | C      | –     | C   | R/A        | –             | –            | I                 | I          | I       |
| Second-Line-Review                                  | –     | I      | I     | C   | I          | –             | –            | R/A               | I          | I       |
| Risikoakzeptanz (Antrag bis Wiedervorlage)          | –     | R      | C¹    | C   | R          | C             | –            | C                 | A²         | I       |
| Maßnahmenmanagement (Planned → Closed)              | –     | C      | C¹    | C   | A          | C             | R            | C³                | I          | I       |
| Kontrolltest / Control Assessment                   | –     | C      | –     | C   | I          | R/A           | –            | C⁴                | I          | I       |
| Third-Party-Assessment (Screening → Renewal/Exit)   | –     | C      | R/A   | C   | C          | –             | –            | C                 | I⁵         | I       |
| Reporting (Erstellung & Verteilung)                 | –     | R/A    | R     | C   | I          | I             | I            | C                 | I          | I       |
| Administration (Benutzer, Rollen, AppSetting)       | R/A   | C      | C     | C   | –          | –             | –            | –                 | I          | I       |
| Audit / Prüfungshandlungen                          | C     | C      | C     | C   | C          | C             | C            | C                 | I          | R/A⁶    |

¹ Bei Risiken/Maßnahmen mit Drittparteibezug. ² Managementfreigabe ist zwingende Voraussetzung jeder Akzeptanz; Management ist Accountable für die Akzeptanzentscheidung. ³ Effectiveness Review der Maßnahme durch Reviewer/Second Line. ⁴ Wirksamkeitsbeurteilung (Effective/Ineffective) wird durch die Second Line qualitätsgesichert. ⁵ Bei kritischen oder wichtigen Funktionen: Management = A für die Approval-Stufe. ⁶ Der Auditor ist Accountable für seine Prüfungshandlungen, nicht für die geprüften Prozesse.

## 4. Prozessspezifische Hinweise

- **Risikoerfassung:** Jedes Risiko erhält bei Erfassung genau einen Risk Owner und eine RiskCategory. Ohne benannten Risk Owner ist kein Statusübergang über Draft hinaus möglich.
- **Quality Review:** Der ICT Risk Manager prüft methodische Konsistenz (Skalenanwendung, Auswirkungsdimensionen, Vollständigkeit) vor der Owner-Freigabe.
- **Second-Line-Review:** Die Second Line prüft unabhängig; sie kann das Risiko in den Status Self Assessment zurückweisen. Erst danach: Open/Treatment.
- **Akzeptanz:** Befristung, kompensierende Kontrollen und Managementfreigabe sind Pflichtfelder des Workflows (siehe `docs/governance/risk-methodology.md`, Abschnitt 8).
- **Kontrolltest:** Der Control Owner dokumentiert das ControlAssessment; die abgeleitete Effectiveness fließt in die Residual-Berechnung ein.
- **Third Party:** Der Third Party Risk Manager führt durch alle Stufen (Screening → Kritikalität → Due Diligence → Risk Assessment → Vertragsprüfung → Approval → Monitoring → Renewal/Exit); ISO und ICT Risk Manager werden bei sicherheits- bzw. risikorelevanten Feststellungen konsultiert.

## 5. Funktionstrennungsprinzipien (Segregation of Duties)

Die folgenden Prinzipien sind im RBAC der Anwendung serverseitig durchgesetzt und werden über den AuditLog nachweisbar gemacht:

### 5.1 Ersteller ≠ Reviewer

- Wer eine Risikobewertung (RiskAssessment) erfasst oder zuletzt geändert hat, kann für dasselbe Objekt weder Quality Review noch Second-Line-Review abschließen.
- Wer eine Maßnahme umsetzt (Action Owner), führt nicht deren Effectiveness Review durch.
- Wer eine Kontrolle verantwortet (Control Owner), gibt die Second-Line-Beurteilung ihrer Wirksamkeit nicht selbst frei.

### 5.2 Vier-Augen-Prinzip

- Jeder freigaberelevante Statusübergang (Risk Owner Approval, Second-Line-Review, Managementfreigabe einer Akzeptanz, Third-Party-Approval) erfordert eine zweite, vom Ersteller verschiedene Person; die Freigabe wird als Approval-Datensatz mit Zeitstempel und Benutzer protokolliert.
- Risikoakzeptanzen oberhalb des Risikoappetits erfordern zusätzlich zur Second Line zwingend die Managementfreigabe (dokumentierte Ausnahmeentscheidung).

### 5.3 Least Privilege

- Rollen erhalten ausschließlich die für ihre Prozessverantwortung erforderlichen Permissions; Schreibrechte sind objektbezogen (Ownership) eingeschränkt.
- Management und Auditor besitzen keine Schreibrechte auf Fachobjekte; Management kann ausschließlich Freigabeaktionen (Approvals) ausführen.
- Der Administrator besitzt keine fachlichen Freigaberechte (kein Approval von Risiken, Akzeptanzen oder Third-Party-Objekten). Administrative Änderungen an Rollen und AppSetting werden vollständig auditiert.
- Der Auditor hat lesenden Zugriff auf den vollständigen Audit Trail; keine Rolle – auch nicht der Administrator – kann AuditLog-Einträge über die Anwendung ändern oder löschen (append-only).

### 5.4 Unvereinbarkeiten (verbotene Rollenkombinationen)

| Kombination                                             | Begründung                                           |
| ------------------------------------------------------- | ---------------------------------------------------- |
| Risk Owner + Reviewer/Second Line (für dasselbe Risiko) | Selbstprüfung ausgeschlossen                         |
| Action Owner + Reviewer der eigenen Maßnahme            | Ersteller ≠ Reviewer                                 |
| Administrator + Auditor                                 | Kontrolle der Administration muss unabhängig bleiben |
| Administrator + Management-Freigaberecht                | Trennung Technik / fachliche Entscheidung            |

Personelle Mehrfachrollen sind darüber hinaus organisatorisch zu vermeiden; unvermeidbare Ausnahmen sind zu dokumentieren und im Rahmen des jährlichen Berechtigungsreviews zu bestätigen.

## 6. Eskalation und Vertretung

- **Eskalationspfad:** Bei ausbleibenden Freigaben oder überfälligen Reviews eskaliert das Cockpit per Notification stufenweise: zuständige Rolle → ICT Risk Manager bzw. Third Party Risk Manager → Management. Eskalationsfristen sind über AppSetting konfigurierbar.
- **Vertretungsregelung:** Für Risk Owner, Control Owner und Action Owner sind organisatorisch Stellvertreter zu benennen; die Übertragung von Ownership erfolgt durch den Administrator und wird auditiert. Freigabekompetenzen (Management, Second Line) sind nicht delegierbar an Rollen außerhalb der Matrix in Abschnitt 3.
- **Abwesenheit von Genehmigern:** Länger offene Approvals werden im Overview-Dashboard und im Management-Reporting als überfällig ausgewiesen.

## 7. Nachweis und Überprüfung

- Alle Statusübergänge, Freigaben und Berechtigungsänderungen werden im AuditLog mit Benutzer, Zeitstempel, Objekt und Alt-/Neuwert protokolliert.
- Die Einhaltung der Funktionstrennung ist Bestandteil des jährlichen Berechtigungsreviews (Verantwortung: Administrator R, ISO C, Reviewer/Second Line A, Auditor I).
- Abweichungen von dieser Matrix (temporäre Rechtevergaben, Ausnahmegenehmigungen) sind vorab zu genehmigen, zu befristen und als Kommentar am betroffenen Objekt sowie im Berechtigungsreview zu dokumentieren.

## 8. Pflege dieses Dokuments

Änderungen an Rollen, Prozessen oder SoD-Regeln erfordern eine Aktualisierung dieser Matrix vor der technischen Umsetzung im RBAC. Verantwortlich: ICT Risk Manager (R), Reviewer/Second Line (C), Management (A für die Freigabe), Auditor (I).

---

_Die Anwendung unterstützt die Dokumentation und Steuerung regulatorischer Anforderungen. Sie ersetzt keine rechtliche, aufsichtsrechtliche oder unabhängige Compliance-Prüfung._
