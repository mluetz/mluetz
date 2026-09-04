# ============================================================
# ICT & TPRM Cockpit – Produktions-Image (Multi-Stage)
# ============================================================
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Abhängigkeiten ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy-Werte nur für den Build (werden zur Laufzeit überschrieben)
ENV DATABASE_URL="file:/app/prisma/seed-template.db" \
    SESSION_SECRET="build-time-secret-not-used-at-runtime-0123456789"
# Prisma-CLI-Netzwerkzugriffe im Build eindämmen: CHECKPOINT_DISABLE
# unterbindet den Telemetrie-/Versions-Check (kann in NAS-Netzen minutenlang
# hängen und mit ECONNRESET abbrechen), die übrigen Variablen unterdrücken
# Update-Hinweise von Prisma und npm.
ENV CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false
# public/ absichern: Git speichert keine leeren Verzeichnisse – ohne diese
# Zeile bricht der spätere COPY-Schritt bei einem Quellstand ohne public/ ab.
# prisma generate mit hartem Timeout und 3 Versuchen: Falls die Query-Engine
# doch aus dem Netz geladen werden muss, scheitert ein gestörter Download
# nach spätestens 3×5 Minuten mit klarer Meldung statt endlos zu hängen.
RUN mkdir -p public \
    && i=1; while :; do \
         if timeout 300 npx prisma generate; then break; fi; \
         echo "prisma generate: Versuch $i fehlgeschlagen."; \
         if [ "$i" -ge 3 ]; then \
           echo "FEHLER: Engine-Download wiederholt gescheitert."; \
           echo "Bitte DNS/Internetzugang des NAS pruefen (binaries.prisma.sh) und erneut ausfuehren."; \
           exit 1; \
         fi; \
         i=$((i+1)); echo "Neuer Versuch in 15 s ..."; sleep 15; \
       done \
    && npm run build
# Demo-Datenbank-Vorlage erzeugen (wird beim ersten Start in das
# Datenvolume kopiert, siehe docker-entrypoint.sh)
RUN npx prisma db push --skip-generate && npx tsx prisma/seed.ts

# ---- Runtime ----
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/prisma/seed-template.db ./seed-template.db
# Runtime-Updater für bestehende Installationen (idempotenter DORA-Seed)
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib/content/dora-catalog.json ./lib/content/dora-catalog.json
# Bewusst ohne "--chmod" (das setzt BuildKit voraus, das auf Synology-DSM
# nicht immer aktiv ist) – Rechte werden per RUN gesetzt.
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Entrypoint ausführbar machen; Datenverzeichnis für SQLite (Volume-Mountpunkt)
# und Next-Cache für den Non-Root-Benutzer beschreibbar machen
RUN chmod 755 ./docker-entrypoint.sh \
    && mkdir -p /data .next/cache \
    && chown app:app /data /app \
    && chown -R app:app .next/cache

USER app
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
