#!/bin/sh
# Erststart-Initialisierung für SQLite-Betrieb (z. B. Synology NAS):
# Liegt unter DATABASE_URL (file:…) noch keine Datenbank, wird die beim
# Image-Build erzeugte, mit Demo-Daten befüllte Vorlage dorthin kopiert.
set -e

case "$DATABASE_URL" in
  file:*)
    DB_PATH="${DATABASE_URL#file:}"
    # Relative Pfade interpretiert Prisma relativ zu /app/prisma
    case "$DB_PATH" in
      /*) : ;;
      *) DB_PATH="/app/prisma/$DB_PATH" ;;
    esac
    if [ ! -f "$DB_PATH" ]; then
      mkdir -p "$(dirname "$DB_PATH")"
      cp /app/seed-template.db "$DB_PATH"
      echo "SQLite-Datenbank mit synthetischen Demo-Daten angelegt: $DB_PATH"
    else
      # Bestehende Installation: Schema über versionierte SQL-Updates
      # aktualisieren (bewusst ohne Prisma-CLI – läuft über die Query-
      # Engine der Anwendung selbst) und neue Inhaltsbausteine
      # (z. B. DORA-Katalog) idempotent nachziehen.
      echo "Bestehende Datenbank gefunden – prüfe Schema- und Datenupdates …"
      if ! node /app/scripts/ensure-schema.mjs; then
        echo "================================================================"
        echo "FEHLER: Schema-Update fehlgeschlagen. Start wird abgebrochen,"
        echo "damit kein halb-migrierter Zustand bedient wird."
        echo "Log oben prüfen; Notfall-Reset: Volume löschen (Demo-Daten)."
        echo "================================================================"
        exit 1
      fi
      node /app/scripts/seed-dora.mjs \
        || echo "WARNUNG: Daten-Update (DORA-Katalog) fehlgeschlagen – siehe Log oben."
    fi
    ;;
esac

exec node server.js
