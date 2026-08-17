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
      # Bestehende Installation: Schema additiv aktualisieren und neue
      # Inhaltsbausteine (z. B. DORA-Katalog) idempotent nachziehen.
      echo "Bestehende Datenbank gefunden – prüfe Schema- und Datenupdates …"
      ./node_modules/.bin/prisma db push --skip-generate --schema=/app/prisma/schema.prisma \
        || echo "WARNUNG: Schema-Update fehlgeschlagen – Anwendung startet mit bestehendem Schema."
      node /app/scripts/seed-dora.mjs \
        || echo "WARNUNG: Daten-Update (DORA-Katalog) fehlgeschlagen – siehe Log oben."
    fi
    ;;
esac

exec node server.js
