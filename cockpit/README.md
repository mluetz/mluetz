# ICT & Third Party Risk Management Cockpit

Webbasiertes Management-, Arbeits- und Nachverfolgungswerkzeug für
Informationssicherheits-, ICT- und Drittparteirisiken im regulierten
Finanzdienstleistungsumfeld (DORA-Kontext).

> **Wichtig:** Prototyp mit **ausschließlich synthetischen Demo-Daten**
> (fiktiver Mandant „Nordlicht Bank AG“). Die Anwendung ersetzt kein offiziell
> freigegebenes GRC-System und keine rechtliche, aufsichtsrechtliche oder
> unabhängige Compliance-Prüfung.

## Funktionsumfang

- **Executive Dashboard:** klickbare KPIs (offene/kritische Risiken, Appetit-
  Überschreitungen, überfällige Reviews/Maßnahmen, Akzeptanzen, Kontrollschwächen,
  kritische Drittparteien u. a.), 5×5-Heatmap, Residual-Trend, Verteilungen,
  Top-10-Risiken, Entscheidungspunkte
- **Risk Register:** vollständige Erfassung (Ursache/Ereignis/Auswirkung getrennt),
  5×5-Bewertung mit 11 Auswirkungsdimensionen, automatische Inherent-/Residual-
  Berechnung (konfigurierbare Schwellwerte + Mitigation Cap), Workflow
  Draft → … → Closed mit validierten Übergängen und Pflichtbegründung
- **Quality Review:** 13 Prüfkriterien, Qualitätsscore, Vier-Augen-Prinzip
  (Ersteller ≠ Reviewer), Rückgabe mit dokumentierter Begründung
- **Risikoakzeptanzen:** befristet, mit kompensierenden Kontrollen und
  Managementfreigabe (Antragsteller ≠ Genehmiger)
- **Maßnahmen:** Prioritäten, Fortschritt, Validierung, 3-stufige Eskalation
- **Control Library:** Kontrolltypen, Automatisierungsgrad, Frequenz,
  Design-/Operating-Effectiveness, Kontrolltests mit Findings
- **Third Party Risk:** Register mit Kritikalität, Due Diligence, Verträgen,
  Kündigungsfristen, Subdienstleistern, Datenstandorten, Konzentrationsrisiken,
  Exit-Strategien inkl. Teststatus; Sonderansichten (kritische Drittparteien,
  auslaufende Verträge, fehlende Exits …)
- **Runbooks (20) & Playbooks (16):** interaktiv ausführbar mit Schritt-Protokoll
  (Bearbeiter, Zeitstempel, Kommentare) bzw. Szenario-Aktivierungen mit Verknüpfung
  zu Risiken/Kontrollen/Drittparteien
- **Evidence:** Metadaten- und Linkregister (keine Dokumentenablage), Gültigkeits-
  und Review-Status
- **Governance:** Compliance-Mapping über DORA, EBA GL, ISO 27001/27005, NIST CSF,
  NIS2 und interne Policies – 9-stufige Bewertung mit Begründung, Owner, Nachweis,
  Reviewer; sichtbarer Disclaimer, kein automatisches Compliance-Urteil
- **DORA Compliance (FRWK-DORA-001):** vollständiger Anforderungskatalog mit
  **133 prüfbaren Einzelanforderungen** (Kap. II–VI, 98 Knockouts) inkl. Crosswalk
  zu ISO/IEC 27001, ISO 22301, NIS-2/BSIG und RTS/ITS; Reifegrad-Bewertung (0–5)
  mit **Score-Engine** (Kapitel-Scores, DORA Resilience Index, Knockout-Übersteuerung,
  Nachweissperre, Ampellogik 85/60); Findings mit CAPA-Verknüpfung ins
  Maßnahmen-Modul (Schweregrade, Fristen, Eskalation, Wirksamkeitskriterium);
  **Vorfallsmodul mit Meldefristen-Monitor** (Erstmeldung 4 h/24 h, Zwischenmeldung
  72 h, Abschluss 1 Monat – parallele Prüfung NIS-2 und DSGVO Art. 33);
  KPI-/KRI-Kacheln und Heatmap Kapitel × kritische Funktionen
- **Marktvergleich:** redaktionelle Analyse „ODDO BHF im Privatbanken-Vergleich"
  (13 europäische Häuser; öffentliche Quellen, Stand 09/2026) als eigener
  Menüpunkt – klar gekennzeichnete öffentliche Marktinformation, ausdrücklich
  KEIN Teil der synthetischen Demo-Daten der fiktiven Nordlicht Bank AG
- **Zweisprachigkeit (DE/EN):** Umschalter im Kopfbereich (Cookie-basiert,
  Standard Deutsch). Oberfläche, Wissensbasis inkl. Handbuch und Glossar sowie
  die 16 Abbildungen (für EN als originalgetreue SVG-Rekonstruktionen mit
  englischen Beschriftungen) sind vollständig zweisprachig; die synthetischen
  Demo-Daten (Risiken, Katalogtexte, Runbook-Inhalte) bleiben bewusst deutsch
- **DORA Wissensbasis:** die 5 Kernsäulen als interaktive Akkordeons mit
  klickbarem Fachbegriffs-Glossar, Live-Umsetzungsstand je Säule und den
  9 Wirkungsketten des DORA-Regelkreises – plus das **vollständige Handbuch**
  der Gesamtbetrachtung FRWK-DORA-001 (Kapitel 1–8 und 10–15, in fünf
  thematischen Teilen navigierbar) mit den 16 Original-Abbildungen des
  Dokuments (Klick öffnet Großansicht) und den zentralen Tabellen
  (DORA↔NIS-2, RTS/ITS, Meldefristen, Reifegradskala, KPI/KRI-Katalog,
  RACI-Matrix); Kapitel 9 ist als interaktiver Anforderungskatalog verlinkt
- **Reports:** Executive Summary, Top Risks, Appetit-Überschreitungen, überfällige
  Maßnahmen, Akzeptanzen, TPRM-Übersicht, DORA Readiness, Kontrollwirksamkeit,
  Quality-Review, Trend, Entscheidungsvorlage – mit Stichtag/Ersteller/Zeitpunkt,
  CSV-Export und druckoptimierter Ansicht (PDF über Browser-Druck)
- **Audit Trail:** append-only, inkl. Anmeldungen/Fehlversuchen, Statuswechseln,
  Freigaben, Exporten, Rollen- und Einstellungsänderungen

## Screenshots

_(Platzhalter – Screenshots des Dashboards, Risk Registers und einer
Runbook-Ausführung nach dem ersten lokalen Start ergänzen.)_

## Voraussetzungen

- Node.js ≥ 22, npm ≥ 10
- optional: Docker / Docker Compose (Produktionsprofil mit PostgreSQL)

## Installation & lokale Ausführung

```bash
cd cockpit
npm install
cp .env.example .env        # SESSION_SECRET setzen (openssl rand -base64 48)
npm run prepare-db          # Prisma-Schema (SQLite) + synthetische Demo-Daten
npm run dev                 # http://localhost:3000
```

### Demo-Zugänge (nur Entwicklung, `AUTH_DEMO_LOGIN=true`)

Passwort für alle Konten: `Demo!2026`

| Rolle                                 | E-Mail                      |
| ------------------------------------- | --------------------------- |
| Administrator                         | `admin@demo.example`        |
| ICT Risk Manager                      | `riskmanager@demo.example`  |
| Third Party Risk Manager              | `tprm@demo.example`         |
| Information Security Officer          | `iso@demo.example`          |
| Risk Owner                            | `riskowner@demo.example`    |
| Control Owner                         | `controlowner@demo.example` |
| Action Owner                          | `actionowner@demo.example`  |
| Reviewer / Second Line                | `secondline@demo.example`   |
| Management (Read-only + Freigaben)    | `management@demo.example`   |
| Auditor (read-only inkl. Audit Trail) | `auditor@demo.example`      |

## Tests

```bash
npm run typecheck   # TypeScript strict
npm run lint        # ESLint
npm test            # Vitest (Risikoberechnung, Workflows, RBAC-Matrix)
npm run test:e2e    # Playwright (Login, RBAC, Kernnavigation) – benötigt Seed
```

## Docker

**Einfachster Betrieb (ein Container, SQLite, Demo-Daten automatisch)** – z. B.
für ein Synology NAS, Schritt-für-Schritt-Anleitung:
[docs/operations/synology.md](docs/operations/synology.md):

```bash
echo "SESSION_SECRET=$(head -c 48 /dev/urandom | base64)" > .env
docker compose -f docker-compose.synology.yml up -d --build
# → http://<host>:3000 – Demo-Datenbank wird beim ersten Start angelegt
```

**Produktionsprofil mit PostgreSQL:**

```bash
# Voraussetzung: .env mit SESSION_SECRET und POSTGRES_PASSWORD;
# prisma/schema.prisma Provider auf "postgresql" stellen
docker compose up --build
docker compose exec app npx prisma db push
docker compose exec app npx tsx prisma/seed.ts
```

## Umgebungsvariablen

Siehe [.env.example](.env.example): `DATABASE_URL`, `SESSION_SECRET`,
`AUTH_DEMO_LOGIN`, `APP_BASE_URL`, `APP_DEFAULT_LOCALE`, vorbereitete
`AUTH_OIDC_*`-Variablen für Microsoft Entra ID (ADR-0003).

## Sicherheit

Security by Design: serverseitiges RBAC (Least Privilege, Funktionstrennung),
Zod-Validierung, Security-Header/CSP, HMAC-Sessions, bcrypt, Login-Rate-Limiting,
append-only Audit Trail, Exportkontrolle, keine Secrets im Repository.
Details: [SECURITY.md](SECURITY.md) und [docs/security/threat-model.md](docs/security/threat-model.md).

## Dokumentation

| Thema                                               | Pfad                                |
| --------------------------------------------------- | ----------------------------------- |
| Architektur                                         | docs/architecture/architecture.md   |
| Datenmodell                                         | docs/architecture/data-model.md     |
| Threat Model                                        | docs/security/threat-model.md       |
| RACI / Rollen                                       | docs/governance/raci.md             |
| Risikomethodik                                      | docs/governance/risk-methodology.md |
| Runbooks (RB-01…RB-20)                              | docs/runbooks/                      |
| Playbooks (PB-01…PB-16)                             | docs/playbooks/                     |
| Benutzerhandbuch nach Rolle                         | docs/user-guide/README.md           |
| Betrieb (Installation, Backup, Monitoring, Release) | docs/operations/README.md           |
| Projektplan, Backlog, Milestones, DoD               | docs/project/projektplan.md         |
| Architekturentscheidungen                           | docs/adr/                           |

## Projektstruktur

```
cockpit/
├── app/          # Next.js App Router (Seiten, API-Routen)
├── components/   # UI-Basiskomponenten (shadcn-Stil), Tabellen, Heatmap
├── features/     # Fachmodule (risks, actions-mgmt, controls, third-parties, …)
├── lib/          # Domäne (Enums, Berechnung), Auth, RBAC, Audit, Settings
├── prisma/       # Schema + Seed (synthetische Demo-Daten)
├── docs/         # Architektur, Governance, Security, Runbooks, Playbooks, …
├── tests/        # Vitest (unit) + Playwright (e2e)
└── Dockerfile, docker-compose.yml, .env.example
```
