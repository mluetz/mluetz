# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/de/1.1.0/) · Versionierung: SemVer

## [Unreleased]

### Added

- **Meldeschicht Welle 1 — Registermodell (ADR-0005):** Datenmodell für das
  DORA-Informationsregister (DVO (EU) 2024/2956): `ReportingEntity` um
  B_01-Felder erweitert, neu `EntityBranch`, `ContractIctService`
  (Kernobjekt B_02.02), `CifServiceAssessment` (B_07.01) und `RoiSnapshot`
  (unveränderlicher Meldestand); Registerfelder an `Contract`
  (Vertragsart, anwendbares Recht, Kosten, Rahmenbezug, beidseitige
  Kündigungsfristen, Entitätsbezug für B_03/B_04, MaRisk-Kennzeichen
  `isIctService`), `ThirdParty` (Lieferkettenrolle, oberste
  Muttergesellschaft, CTPP) und `Subcontractor` (Vertragsbezug,
  IKT-Dienstleistungsart); versionierte Taxonomien
  (`lib/content/roi-taxonomies.ts`, TO_VERIFY-Kennzeichnung) und
  Registeraufbau als reine Funktionen (`lib/domain/roi-build.ts`, alle
  15 Meldebögen aus dem Seed befüllbar, Vitest-Abdeckung);
  Schema-Update 0008 für Bestandsinstallationen

- **Zweisprachigkeit Deutsch/Englisch:** Cookie-basierter Sprachumschalter im
  Kopfbereich und auf der Anmeldeseite (Standard Deutsch); Oberfläche der
  Module, Executive Dashboard, Reports-Chrome sowie die komplette DORA-
  Wissensbasis (5 Säulen, Glossar, Handbuch Kap. 1–8/10–15) auf Englisch
- Die 16 Abbildungen des Rahmenwerks für die englische Ausgabe als
  originalgetreue SVG-Rekonstruktionen mit englischen Beschriftungen
  (public/dora/en/fig-01…16.svg)
- **DORA-Handbuch in der Wissensbasis:** Kapitel 1–8 und 10–15 der
  Gesamtbetrachtung FRWK-DORA-001 als navigierbare Kapitelseiten in fünf
  thematischen Teilen, inkl. der 16 Original-Abbildungen (Klick-Großansicht),
  zentraler Tabellen (DORA↔NIS-2, RTS/ITS, Meldefristen, Reifegradskala,
  KPI/KRI-Katalog, RACI) und Cockpit-Deep-Links; Kapitel 9 verlinkt auf den
  interaktiven Anforderungskatalog

## [0.2.0] – 2026-08-17

### Added

- **DORA-Compliance-Modul** auf Basis des Rahmenwerks FRWK-DORA-001:
  Anforderungskatalog mit 133 prüfbaren Anforderungen (Kap. II–VI, 122 MUSS,
  98 Knockouts) inkl. Crosswalk zu ISO/IEC 27001:2022, ISO 22301, NIS-2/BSIG
  und den delegierten Rechtsakten; Reifegrad-Bewertung (0–5, historisiert)
- Score-Engine nach Kap. 11: Gewichte MUSS 3/SOLL 2/KANN 1, Kapitel-Scores,
  DORA Resilience Index (Kapitelgewichte 30/25/15/25/5 %), Knockout-Übersteuerung,
  Nachweissperre (ohne gültigen Nachweis max. Reifegrad 2), Ampellogik 85/60 –
  vollständig unit-getestet
- Findings-Register mit fünf Quellen, Schweregrad-Fristen (Tabelle 24),
  Eskalationsstufen und CAPA-Verknüpfung in das bestehende Maßnahmen-Modul;
  Schließung nur mit Wirksamkeitskriterium
- Vorfallsmodul mit Meldefristen-Monitor: Kenntniserlangung/Klassifizierung,
  DORA-Meldekette 4 h/24 h → 72 h → 1 Monat, parallele Stränge NIS-2 und
  DSGVO Art. 33 (deterministische, getestete Fristenberechnung)
- DORA-Dashboard nach der Zielansicht (Abb. 14): Index- und Knockout-Kachel
  gleichrangig, Kapitelampel, Reifegradverlauf, KPI-/KRI-Katalog (Tabelle 25),
  Heatmap Kapitel × kritische Funktionen
- Verwebung: Wissensbasis-Säulen zeigen Live-Scores und verlinken in den
  Katalog; Anforderungen verlinken auf Runbooks/Playbooks; neue Runbooks
  RB-21 (Vorfall klassifizieren und melden), RB-22 (Informationsregister
  einreichen), RB-23 (Threat-Intel-Abgleich) und Playbook PB-17 (Offener
  Knockout); 12. Bewertungsdimension „Verbindlichkeit (Non-Repudiation)“
- DORA-Readiness-Report um Resilience Index und Kapitelübersicht erweitert
- Update-Pfad für bestehende Installationen: Container-Entrypoint führt
  additive Schema-Updates und den idempotenten DORA-Seed automatisch aus

## [0.1.0] – 2026-08-13

### Added

- Grundgerüst: Next.js 15 (App Router, TypeScript strict), Tailwind, Prisma
  (SQLite dev / PostgreSQL-ready), HMAC-Session-Auth mit Demo-Login, serverseitiges
  RBAC mit 10 Rollen und Funktionstrennung
- Risk Register mit 5×5-Bewertung (11 Auswirkungsdimensionen), automatischer
  Inherent-/Residual-Berechnung (konfigurierbare Schwellwerte und Mitigation Cap),
  Workflow mit validierten Statusübergängen und Pflichtbegründungen
- Quality Review (13 Prüfkriterien, Qualitätsscore, Vier-Augen-Prinzip),
  befristete Risikoakzeptanzen mit Managementfreigabe
- Maßnahmenmanagement inkl. Fortschritt, Validierung und 3-stufiger Eskalation
- Control Library mit Design-/Operating-Effectiveness und Kontrolltests
- Third-Party-Register: Kritikalität, Due Diligence, Verträge, Subdienstleister,
  Konzentrationsrisiken, Exit-Strategien inkl. Testel status, Workflow
- 20 interaktive Runbooks und 16 Playbooks mit protokollierter Ausführung
- Evidence-Register (Metadaten/Links), Compliance-Mapping (9-stufig, mit
  Pflicht-Disclaimer), Executive Dashboard (klickbare KPIs, 5×5-Heatmap,
  Residual-Trend), Management-Reports mit CSV-Export und Druckansicht
- Append-only Audit Trail inkl. Login-, Status-, Freigabe- und Export-Ereignissen
- Synthetische Demo-Daten (25 Risiken, 32 Maßnahmen, 20 Kontrollen,
  12 Drittparteien, 19 regulatorische Anforderungen u. v. m.)
- CI (Build/Lint/Test/E2E) und Security-Workflows (npm audit, gitleaks, CodeQL,
  Trivy, SBOM), Dockerfile + docker-compose, umfassende Dokumentation
  (Architektur, Datenmodell, Threat Model, RACI, Methodik, Runbooks, Playbooks,
  User Guide, Betrieb, ADRs)
