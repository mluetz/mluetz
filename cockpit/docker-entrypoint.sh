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
    fi
    ;;
esac

exec node server.js
