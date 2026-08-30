#!/usr/bin/env node
/**
 * Schema-Updater für bestehende Installationen – bewusst OHNE Prisma-CLI:
 * führt die versionierten Update-Skripte aus prisma/updates/ über die
 * Query-Engine des Prisma-Clients aus (dieselbe Engine, mit der die
 * Anwendung nachweislich läuft). Idempotent über Guards je Update.
 *
 * Exit-Code != 0 bei Fehlschlag – der Container-Entrypoint bricht dann
 * den Start ab, damit kein halb-migrierter Zustand bedient wird.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const here = dirname(fileURLToPath(import.meta.url));
const db = new PrismaClient();

const log = (m) => console.log(`[ensure-schema] ${m}`);

async function tableExists(name) {
  const rows = await db.$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    name,
  );
  return rows.length > 0;
}

async function columnExists(table, column) {
  const rows = await db.$queryRawUnsafe(`PRAGMA table_info("${table}")`);
  return rows.some((r) => r.name === column);
}

/**
 * Zerlegt ein SQL-Skript in Einzelstatements (keine Semikolons in Strings enthalten).
 *
 * BEGIN/COMMIT/ROLLBACK werden verworfen: Die Skripte ab 0004 klammern sich
 * selbst in eine Transaktion, weil sie für den Aufruf über die sqlite3-CLI
 * geschrieben sind. Hier läuft jedes Statement einzeln über die Query-Engine
 * des Prisma-Clients, die ihre Transaktionen selbst verwaltet — ein explizites
 * BEGIN würde entweder abgelehnt oder bliebe offen stehen.
 */
function splitStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.replace(/^--[^\n]*$/gm, "").trim())
    .filter((s) => s.length > 0)
    .filter((s) => !/^(BEGIN|COMMIT|ROLLBACK)\b/i.test(s));
}

/**
 * Führt das Update-Skript sequenziell aus – tolerant gegenüber einem
 * halb-angewendeten Vorzustand ("already exists"/"duplicate column"
 * werden übersprungen). FK-Prüfung ist während des Laufs deaktiviert
 * (das Skript enthält die PRAGMAs); Reste eines abgebrochenen
 * Evidence-Rebuilds werden vorab aufgeräumt.
 */
async function applyScript(file) {
  const sql = readFileSync(join(here, "..", "prisma", "updates", file), "utf-8");
  const statements = splitStatements(sql);
  log(`${file}: wende ${statements.length} Statements an …`);
  await db.$executeRawUnsafe(`DROP TABLE IF EXISTS "new_Evidence"`);
  let skipped = 0;
  for (const stmt of statements) {
    try {
      await db.$executeRawUnsafe(stmt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // "no such column" deckt den wiederholten DROP COLUMN aus 0004 ab.
      if (/already exists|duplicate column name|no such column/i.test(msg)) {
        skipped += 1;
        continue;
      }
      throw new Error(`Statement fehlgeschlagen: ${stmt.slice(0, 80)} … → ${msg}`);
    }
  }
  log(
    `${file}: abgeschlossen${skipped ? ` (${skipped} bereits vorhandene Objekte übersprungen)` : ""}.`,
  );
}

/** Updates mit Guards: angewendet wird nur, was nachweislich fehlt. */
const UPDATES = [
  {
    file: "0002-dora.sql",
    needed: async () =>
      !(await tableExists("DoraChapter")) || !(await columnExists("Evidence", "doraRequirementId")),
  },
  {
    file: "0003-welle0-mfa.sql",
    needed: async () =>
      !(await columnExists("User", "mfaSecret")) ||
      !(await tableExists("MfaRecoveryCode")) ||
      !(await tableExists("LoginAttempt")),
  },
  {
    file: "0004-welle1-cif-audit.sql",
    // supportsCriticalFunction ist der umgekehrte Fall: Solange die Spalte noch
    // existiert, steht die Boolean-Migration (B-2) aus.
    needed: async () =>
      !(await columnExists("CriticalFunction", "cfId")) ||
      !(await tableExists("CifAssessment")) ||
      (await columnExists("ThirdParty", "supportsCriticalFunction")) ||
      !(await columnExists("AuditLog", "hash")),
  },
  {
    file: "0005-welle2-register.sql",
    needed: async () =>
      !(await columnExists("ThirdParty", "lei")) ||
      !(await columnExists("CriticalFunction", "functionIdCode")) ||
      !(await columnExists("Contract", "contractRef")) ||
      !(await columnExists("Subcontractor", "parentId")) ||
      !(await tableExists("ContractClause")) ||
      !(await tableExists("PreContractAssessment")) ||
      !(await tableExists("ReportingEntity")) ||
      !(await tableExists("ItsTemplateVersion")) ||
      !(await tableExists("ItsFieldMapping")) ||
      !(await tableExists("RegisterExport")),
  },
  {
    file: "0006-welle3-methodik-fristen.sql",
    needed: async () =>
      !(await tableExists("MethodologyVersion")) ||
      !(await columnExists("RiskAssessment", "methodologyVersionId")) ||
      !(await tableExists("PeriodSnapshot")) ||
      !(await tableExists("IncidentClassification")),
  },
  {
    file: "0007-welle5-6-tests-ti-sod.sql",
    needed: async () =>
      !(await tableExists("ResilienceTest")) ||
      !(await tableExists("_CriticalFunctionToResilienceTest")) ||
      !(await tableExists("ThreatIntelAlert")) ||
      !(await tableExists("GovernanceReportDuty")),
  },
];

try {
  let applied = 0;
  for (const u of UPDATES) {
    if (await u.needed()) {
      await applyScript(u.file);
      applied += 1;
    } else {
      log(`${u.file}: bereits angewendet – übersprungen.`);
    }
  }
  log(applied ? `Fertig – ${applied} Update(s) angewendet.` : "Schema aktuell.");
} catch (e) {
  console.error("[ensure-schema] FEHLER:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
