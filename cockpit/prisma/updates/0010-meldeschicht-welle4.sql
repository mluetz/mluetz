-- ============================================================
-- Update 0010 — Meldeschicht Welle 4 (ADR-0008)
-- Klauselbibliothek Art. 30: ClauseTemplate, Bewerter-/Maßnahmenbezug an
-- ContractClause, Ablösung der drei Vertrags-Booleans (Materialisierung
-- als Klauselstatus, dann Spaltenabbau).
-- Für BESTEHENDE SQLite-Datenbanken; neue Installationen über
-- `prisma db push`. Die ClauseTemplate-STAMMDATEN werden beim Seed bzw.
-- über die Anwendung eingespielt.
-- Anwendung:  sqlite3 /data/cockpit.db < prisma/updates/0010-meldeschicht-welle4.sql
-- ============================================================

PRAGMA foreign_keys = OFF;
BEGIN;

CREATE TABLE IF NOT EXISTS "ClauseTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "applicability" TEXT NOT NULL DEFAULT 'ALL',
    "textDe" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClauseTemplate_key_key" ON "ClauseTemplate" ("key");

ALTER TABLE "ContractClause" ADD COLUMN "assessedAt" DATETIME;
ALTER TABLE "ContractClause" ADD COLUMN "assessedById" TEXT REFERENCES "User"("id");
ALTER TABLE "ContractClause" ADD COLUMN "actionId" TEXT REFERENCES "Action"("id");

-- Bestands-Booleans als Klauselstatus materialisieren (nur wo noch keine
-- Bewertung existiert; ADR-0008 Nr. 6): auditRights -> ART30_3_E,
-- accessRights -> ART30_2_D, incidentReporting -> ART30_2_F.
INSERT INTO "ContractClause" ("id", "contractId", "clauseKey", "status", "comment", "updatedAt")
SELECT lower(hex(randomblob(16))), c."id", 'ART30_3_E', 'FULFILLED',
       'Aus Bestandskennzeichen auditRights übernommen (Update 0010)', CURRENT_TIMESTAMP
FROM "Contract" c
WHERE c."auditRights" = 1
  AND NOT EXISTS (SELECT 1 FROM "ContractClause" cc WHERE cc."contractId" = c."id" AND cc."clauseKey" = 'ART30_3_E');

INSERT INTO "ContractClause" ("id", "contractId", "clauseKey", "status", "comment", "updatedAt")
SELECT lower(hex(randomblob(16))), c."id", 'ART30_2_D', 'FULFILLED',
       'Aus Bestandskennzeichen accessRights übernommen (Update 0010)', CURRENT_TIMESTAMP
FROM "Contract" c
WHERE c."accessRights" = 1
  AND NOT EXISTS (SELECT 1 FROM "ContractClause" cc WHERE cc."contractId" = c."id" AND cc."clauseKey" = 'ART30_2_D');

INSERT INTO "ContractClause" ("id", "contractId", "clauseKey", "status", "comment", "updatedAt")
SELECT lower(hex(randomblob(16))), c."id", 'ART30_2_F', 'FULFILLED',
       'Aus Bestandskennzeichen incidentReporting übernommen (Update 0010)', CURRENT_TIMESTAMP
FROM "Contract" c
WHERE c."incidentReporting" = 1
  AND NOT EXISTS (SELECT 1 FROM "ContractClause" cc WHERE cc."contractId" = c."id" AND cc."clauseKey" = 'ART30_2_F');

-- Spaltenabbau (SQLite >= 3.35; "no such column" wird vom Updater toleriert)
ALTER TABLE "Contract" DROP COLUMN "auditRights";
ALTER TABLE "Contract" DROP COLUMN "accessRights";
ALTER TABLE "Contract" DROP COLUMN "incidentReporting";

COMMIT;
PRAGMA foreign_keys = ON;
