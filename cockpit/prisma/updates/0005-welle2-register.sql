-- ============================================================
-- Update 0005 — Welle 2 (Review v3, B-1/B-3, P1-01/P1-03, P2-06)
-- Informationsregister (Mapping als Daten), Art.-30-Klauselmatrix,
-- Art.-29-Vorabbewertung, rekursive Subunternehmerkette, LEI-Felder.
-- Für BESTEHENDE SQLite-Datenbanken; neue Installationen über
-- `prisma db push`. Mapping-STAMMDATEN danach einmalig einspielen:
--   npx tsx -e "import('./prisma/register-seed.mjs').then(async m => { const {PrismaClient}=await import('@prisma/client'); const db=new PrismaClient(); await m.seedRegisterMapping(db,{log:console.log}); await db.\$disconnect(); })"
-- Anwendung:  sqlite3 /data/cockpit.db < prisma/updates/0005-welle2-register.sql
-- ============================================================

PRAGMA foreign_keys = OFF;
BEGIN;

-- ThirdParty: Registerkennungen
ALTER TABLE "ThirdParty" ADD COLUMN "lei" TEXT;
ALTER TABLE "ThirdParty" ADD COLUMN "nationalId" TEXT;
ALTER TABLE "ThirdParty" ADD COLUMN "nationalIdType" TEXT;

-- CriticalFunction: Funktions-Identifikationscode
ALTER TABLE "CriticalFunction" ADD COLUMN "functionIdCode" TEXT;

-- Contract: Registerpflichtfelder
ALTER TABLE "Contract" ADD COLUMN "contractRef" TEXT;
ALTER TABLE "Contract" ADD COLUMN "countryOfProvision" TEXT;
ALTER TABLE "Contract" ADD COLUMN "countryOfDataStorage" TEXT;
ALTER TABLE "Contract" ADD COLUMN "countryOfDataProcessing" TEXT;

-- Subcontractor: rekursive Kette (Bestandsdaten = Rang 1)
ALTER TABLE "Subcontractor" ADD COLUMN "parentId" TEXT REFERENCES "Subcontractor"("id");
ALTER TABLE "Subcontractor" ADD COLUMN "rank" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Subcontractor" ADD COLUMN "lei" TEXT;
ALTER TABLE "Subcontractor" ADD COLUMN "sharePercent" REAL;
ALTER TABLE "Subcontractor" ADD COLUMN "providesCifService" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Subcontractor" ADD COLUMN "approvalStatus" TEXT;
ALTER TABLE "Subcontractor" ADD COLUMN "approvalDate" DATETIME;

-- Klauselmatrix Art. 30
CREATE TABLE IF NOT EXISTS "ContractClause" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "clauseKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'MISSING',
    "contractSection" TEXT,
    "evidenceId" TEXT,
    "comment" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractClause_contractId_fkey" FOREIGN KEY ("contractId")
        REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContractClause_contractId_clauseKey_key"
    ON "ContractClause"("contractId", "clauseKey");

-- Vorabbewertung Art. 29
CREATE TABLE IF NOT EXISTS "PreContractAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "concentrationRisk" TEXT NOT NULL,
    "substitutability" TEXT NOT NULL,
    "thirdCountryTransfer" TEXT NOT NULL,
    "businessContinuityImpact" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "assessedById" TEXT,
    "assessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    CONSTRAINT "PreContractAssessment_contractId_fkey" FOREIGN KEY ("contractId")
        REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PreContractAssessment_assessedById_fkey" FOREIGN KEY ("assessedById")
        REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PreContractAssessment_approvedById_fkey" FOREIGN KEY ("approvedById")
        REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PreContractAssessment_contractId_key"
    ON "PreContractAssessment"("contractId");

-- Meldende Entitäten
CREATE TABLE IF NOT EXISTS "ReportingEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "lei" TEXT,
    "nationalId" TEXT,
    "nationalIdType" TEXT,
    "consolidationLevel" TEXT NOT NULL DEFAULT 'SOLO',
    "parentId" TEXT REFERENCES "ReportingEntity"("id")
);

-- ITS-Fassungen und Feld-Mapping (Daten, kein Code)
CREATE TABLE IF NOT EXISTS "ItsTemplateVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "validFrom" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'TO_VERIFY',
    "notes" TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "ItsTemplateVersion_label_key" ON "ItsTemplateVersion"("label");

CREATE TABLE IF NOT EXISTS "ItsFieldMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "cockpitField" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "codeList" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "transformation" TEXT,
    CONSTRAINT "ItsFieldMapping_versionId_fkey" FOREIGN KEY ("versionId")
        REFERENCES "ItsTemplateVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ItsFieldMapping_versionId_template_fieldId_key"
    ON "ItsFieldMapping"("versionId", "template", "fieldId");

-- Erzeugungsprotokoll je Export
CREATE TABLE IF NOT EXISTS "RegisterExport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateVersionId" TEXT NOT NULL,
    "asOfDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "validationReport" TEXT NOT NULL,
    CONSTRAINT "RegisterExport_templateVersionId_fkey" FOREIGN KEY ("templateVersionId")
        REFERENCES "ItsTemplateVersion" ("id") ON UPDATE CASCADE,
    CONSTRAINT "RegisterExport_createdById_fkey" FOREIGN KEY ("createdById")
        REFERENCES "User" ("id") ON UPDATE CASCADE
);

COMMIT;
PRAGMA foreign_keys = ON;
