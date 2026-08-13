# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/de/1.1.0/) · Versionierung: SemVer

## [Unreleased]

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
