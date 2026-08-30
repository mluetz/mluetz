-- ============================================================
-- Update 0009 — Meldeschicht Welle 3 (ADR-0007)
-- Vier-Augen-Bezug der Freigaben auf einen Meldestand:
-- Approval.roiSnapshotId (nullable, FK auf RoiSnapshot).
-- Für BESTEHENDE SQLite-Datenbanken; neue Installationen über
-- `prisma db push`.
-- Anwendung:  sqlite3 /data/cockpit.db < prisma/updates/0009-meldeschicht-welle3.sql
-- ============================================================

PRAGMA foreign_keys = OFF;
BEGIN;

ALTER TABLE "Approval" ADD COLUMN "roiSnapshotId" TEXT REFERENCES "RoiSnapshot"("id") ON DELETE CASCADE;

COMMIT;
PRAGMA foreign_keys = ON;
