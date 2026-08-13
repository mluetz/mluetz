# ADR-0001: Cockpit als eigenständiges Unterprojekt `cockpit/`

- **Status:** Akzeptiert
- **Datum:** 2026-08-13

## Kontext

Die Zielvorgabe beschreibt eine Repository-Struktur mit `app/`, `components/` usw. im
Repository-Root. Das bestehende Repository enthält jedoch bereits produktiv genutzte,
in sich geschlossene Werkzeuge (TISAX-Finding-Register mit eigenem `app/`-Verzeichnis,
IRM-Prototyp unter `irm/`), deren Struktur nicht zerstört werden darf.

## Entscheidung

Das ICT & TPRM Cockpit wird als eigenständiges, vollständiges Projekt unter `cockpit/`
angelegt – analog zum etablierten Muster `irm/`. Innerhalb von `cockpit/` gilt exakt
die geforderte Struktur (`app/`, `components/`, `features/`, `lib/`, `prisma/`, `docs/`,
`tests/`, Docker- und CI-Artefakte).

## Konsequenzen

- Bestehende Tools bleiben unangetastet; das Cockpit ist unabhängig versionier- und
  extrahierbar (z. B. späterer Umzug in ein eigenes Repository ohne Umbau).
- CI-Workflows arbeiten mit `working-directory: cockpit`.
