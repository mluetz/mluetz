-- ============================================================
-- Update 0008 — Meldeschicht Welle 1 (ADR-0005)
-- Registermodell für das DORA-Informationsregister (DVO (EU) 2024/2956):
-- B_01-Felder an ReportingEntity, EntityBranch, Register-Vertragsfelder,
-- ContractIctService (Kernobjekt B_02.02), CifServiceAssessment (B_07.01),
-- providerType/CTPP an ThirdParty, Vertragsbezug der Subunternehmerkette,
-- RoiSnapshot (unveränderlicher Meldestand).
-- Für BESTEHENDE SQLite-Datenbanken; neue Installationen über
-- `prisma db push`.
-- Anwendung:  sqlite3 /data/cockpit.db < prisma/updates/0008-meldeschicht-welle1.sql
-- ============================================================

PRAGMA foreign_keys = OFF;
BEGIN;

-- ReportingEntity: B_01.01/B_01.02
ALTER TABLE "ReportingEntity" ADD COLUMN "country" TEXT;
ALTER TABLE "ReportingEntity" ADD COLUMN "entityType" TEXT;
ALTER TABLE "ReportingEntity" ADD COLUMN "hierarchyRole" TEXT;
ALTER TABLE "ReportingEntity" ADD COLUMN "competentAuthority" TEXT;
ALTER TABLE "ReportingEntity" ADD COLUMN "totalAssetsEur" REAL;
ALTER TABLE "ReportingEntity" ADD COLUMN "lastUpdateAt" DATETIME;

-- Zweigniederlassungen (B_01.03)
CREATE TABLE IF NOT EXISTS "EntityBranch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportingEntityId" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL,
    "name" TEXT,
    "country" TEXT NOT NULL,
    CONSTRAINT "EntityBranch_reportingEntityId_fkey" FOREIGN KEY ("reportingEntityId")
        REFERENCES "ReportingEntity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "EntityBranch_reportingEntityId_branchCode_key"
    ON "EntityBranch" ("reportingEntityId", "branchCode");

-- CriticalFunction: B_06.01
ALTER TABLE "CriticalFunction" ADD COLUMN "licensedActivity" TEXT;
ALTER TABLE "CriticalFunction" ADD COLUMN "discontinuationImpact" TEXT;
ALTER TABLE "CriticalFunction" ADD COLUMN "criticalityRationale" TEXT;

-- ThirdParty: B_05.01
ALTER TABLE "ThirdParty" ADD COLUMN "providerType" TEXT NOT NULL DEFAULT 'DIRECT';
ALTER TABLE "ThirdParty" ADD COLUMN "ultimateParentId" TEXT REFERENCES "ThirdParty"("id");
ALTER TABLE "ThirdParty" ADD COLUMN "isCtpp" BOOLEAN NOT NULL DEFAULT false;

-- Contract: B_02.01/B_02.02/B_02.03, Entitätsbezug für B_03/B_04,
-- MaRisk-Vorbereitung (isIctService, nicht ausgewertet)
ALTER TABLE "Contract" ADD COLUMN "contractType" TEXT;
ALTER TABLE "Contract" ADD COLUMN "governingLaw" TEXT;
ALTER TABLE "Contract" ADD COLUMN "annualCostEur" REAL;
ALTER TABLE "Contract" ADD COLUMN "parentContractRef" TEXT;
ALTER TABLE "Contract" ADD COLUMN "isIntragroup" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contract" ADD COLUMN "terminationNoticeDaysEntity" INTEGER;
ALTER TABLE "Contract" ADD COLUMN "terminationNoticeDaysProvider" INTEGER;
ALTER TABLE "Contract" ADD COLUMN "isIctService" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Contract" ADD COLUMN "signingEntityId" TEXT REFERENCES "ReportingEntity"("id");

-- Bestandswert der einseitigen Kündigungsfrist übernehmen (ADR-0005);
-- noticePeriodDays bleibt als deprecated erhalten.
UPDATE "Contract" SET "terminationNoticeDaysEntity" = "noticePeriodDays"
    WHERE "terminationNoticeDaysEntity" IS NULL AND "noticePeriodDays" IS NOT NULL;

-- Nutzende Einheiten (B_04.01): implizite n:m-Tabelle nach Prisma-Konvention
CREATE TABLE IF NOT EXISTS "_ContractUsingEntities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContractUsingEntities_A_fkey" FOREIGN KEY ("A")
        REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContractUsingEntities_B_fkey" FOREIGN KEY ("B")
        REFERENCES "ReportingEntity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "_ContractUsingEntities_AB_unique"
    ON "_ContractUsingEntities" ("A", "B");
CREATE INDEX IF NOT EXISTS "_ContractUsingEntities_B_index"
    ON "_ContractUsingEntities" ("B");

-- Kernobjekt B_02.02: Vertrag × IKT-Dienstleistungsart
CREATE TABLE IF NOT EXISTS "ContractIctService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "ictServiceType" TEXT NOT NULL,
    "dataStorageCountries" TEXT,
    "dataProcessingCountries" TEXT,
    "dataSensitivity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    CONSTRAINT "ContractIctService_contractId_fkey" FOREIGN KEY ("contractId")
        REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContractIctService_contractId_ictServiceType_key"
    ON "ContractIctService" ("contractId", "ictServiceType");
CREATE INDEX IF NOT EXISTS "ContractIctService_contractId_idx"
    ON "ContractIctService" ("contractId");

-- Gestützte Funktionen je Dienstleistung (implizite n:m-Tabelle)
CREATE TABLE IF NOT EXISTS "_ContractIctServiceToCriticalFunction" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContractIctServiceToCriticalFunction_A_fkey" FOREIGN KEY ("A")
        REFERENCES "ContractIctService" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ContractIctServiceToCriticalFunction_B_fkey" FOREIGN KEY ("B")
        REFERENCES "CriticalFunction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "_ContractIctServiceToCriticalFunction_AB_unique"
    ON "_ContractIctServiceToCriticalFunction" ("A", "B");
CREATE INDEX IF NOT EXISTS "_ContractIctServiceToCriticalFunction_B_index"
    ON "_ContractIctServiceToCriticalFunction" ("B");

-- Subcontractor: Vertragsbezug und Dienstleistungsart (B_05.02)
ALTER TABLE "Subcontractor" ADD COLUMN "contractId" TEXT REFERENCES "Contract"("id");
ALTER TABLE "Subcontractor" ADD COLUMN "ictServiceType" TEXT;

-- Registerbewertung je CIF-gestützter Dienstleistung (B_07.01)
CREATE TABLE IF NOT EXISTS "CifServiceAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractIctServiceId" TEXT NOT NULL,
    "substitutability" TEXT NOT NULL DEFAULT 'MEDIUM_COMPLEXITY',
    "rationale" TEXT,
    "reintegrationTimeDays" INTEGER,
    "exitPlanExists" BOOLEAN NOT NULL DEFAULT false,
    "alternativeProviders" TEXT,
    "lastAuditDate" DATETIME,
    "auditRightsInContract" BOOLEAN NOT NULL DEFAULT false,
    "assessedById" TEXT,
    "assessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CifServiceAssessment_contractIctServiceId_fkey" FOREIGN KEY ("contractIctServiceId")
        REFERENCES "ContractIctService" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CifServiceAssessment_assessedById_fkey" FOREIGN KEY ("assessedById")
        REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CifServiceAssessment_contractIctServiceId_key"
    ON "CifServiceAssessment" ("contractIctServiceId");

-- Unveränderlicher Meldestand
CREATE TABLE IF NOT EXISTS "RoiSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceDate" DATETIME NOT NULL,
    "version" INTEGER NOT NULL,
    "reportingLevel" TEXT NOT NULL DEFAULT 'ENTITY',
    "taxonomyVersion" TEXT NOT NULL,
    "validationSummary" TEXT,
    "payload" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "submittedById" TEXT,
    "submissionReference" TEXT,
    CONSTRAINT "RoiSnapshot_createdById_fkey" FOREIGN KEY ("createdById")
        REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RoiSnapshot_submittedById_fkey" FOREIGN KEY ("submittedById")
        REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "RoiSnapshot_referenceDate_reportingLevel_version_key"
    ON "RoiSnapshot" ("referenceDate", "reportingLevel", "version");

COMMIT;
PRAGMA foreign_keys = ON;
