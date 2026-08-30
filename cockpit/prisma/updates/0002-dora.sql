-- ============================================================
-- Update 0002: DORA-Anforderungskatalog (FRWK-DORA-001)
-- Additive Migration vom Stand 0.1.x (Commit 59e390e) auf 0.2.0.
-- Erzeugt mit: prisma migrate diff --from-schema-datamodel <alt> \
--   --to-schema-datamodel prisma/schema.prisma --script
-- Wird von scripts/ensure-schema.mjs geführt ausgeführt (Guard +
-- Transaktion mit defer_foreign_keys). Bei künftigen Schema-
-- Änderungen ein neues nummeriertes Update ergänzen.
-- ============================================================
-- CreateTable
CREATE TABLE "DoraChapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "roman" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "articleRange" TEXT NOT NULL,
    "weightPercent" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "DoraRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reqId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requirementText" TEXT NOT NULL,
    "evidenceSpec" TEXT NOT NULL,
    "bindingness" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "knockout" BOOLEAN NOT NULL DEFAULT false,
    "ownerRole" TEXT NOT NULL,
    "cwIso27001" TEXT,
    "cwIso22301" TEXT,
    "cwNis2Bsig" TEXT,
    "cwRtsIts" TEXT,
    "linkedProcesses" TEXT,
    CONSTRAINT "DoraRequirement_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "DoraChapter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoraAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "maturity" INTEGER NOT NULL,
    "justification" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "assessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "DoraAssessment_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DoraRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DoraAssessment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DoraFinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "requirementId" TEXT,
    "source" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseDueAt" DATETIME,
    "remediationDueAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "effectivenessCriterion" TEXT,
    "escalatedTo" TEXT,
    "actionId" TEXT,
    "closedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "DoraFinding_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DoraRequirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DoraFinding_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DoraFinding_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "awarenessAt" DATETIME NOT NULL,
    "classifiedAt" DATETIME,
    "isMajor" BOOLEAN NOT NULL DEFAULT false,
    "classificationNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "gdprRelevant" BOOLEAN NOT NULL DEFAULT false,
    "nis2Relevant" BOOLEAN NOT NULL DEFAULT false,
    "criticalFunctionId" TEXT,
    "thirdPartyId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Incident_criticalFunctionId_fkey" FOREIGN KEY ("criticalFunctionId") REFERENCES "CriticalFunction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Incident_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Incident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "reference" TEXT,
    CONSTRAINT "IncidentReport_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evidenceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "ownerId" TEXT,
    "link" TEXT NOT NULL,
    "riskId" TEXT,
    "controlId" TEXT,
    "thirdPartyId" TEXT,
    "validUntil" DATETIME,
    "classification" TEXT NOT NULL DEFAULT 'INTERNAL',
    "reviewerId" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'NOT_REVIEWED',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "contentHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doraRequirementId" TEXT,
    CONSTRAINT "Evidence_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Evidence_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Evidence_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Evidence_thirdPartyId_fkey" FOREIGN KEY ("thirdPartyId") REFERENCES "ThirdParty" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Evidence_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Evidence_doraRequirementId_fkey" FOREIGN KEY ("doraRequirementId") REFERENCES "DoraRequirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Evidence" ("classification", "contentHash", "controlId", "createdAt", "docType", "evidenceId", "id", "link", "ownerId", "reviewStatus", "reviewerId", "riskId", "thirdPartyId", "title", "validUntil", "version") SELECT "classification", "contentHash", "controlId", "createdAt", "docType", "evidenceId", "id", "link", "ownerId", "reviewStatus", "reviewerId", "riskId", "thirdPartyId", "title", "validUntil", "version" FROM "Evidence";
DROP TABLE "Evidence";
ALTER TABLE "new_Evidence" RENAME TO "Evidence";
CREATE UNIQUE INDEX "Evidence_evidenceId_key" ON "Evidence"("evidenceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DoraChapter_key_key" ON "DoraChapter"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DoraRequirement_reqId_key" ON "DoraRequirement"("reqId");

-- CreateIndex
CREATE INDEX "DoraRequirement_chapterId_idx" ON "DoraRequirement"("chapterId");

-- CreateIndex
CREATE INDEX "DoraAssessment_requirementId_isCurrent_idx" ON "DoraAssessment"("requirementId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "DoraFinding_findingId_key" ON "DoraFinding"("findingId");

-- CreateIndex
CREATE INDEX "DoraFinding_status_idx" ON "DoraFinding"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_incidentId_key" ON "Incident"("incidentId");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentReport_incidentId_reportType_key" ON "IncidentReport"("incidentId", "reportType");

