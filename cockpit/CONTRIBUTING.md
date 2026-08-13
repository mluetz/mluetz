# Contributing – ICT & TPRM Cockpit

## Branch-Konzept

| Branch | Zweck |
|---|---|
| `main` | produktionsfähiger Stand, geschützt, keine Direkt-Pushes |
| `develop` | optionaler Integrationsbranch |
| `feature/*` | neue Funktionen |
| `fix/*` | Fehlerbehebungen |
| `release/*` | Release-Vorbereitung |

Schutzregeln für `main`: Pull Request verpflichtend, mindestens 1 Review
(CODEOWNERS), alle CI-Checks grün, keine Force-Pushes.

## Commits

Conventional Commits: `feat: …`, `fix: …`, `docs: …`, `refactor: …`, `test: …`,
`chore: …`, `security: …`. Kleine, nachvollziehbare Commits; keine Sammel-Commits
über mehrere Themen.

## Pull Requests

- PR-Template ausfüllen (Checkliste!)
- Lokal grün: `npm run typecheck && npm run lint && npm test`
- UI-Änderungen mit Screenshot (hell und dunkel)
- Sicherheitsrelevante Änderungen (Authz, Workflows, Export) explizit kennzeichnen

## Entwicklung

```bash
cd cockpit
npm install
cp .env.example .env   # SESSION_SECRET setzen
npm run prepare-db      # Schema + Demo-Daten
npm run dev
```

Tests: `npm test` (Unit), `npm run test:e2e` (Playwright, benötigt Seed).

## Releases & Changelog

- Versionierung: SemVer, Tags `cockpit-vX.Y.Z`
- `CHANGELOG.md` folgt "Keep a Changelog"; jeder PR mit Nutzerwirkung ergänzt einen
  Eintrag unter *Unreleased*; beim Release wird der Abschnitt umbenannt.

## Verhaltensregeln für Inhalte

Keine realen Unternehmens-, Kunden-, Mitarbeiter- oder Lieferantendaten – auch nicht
in Tests, Fixtures, Screenshots oder Issue-Beschreibungen. Ausschließlich fiktive
Demo-Daten (Mandant „Nordlicht Bank AG“).
