# Projektplan – ICT & Third Party Risk Management Cockpit

Stand: 2026-08-13 · Verantwortlich: ICT Risk Management (Projekt) · Status: Prototyp v0.1

## 1. Executive Summary

Das Cockpit ist ein webbasiertes Management-, Arbeits- und Nachverfolgungswerkzeug für
Informationssicherheits-, ICT- und Drittparteirisiken im regulierten Finanzumfeld
(DORA-Kontext). Es verbindet vier Ebenen: Executive Dashboard, operatives Risk- und
Third-Party-Register, interaktiv ausführbare Runbooks (20) und szenariobezogene
Playbooks (16). Kernfunktionen: 5×5-Bewertungsmethodik mit konfigurierbaren
Schwellwerten und transparent berechnetem Residual Risk, Quality-Review-Prozess mit
Vier-Augen-Prinzip, Workflow-gestützte Freigaben, befristete Risikoakzeptanzen,
Kontrollbibliothek mit Wirksamkeitstests, Drittparteien-Register inkl. Verträgen,
Subdienstleistern, Konzentrations- und Exit-Analysen, Evidence-Linkregister,
Compliance-Mapping (9-stufig, ohne automatisches Compliance-Urteil), Management-
Reports mit Exporten sowie ein unveränderlicher Audit Trail. Die Anwendung ersetzt
kein freigegebenes GRC-System; sie dient als Prototyp, fachliches Zielbild und
Steuerungscockpit. Alle Daten sind synthetisch.

## 2. Annahmen und Abgrenzungen

| # | Annahme / Abgrenzung |
|---|---|
| A1 | Demo-Login nur in Entwicklungsumgebungen; Produktion über OIDC/Entra ID (ADR-0003). |
| A2 | Keine Dokumentenablage – Evidence ist ein Metadaten-/Linkregister (sicheres DMS vorausgesetzt). |
| A3 | SQLite lokal, PostgreSQL produktiv; Schema providerneutral (ADR-0002). |
| A4 | Fiktiver Mandant „Nordlicht Bank AG“; keinerlei reale Unternehmensdaten. |
| A5 | Berichtsexporte: CSV nativ, PDF über druckoptimierte HTML-Ansicht (Browser-Print); XLSX-Generierung als Ausbaustufe. |
| A6 | E-Mail-/Push-Benachrichtigungen sind modelliert (Notification), Versand ist Ausbaustufe. |
| A7 | Mehrsprachigkeit: deutsche UI, englische Fachbegriffe wo branchenüblich; vollständige i18n vorbereitet, nicht aktiviert. |
| A8 | Die statische Rollen→Rechte-Matrix (lib/authz-map.ts) ist Single Source of Truth; DB-Tabellen Role/Permission dokumentieren sie. |

## 3. Architektur (Kurzfassung)

Browser → Next.js 15 App Router (Server Components + Server Actions, Security-Header,
CSP) → Prisma → SQLite/PostgreSQL. Auth über signierte HttpOnly-Cookies mit
RBAC-Durchsetzung in jeder Seite und Action; Audit-Interceptor schreibt append-only
in AuditLog. Details: docs/architecture/architecture.md, Threat Model:
docs/security/threat-model.md.

## 4. Datenmodell

Siehe docs/architecture/data-model.md und prisma/schema.prisma (36 Entitäten).

## 5. Rollen- und Berechtigungskonzept

10 Rollen (Administrator … Auditor) mit feingranularen Berechtigungen; Least
Privilege, Funktionstrennung (Ersteller ≠ Reviewer, Antragsteller ≠ Genehmiger)
systemseitig erzwungen. RACI: docs/governance/raci.md.

## 6. Seiten- und Navigationsstruktur

Overview · Risks · Actions · Controls · Third Parties · Assessments · Runbooks ·
Playbooks · Evidence · Reports · Governance · Audit Trail (rollenabhängig) ·
Administration (nur Admin). Detailseiten mit Tabs, Breadcrumbs, Filterleisten und
klickbaren Dashboard-Kacheln.

## 7. Priorisiertes Product Backlog (Auszug)

| Prio | Epic | Status v0.1 |
|---|---|---|
| P0 | Risk Register + Bewertung + Workflow | umgesetzt |
| P0 | RBAC, Audit Trail, Security-Header | umgesetzt |
| P0 | Maßnahmen inkl. Eskalation | umgesetzt |
| P0 | Dashboard (KPIs, Heatmap, Trend) | umgesetzt |
| P1 | Quality Review, Akzeptanzen | umgesetzt |
| P1 | Kontrollbibliothek + Tests | umgesetzt |
| P1 | Third-Party-Register inkl. Exit/Konzentration | umgesetzt |
| P1 | Runbooks/Playbooks interaktiv | umgesetzt |
| P1 | Reports + CSV-Export + Druckansicht | umgesetzt |
| P2 | Compliance-Mapping-Pflege | umgesetzt |
| P2 | XLSX-Export, gespeicherte Filter-UI, globale Suche | offen |
| P2 | Benachrichtigungsversand (E-Mail) | offen |
| P3 | OIDC/Entra-ID-Aktivierung, i18n-Umschalter, React Hook Form für komplexe Formulare | offen |
| P3 | Approval-Gremien-Workflows (mehrstufig), Report-Abos | offen |

## 8. Milestone-Plan bis 31.12.2026

| Meilenstein | Termin | Inhalt |
|---|---|---|
| M0 Prototyp (dieser Stand) | 08/2026 | Lauffähiges Cockpit mit allen Kernmodulen, Demo-Daten, CI |
| M1 Projektstart & Onboarding | 31.08.2026 | Einrichtung Zielumgebung, Postgres, SSO-Anbindung testen |
| M2 Methodik-Abnahme | 30.09.2026 | Risikomethodik, Appetit-Schwellen, Rollen mit Fachbereich abgestimmt |
| M3 Pilotbetrieb | 31.10.2026 | Reale (interne) Pilotdaten, RB-01…RB-08 im Regelbetrieb, Monatsreport |
| M4 TPRM-Vollausbau | 30.11.2026 | Drittparteien-Migration, Konzentrations-/Exit-Reviews, DORA-Register |
| M5 Übergabe & Verankerung | 31.12.2026 | RB-20, Schulungen, Betriebshandbuch, Abschlussbericht; Option Verlängerung |

## 9. Risiken der Umsetzung

| Risiko | Gegenmaßnahme |
|---|---|
| Scope-Breite vs. Projektlaufzeit | strikte P0/P1-Priorisierung, Backlog-Pflege |
| Abweichende Bestandsdaten beim Import | Datenqualitäts-Runbook RB-14, Mapping-Workshops |
| SSO-/Infrastrukturabhängigkeiten | Auth-Abstraktion (ADR-0003), frühe Testanbindung in M1 |
| Doppelpflege zu bestehendem GRC-Tool | klare Systemgrenze, Export-/Integrations-Schnittstelle als P2 |
| Akzeptanz der Fachbereiche | Runbook-gestützte Prozesse, Schulungen, einfache UI |

## 10. Definition of Done

Ein Inkrement gilt als fertig, wenn: (1) Typecheck, Lint und Unit-Tests grün;
(2) Berechtigungen serverseitig geprüft; (3) jede Mutation auditiert;
(4) UI deutsch, barrierearm (Labels, Fokus, Farbe nie allein), hell/dunkel;
(5) Doku (README/CHANGELOG, ggf. ADR) aktualisiert; (6) keine Secrets im Repo;
(7) Seed reproduzierbar (`npm run db:reset`); (8) CI-Workflow erfolgreich.
