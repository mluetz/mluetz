-- ============================================================
-- Update 0003 — Welle 0 (Review v3, S-01/S-02)
-- MFA (TOTP) und persistente Login-Drossel.
-- Für BESTEHENDE SQLite-Datenbanken; neue Installationen erhalten
-- das Schema vollständig über `prisma db push`.
-- Anwendung:  sqlite3 /data/cockpit.db < prisma/updates/0003-welle0-mfa.sql
-- ============================================================

ALTER TABLE "User" ADD COLUMN "mfaSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "mfaEnabledAt" DATETIME;

CREATE TABLE IF NOT EXISTS "MfaRecoveryCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" DATETIME,
    CONSTRAINT "MfaRecoveryCode_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "MfaRecoveryCode_userId_idx" ON "MfaRecoveryCode"("userId");

CREATE TABLE IF NOT EXISTS "LoginAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");
