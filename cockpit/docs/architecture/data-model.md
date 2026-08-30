# Datenmodell – ICT & TPRM Cockpit

Maßgeblich ist `prisma/schema.prisma`. Dieses Dokument beschreibt Entitäten,
Beziehungen, Datenklassifikation und Aufbewahrung.

## Entitätsübersicht

### Identität & Berechtigungen

| Entität    | Zweck                                       | Wichtige Beziehungen               |
| ---------- | ------------------------------------------- | ---------------------------------- |
| User       | Benutzerkonto (Demo-Login; SSO vorbereitet) | n:m Role über UserRole             |
| Role       | 10 fachliche Rollen                         | n:m Permission über RolePermission |
| Permission | Feingranulare Fähigkeiten (`risk:write` …)  | –                                  |

### Organisation & Stammdaten

| Entität            | Zweck                                                           | Wichtige Beziehungen             |
| ------------------ | --------------------------------------------------------------- | -------------------------------- |
| OrganizationalUnit | Gesellschaften und Geschäftsbereiche (Hierarchie über parentId) | 1:n Risk, BusinessProcess        |
| Location           | Standorte                                                       | 1:n Risk, Asset                  |
| BusinessProcess    | Geschäftsprozesse mit Kritikalität                              | n:m Risk, Control                |
| CriticalFunction   | Kritische/wichtige Funktionen (DORA)                            | n:m Risk, IctService, ThirdParty |
| Asset              | Informationswerte mit Klassifikation                            | n:m Risk, Control                |
| IctService         | ICT-Services, optional von Drittpartei erbracht                 | n:m CriticalFunction, Risk       |

### Risiko

| Entität                              | Zweck                                                                               | Wichtige Beziehungen                                                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RiskCategory                         | Kategorien inkl. Risikoappetit-Schwelle (`appetiteThreshold`)                       | 1:n Risk                                                                                                                                                                      |
| Risk                                 | Zentrales Register (Ursache/Ereignis/Auswirkung getrennt, Workflow-Status, Version) | n:m Asset/Process/IctService/CriticalFunction/ThirdParty/RegulatoryRequirement; n:m Control über RiskControl; 1:n Assessment/Action/Acceptance/QualityReview/Evidence/Comment |
| RiskAssessment                       | Versionierte Bewertung (L, I, Wirksamkeit, Scores, Begründung, `isCurrent`)         | 1:n ImpactDimensionScore                                                                                                                                                      |
| ImpactDimensionScore                 | Auswirkung je Dimension (C/I/A, finanziell, …)                                      | –                                                                                                                                                                             |
| RiskAcceptance                       | Befristete Akzeptanzen mit Genehmiger und Wiedervorlage                             | –                                                                                                                                                                             |
| QualityReview / QualityChecklistItem | Vier-Augen-Review mit 13 Kriterien und Qualitätsscore                               | –                                                                                                                                                                             |

### Kontrollen & Maßnahmen

| Entität           | Zweck                                                                             |
| ----------------- | --------------------------------------------------------------------------------- |
| Control           | Kontrollbibliothek (Typ, Automatisierung, Frequenz, Design-/Operativ-Wirksamkeit) |
| ControlAssessment | Kontrolltests (Ergebnis, Findings, Tester)                                        |
| RiskControl       | Join Risk↔Control                                                                 |
| Action            | Maßnahmen (Priorität, Fortschritt, Eskalationsstufe, Validierung)                 |

### Third Party

| Entität           | Zweck                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| ThirdParty        | Drittparteien-Register (Kritikalität, Scores, DD-Status, Konzentration, Substituierbarkeit, Workflow) |
| ThirdPartyService | Erbrachte Leistungen, optional auf IctService gemappt                                                 |
| Subcontractor     | Subdienstleister-Kette                                                                                |
| Contract          | Verträge (Laufzeit, Kündigungsfrist, Audit-/Zugangs-/Meldepflichten)                                  |
| ExitStrategy      | Exit-Strategie inkl. Testdatum/-ergebnis (1:1)                                                        |

### Regulatorik & Nachweise

| Entität               | Zweck                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| RegulatoryRequirement | Anforderungskatalog (DORA, EBA, ISO, NIST, NIS2, intern)                                                                  |
| ComplianceMapping     | Bewertung je Anforderung (9-stufig, mit Begründung, Owner, Reviewer, Nachweis) – **kein automatisches Compliance-Urteil** |
| Evidence              | Metadaten-/Linkregister (keine Dokumentenablage), optionaler Hash                                                         |

### DORA-Anforderungskatalog (FRWK-DORA-001)

| Entität                   | Zweck                                                                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DoraChapter               | Die 5 DORA-Kapitel als Gliederungs- und Gewichtungsträger (30/25/15/25/5 %)                                                                                                                                                           |
| DoraRequirement           | 133 prüfbare Einzelanforderungen mit Artikel, Nachweisspezifikation, MUSS/SOLL/KANN (Gewicht 3/2/1), Knockout-Kennzeichen, Verantwortungsrolle, Crosswalk (ISO 27001, ISO 22301, NIS-2/BSIG, RTS/ITS) und Runbook-/Playbook-Verweisen |
| DoraAssessment            | Historisierte Reifegrad-Bewertung (0–5) je Anforderung; wirksamer Wert wird zur Laufzeit über die Nachweissperre berechnet (lib/domain/dora-scoring.ts)                                                                               |
| DoraFinding               | Feststellungen aus 5 Quellen mit Schweregrad-Fristen (Tab. 24), Eskalation und CAPA-Verknüpfung auf Action; Schließung nur mit Wirksamkeitskriterium                                                                                  |
| Incident / IncidentReport | IKT-Vorfälle mit Kenntnis-/Klassifizierungszeitpunkt und Meldekette (DORA 4 h/24 h → 72 h → 1 Monat, NIS-2, DSGVO) – Fristen deterministisch in lib/domain/incident-deadlines.ts                                                      |

Evidence ist zusätzlich optional einer DoraRequirement zugeordnet (Grundlage der
Nachweissperre: nur geprüfte, nicht abgelaufene Nachweise heben den wirksamen
Reifegrad über 2).

### Prozesse & Querschnitt

| Entität                                                      | Zweck                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Runbook / RunbookStep / RunbookExecution / RunbookStepResult | Interaktiv ausführbare Regelprozesse mit Schritt-Protokoll                |
| Playbook / PlaybookExecution                                 | Szenario-Leitfäden mit Aktivierungen und Verknüpfungen                    |
| Approval, Comment, Notification, Report                      | Freigaben, Kommentare, Benachrichtigungen, Report-Snapshots               |
| AuditLog                                                     | Append-only Audit Trail (auch nach Nutzerlöschung lesbar via `userEmail`) |
| AppSetting, SavedFilter                                      | Konfiguration (Schwellwerte, Mitigation Cap), gespeicherte Filter         |

### Meldeschicht – DORA-Informationsregister (ADR-0005)

Mapping der Cockpit-Objekte auf die 15 Meldebögen der DVO (EU) 2024/2956
(Anhang I). Die Zusammenstellung erfolgt in `lib/domain/roi-build.ts`
(reine Funktionen); das Feld-Mapping auf die Spalten einer konkreten
ITS-Fassung bleibt Datenpflege (`ItsFieldMapping`).

| Meldebogen | Inhalt                                    | Cockpit-Objekt(e)                                                      |
| ---------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| B_01.01    | Register führende Einheit                 | `ReportingEntity` (Maintainer)                                         |
| B_01.02    | Einheiten im Erfassungskreis              | `ReportingEntity` (alle, mit Hierarchie)                               |
| B_01.03    | Zweigniederlassungen                      | `EntityBranch`                                                         |
| B_02.01    | Vereinbarungen – allgemeine Angaben       | `Contract` (Ref, Art, Rahmenbezug, Kosten)                             |
| B_02.02    | Vereinbarungen – spezifische Angaben      | `ContractIctService` × `Contract` (Kernobjekt)                         |
| B_02.03    | Gruppeninterne Vereinbarungen             | `Contract` (`isIntragroup`)                                            |
| B_03.01    | Unterzeichnende Einheiten (Empfangsseite) | `Contract.signingEntity`                                               |
| B_03.02    | Unterzeichnende IKT-Drittdienstleister    | `Contract` × `ThirdParty`                                              |
| B_03.03    | Einheiten als gruppeninterne Erbringer    | `Contract` (`isIntragroup`) × `signingEntity`                          |
| B_04.01    | Nutzende Einheiten                        | `Contract.usingEntities` (n:m `ReportingEntity`)                       |
| B_05.01    | IKT-Drittdienstleister                    | `ThirdParty` (LEI/EUID, `providerType`, `ultimateParent`, `isCtpp`)    |
| B_05.02    | IKT-Lieferketten                          | Rang 1: `Contract` × `ContractIctService`; Folgeränge: `Subcontractor` |
| B_06.01    | Identifikation der Funktionen             | `CriticalFunction` (inkl. B_06-Felder)                                 |
| B_07.01    | Bewertung der IKT-Dienstleistungen        | `CifServiceAssessment` (1:1 `ContractIctService`)                      |
| B_99.01    | Entitätsspezifische Definitionen          | `AppSetting` `roi.definitions` (JSON)                                  |

Ergänzende Objekte: `RoiSnapshot` (unveränderlicher Meldestand: JSON-Abzug,
Prüfsumme, Taxonomieversion, Abgabevermerk; Vier-Augen über `Approval`),
Taxonomien versioniert in `lib/content/roi-taxonomies.ts`. Eindeutigkeit von
`Contract.contractRef` und `CriticalFunction.functionIdCode` wird serverseitig
erzwungen (ADR-0005 Nr. 8).

## Wesentliche Integritätsregeln

- Workflow-Übergänge sind serverseitig auf die Tabellen in `lib/domain/enums.ts` beschränkt.
- `RiskAssessment.isCurrent`: genau eine aktuelle Bewertung je Risiko (Transaktion beim Neubewerten).
- Funktionstrennung wird in den Server Actions erzwungen (Ersteller ≠ Reviewer, Antragsteller ≠ Genehmiger).
- AuditLog besitzt in der Anwendung keinerlei Update-/Delete-Pfade.

## Datenklassifikation

| Datenart                           | Klassifikation                   | Bemerkung                           |
| ---------------------------------- | -------------------------------- | ----------------------------------- |
| Risiko-/Kontroll-/Drittparteidaten | Vertraulich                      | nur synthetische Demo-Daten im Repo |
| Nachweis-Metadaten und Links       | Vertraulich                      | keine Dokumentinhalte               |
| Benutzerkonten                     | Vertraulich                      | Passwörter nur als bcrypt-Hash      |
| Audit Trail                        | Vertraulich, integritätskritisch | append-only                         |

## Aufbewahrung

- AuditLog: keine Löschung über die Anwendung; Aufbewahrung gemäß Betriebskonzept
  (docs/operations/README.md), empfohlen ≥ 10 Jahre für revisionsrelevante Ereignisse.
- Bewertungs- und Review-Historien bleiben vollständig erhalten (Versionierung statt Überschreiben).
- Demo-Daten sind über `npm run db:reset` vollständig neu erzeugbar.
