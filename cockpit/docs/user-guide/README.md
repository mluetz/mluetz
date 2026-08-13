# Benutzerhandbuch

**Dokument:** User Guide nach Rollen
**Anwendung:** ICT & Third Party Risk Management Cockpit
**Status:** Freigegeben | **Version:** 1.0 | **Stand:** 2026-08

---

## 1. Einstieg

### 1.1 Anmeldung
Die Anmeldung erfolgt über die Login-Seite mit E-Mail-Adresse und Passwort. Die Sitzung wird über ein signiertes Session-Cookie gehalten; nach Ablauf ist eine erneute Anmeldung erforderlich.

**Demo-Zugangsdaten:** In der Entwicklungs-/Demoumgebung legt der Seed je Rolle einen Demo-Benutzer an (Schema: ein Benutzer pro Rolle, z. B. `admin@demo.local`, `ict-risk@demo.local`, `auditor@demo.local` usw.). Die zugehörigen Passwörter stehen in der README des Projekts. Diese Konten sind ausschließlich für Demonstration und Test bestimmt und dürfen in produktiven Umgebungen nicht existieren.

### 1.2 Navigation
Die Hauptnavigation umfasst folgende Bereiche (Sichtbarkeit abhängig von der Rolle):

| Bereich | Inhalt |
|---|---|
| **Overview** | Dashboard: Risikoverteilung (5×5-Matrix), Appetit-Überschreitungen, fällige Reviews, offene Maßnahmen |
| **Risks** | Risikoinventar, Erfassung, Bewertung, Workflow-Status, Akzeptanzen |
| **Actions** | Maßnahmen mit Status, Owner, Terminen, Effectiveness Review |
| **Controls** | Kontrollkatalog, Control Assessments, Wirksamkeit |
| **Third Parties** | Drittparteien, Services, Subunternehmer, Verträge, Exit-Strategien |
| **Assessments** | Bewertungsübersicht (Risk- und Control-Assessments), fällige Re-Assessments |
| **Runbooks** | Betriebs-/Notfall-Runbooks, Schritte, Ausführungen (Executions) mit Schrittergebnissen |
| **Playbooks** | Incident-/Reaktions-Playbooks und deren Ausführungen |
| **Evidence** | Nachweis-Metadaten mit Verknüpfung zu Kontrollen, Maßnahmen, Assessments |
| **Reports** | Berichte, Exporte (CSV/XLSX), Management-Reporting |
| **Governance** | Regulatorische Anforderungen, Compliance-Mappings, Risikoappetit, Methodik-Einstellungen |
| **Administration** | Benutzer, Rollen/Permissions, Organisationseinheiten, Standorte, AppSettings, Audit Trail |

### 1.3 Grundprinzipien für alle Rollen
- Jede Änderung wird im Audit-Log protokolliert; Freigaben erfolgen im Vier-Augen-Prinzip (Ersteller ≠ Reviewer, siehe `docs/governance/raci.md`).
- Compliance-Status im Bereich Governance sind dokumentarisch (Not Assessed bis Remediation Required); die Anwendung fällt kein automatisches „compliant"-Urteil.

## 2. Rollenbezogene Arbeitsabläufe

### 2.1 Administrator
**Aufgaben:** Benutzer- und Rechteverwaltung, Stammdaten (OrganizationalUnit, Location), Konfiguration (AppSetting: Klassifikationsgrenzen, Mitigationsfaktor, Fristen), technische Überwachung.
**Typischer Ablauf:** Administration → Benutzer anlegen und Rolle zuweisen → Organisationseinheiten pflegen → AppSettings prüfen/ändern (Änderungen werden auditiert). Der Administrator hat keine fachlichen Freigaberechte.

### 2.2 ICT Risk Manager
**Aufgaben:** Methodenhoheit, Koordination des Risikoprozesses, Quality Review, Reporting.
**Typischer Ablauf:** Overview → fällige Quality Reviews öffnen → Risks: Bewertung auf methodische Konsistenz prüfen (Skalen, Auswirkungsdimensionen) → freigeben oder mit Kommentar zurückweisen → Reports: periodisches Risiko-Reporting erstellen → Governance: Appetit-Überschreitungen nachhalten.

### 2.3 Third Party Risk Manager
**Aufgaben:** Steuerung des Drittpartei-Lebenszyklus (Screening → Kritikalität → Due Diligence → Risk Assessment → Vertragsprüfung → Approval → Monitoring → Renewal/Exit).
**Typischer Ablauf:** Third Parties → neue Drittpartei erfassen (Screening) → Kritikalität einstufen (Bezug zu CriticalFunction) → Due-Diligence-Ergebnisse und Evidence verknüpfen → Risk Assessment anstoßen → Contract und ExitStrategy prüfen/pflegen → Approval einholen → Monitoring-Termine und Renewals überwachen.

### 2.4 Information Security Officer
**Aufgaben:** Fachliche Sicherheitsbewertung, Kontrollanforderungen, Beratung in Reviews.
**Typischer Ablauf:** Risks/Controls → sicherheitsrelevante Risiken und Kontrollen fachlich kommentieren → Governance: RegulatoryRequirements und ComplianceMappings mitpflegen → Assessments: Schutzziel-Dimensionen (Vertraulichkeit, Integrität, Verfügbarkeit, Authentizität) qualitätssichern.

### 2.5 Risk Owner
**Aufgaben:** Fachliche Verantwortung für zugewiesene Risiken; Self Assessment und Owner-Freigabe.
**Typischer Ablauf:** Overview → „Meine Risiken" → Risiko im Status Draft/Self Assessment bewerten (Likelihood, Impact je Dimension, Begründung) → nach Quality Review: Risk Owner Approval erteilen → Behandlungsstrategie festlegen, Maßnahmen mit Action Ownern anlegen → bei Bedarf Akzeptanzantrag stellen (befristet, mit Begründung) → Wiedervorlagen bearbeiten.

### 2.6 Control Owner
**Aufgaben:** Design und Betrieb zugeordneter Kontrollen, Durchführung von Control Assessments.
**Typischer Ablauf:** Controls → „Meine Kontrollen" → fälliges ControlAssessment durchführen (Design-/Wirksamkeitsbeurteilung, Effectiveness-Stufe) → Evidence-Metadaten verknüpfen → Ergebnis speichern; die Effectiveness fließt automatisch in die Residual-Berechnung verknüpfter Risiken ein.

### 2.7 Action Owner
**Aufgaben:** Umsetzung zugewiesener Maßnahmen im Workflow Planned → Approved → In Progress → Completed.
**Typischer Ablauf:** Actions → „Meine Maßnahmen" → Status und Fortschritt aktualisieren, Termine im Blick behalten → Umsetzungsnachweise als Evidence verknüpfen → auf Completed setzen; das Effectiveness Review führt anschließend der Reviewer/Second Line durch.

### 2.8 Reviewer/Second Line
**Aufgaben:** Unabhängige Zweitprüfung: Second-Line-Review von Risiken, Effectiveness Reviews von Maßnahmen, Qualitätssicherung von Kontrolltests, Closure Reviews.
**Typischer Ablauf:** Overview → Review-Queue → Objekt prüfen (Vollständigkeit, Plausibilität, Methodik) → freigeben oder mit dokumentierter Begründung zurückweisen. Eigene Erstellungen können nicht selbst reviewt werden (systemseitig unterbunden).

### 2.9 Management
**Aufgaben:** Read-only-Sicht auf Berichte und Risikolage; Freigaben, insbesondere von Risikoakzeptanzen und kritischen Third-Party-Approvals.
**Typischer Ablauf:** Overview/Reports → Risikolage und Appetit-Überschreitungen einsehen → offene Freigaben (Approvals) prüfen → Akzeptanzanträge genehmigen oder ablehnen (mit Begründung); jede Entscheidung wird als Approval-Datensatz protokolliert.

### 2.10 Auditor
**Aufgaben:** Lesender Zugriff auf alle Fachdaten und den vollständigen Audit Trail; keine Schreibrechte.
**Typischer Ablauf:** Administration → Audit Trail → nach Objekt, Benutzer, Zeitraum filtern → Nachvollzug von Statusübergängen, Freigaben und Konfigurationsänderungen → Reports: Exporte für Prüfungszwecke ziehen.

## 3. Häufige Aufgaben (Kurzreferenz)

| Aufgabe | Pfad |
|---|---|
| Neues Risiko erfassen | Risks → „Neues Risiko" → Pflichtfelder inkl. Risk Owner und Kategorie |
| Risikoakzeptanz beantragen | Risks → Risiko öffnen → „Akzeptanz beantragen" |
| Maßnahme anlegen | Risks → Risiko → „Maßnahme hinzufügen" oder Actions → „Neu" |
| Kontrolltest dokumentieren | Controls → Kontrolle → „Assessment durchführen" |
| Drittpartei onboarden | Third Parties → „Neu" (startet im Status Screening) |
| Runbook ausführen | Runbooks → Runbook → „Execution starten" → Schrittergebnisse erfassen |
| Bericht exportieren | Reports → Bericht wählen → Export (CSV/XLSX) |

## 4. Hinweise zu Statusanzeigen

- **Risiko-Workflow:** Draft → Self Assessment → Quality Review → Risk Owner Approval → Second-Line-Review → Open/Treatment → Monitoring → Closure Review → Closed. Der aktuelle Status wird in der Risikoansicht mit dem jeweils nächsten erforderlichen Schritt und der zuständigen Rolle angezeigt.
- **Maßnahmen-Workflow:** Planned → Approved → In Progress → Completed → Effectiveness Review → Closed.
- **Compliance-Status (Governance):** Not Assessed, Not Applicable, Planned, Partially Implemented, Implemented, Effectiveness Not Tested, Effective, Ineffective, Remediation Required. Diese Status sind dokumentarische Einschätzungen der verantwortlichen Rollen.
- **Farbcodierung:** Risikoklassifikationen werden gemäß den konfigurierten Grenzen (Low/Medium/High/Critical) dargestellt; Appetit-Überschreitungen sind zusätzlich markiert.

## 5. Support

Fragen zur Anwendung an den Administrator; methodische Fragen an den ICT Risk Manager bzw. Third Party Risk Manager. Betriebsthemen: siehe `docs/operations/README.md`.

---
*Die Anwendung unterstützt die Dokumentation und Steuerung regulatorischer Anforderungen. Sie ersetzt keine rechtliche, aufsichtsrechtliche oder unabhängige Compliance-Prüfung.*
