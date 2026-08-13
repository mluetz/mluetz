# Datenmodell – ICT & TPRM Cockpit

Maßgeblich ist `prisma/schema.prisma`. Dieses Dokument beschreibt Entitäten,
Beziehungen, Datenklassifikation und Aufbewahrung.

## Entitätsübersicht

### Identität & Berechtigungen
| Entität | Zweck | Wichtige Beziehungen |
|---|---|---|
| User | Benutzerkonto (Demo-Login; SSO vorbereitet) | n:m Role über UserRole |
| Role | 10 fachliche Rollen | n:m Permission über RolePermission |
| Permission | Feingranulare Fähigkeiten (`risk:write` …) | – |

### Organisation & Stammdaten
| Entität | Zweck | Wichtige Beziehungen |
|---|---|---|
| OrganizationalUnit | Gesellschaften und Geschäftsbereiche (Hierarchie über parentId) | 1:n Risk, BusinessProcess |
| Location | Standorte | 1:n Risk, Asset |
| BusinessProcess | Geschäftsprozesse mit Kritikalität | n:m Risk, Control |
| CriticalFunction | Kritische/wichtige Funktionen (DORA) | n:m Risk, IctService, ThirdParty |
| Asset | Informationswerte mit Klassifikation | n:m Risk, Control |
| IctService | ICT-Services, optional von Drittpartei erbracht | n:m CriticalFunction, Risk |

### Risiko
| Entität | Zweck | Wichtige Beziehungen |
|---|---|---|
| RiskCategory | Kategorien inkl. Risikoappetit-Schwelle (`appetiteThreshold`) | 1:n Risk |
| Risk | Zentrales Register (Ursache/Ereignis/Auswirkung getrennt, Workflow-Status, Version) | n:m Asset/Process/IctService/CriticalFunction/ThirdParty/RegulatoryRequirement; n:m Control über RiskControl; 1:n Assessment/Action/Acceptance/QualityReview/Evidence/Comment |
| RiskAssessment | Versionierte Bewertung (L, I, Wirksamkeit, Scores, Begründung, `isCurrent`) | 1:n ImpactDimensionScore |
| ImpactDimensionScore | Auswirkung je Dimension (C/I/A, finanziell, …) | – |
| RiskAcceptance | Befristete Akzeptanzen mit Genehmiger und Wiedervorlage | – |
| QualityReview / QualityChecklistItem | Vier-Augen-Review mit 13 Kriterien und Qualitätsscore | – |

### Kontrollen & Maßnahmen
| Entität | Zweck |
|---|---|
| Control | Kontrollbibliothek (Typ, Automatisierung, Frequenz, Design-/Operativ-Wirksamkeit) |
| ControlAssessment | Kontrolltests (Ergebnis, Findings, Tester) |
| RiskControl | Join Risk↔Control |
| Action | Maßnahmen (Priorität, Fortschritt, Eskalationsstufe, Validierung) |

### Third Party
| Entität | Zweck |
|---|---|
| ThirdParty | Drittparteien-Register (Kritikalität, Scores, DD-Status, Konzentration, Substituierbarkeit, Workflow) |
| ThirdPartyService | Erbrachte Leistungen, optional auf IctService gemappt |
| Subcontractor | Subdienstleister-Kette |
| Contract | Verträge (Laufzeit, Kündigungsfrist, Audit-/Zugangs-/Meldepflichten) |
| ExitStrategy | Exit-Strategie inkl. Testdatum/-ergebnis (1:1) |

### Regulatorik & Nachweise
| Entität | Zweck |
|---|---|
| RegulatoryRequirement | Anforderungskatalog (DORA, EBA, ISO, NIST, NIS2, intern) |
| ComplianceMapping | Bewertung je Anforderung (9-stufig, mit Begründung, Owner, Reviewer, Nachweis) – **kein automatisches Compliance-Urteil** |
| Evidence | Metadaten-/Linkregister (keine Dokumentenablage), optionaler Hash |

### Prozesse & Querschnitt
| Entität | Zweck |
|---|---|
| Runbook / RunbookStep / RunbookExecution / RunbookStepResult | Interaktiv ausführbare Regelprozesse mit Schritt-Protokoll |
| Playbook / PlaybookExecution | Szenario-Leitfäden mit Aktivierungen und Verknüpfungen |
| Approval, Comment, Notification, Report | Freigaben, Kommentare, Benachrichtigungen, Report-Snapshots |
| AuditLog | Append-only Audit Trail (auch nach Nutzerlöschung lesbar via `userEmail`) |
| AppSetting, SavedFilter | Konfiguration (Schwellwerte, Mitigation Cap), gespeicherte Filter |

## Wesentliche Integritätsregeln

- Workflow-Übergänge sind serverseitig auf die Tabellen in `lib/domain/enums.ts` beschränkt.
- `RiskAssessment.isCurrent`: genau eine aktuelle Bewertung je Risiko (Transaktion beim Neubewerten).
- Funktionstrennung wird in den Server Actions erzwungen (Ersteller ≠ Reviewer, Antragsteller ≠ Genehmiger).
- AuditLog besitzt in der Anwendung keinerlei Update-/Delete-Pfade.

## Datenklassifikation

| Datenart | Klassifikation | Bemerkung |
|---|---|---|
| Risiko-/Kontroll-/Drittparteidaten | Vertraulich | nur synthetische Demo-Daten im Repo |
| Nachweis-Metadaten und Links | Vertraulich | keine Dokumentinhalte |
| Benutzerkonten | Vertraulich | Passwörter nur als bcrypt-Hash |
| Audit Trail | Vertraulich, integritätskritisch | append-only |

## Aufbewahrung

- AuditLog: keine Löschung über die Anwendung; Aufbewahrung gemäß Betriebskonzept
  (docs/operations/README.md), empfohlen ≥ 10 Jahre für revisionsrelevante Ereignisse.
- Bewertungs- und Review-Historien bleiben vollständig erhalten (Versionierung statt Überschreiben).
- Demo-Daten sind über `npm run db:reset` vollständig neu erzeugbar.
