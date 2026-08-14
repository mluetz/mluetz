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
RUN npx prisma generate && npm run build
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
COPY --chmod=755 docker-entrypoint.sh ./docker-entrypoint.sh

# Datenverzeichnis für SQLite-Betrieb (Volume-Mountpunkt) und Next-Cache
# app-beschreibbar machen
RUN mkdir -p /data .next/cache && chown app:app /data /app && chown -R app:app .next/cache

USER app
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
