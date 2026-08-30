-- ============================================================
-- Update 0011 — Meldeschicht Welle 6 (ADR-0010)
-- Vorfallklassifizierung: rohe Messwerte der sieben DelVO-Kriterien
-- (IncidentClassification.measurements, JSON).
-- Für BESTEHENDE SQLite-Datenbanken; neue Installationen über
-- `prisma db push`.
-- Anwendung:  sqlite3 /data/cockpit.db < prisma/updates/0011-meldeschicht-welle6.sql
-- ============================================================

PRAGMA foreign_keys = OFF;
BEGIN;

ALTER TABLE "IncidentClassification" ADD COLUMN "measurements" TEXT;

COMMIT;
PRAGMA foreign_keys = ON;
