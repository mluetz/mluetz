import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import type { RoleKey } from "@/lib/domain/enums";

/**
 * MFA-Richtlinie: Für welche Rollen ist TOTP beim Login verpflichtend?
 * Standard: ADMIN, ISO, SECOND_LINE (Review v3, S-02). Über MFA_REQUIRED_ROLES
 * (kommagetrennte RoleKeys) konfigurierbar; "none" deaktiviert die Pflicht
 * (nur für Demo-Umgebungen gedacht).
 */
const DEFAULT_MFA_ROLES: RoleKey[] = ["ADMIN", "ISO", "SECOND_LINE"];

export function mfaRequiredRoles(env: NodeJS.ProcessEnv = process.env): RoleKey[] {
  const raw = env.MFA_REQUIRED_ROLES?.trim();
  if (!raw) return DEFAULT_MFA_ROLES;
  if (raw.toLowerCase() === "none") return [];
  return raw.split(",").map((r) => r.trim()) as RoleKey[];
}

export function requiresMfa(roles: RoleKey[], env: NodeJS.ProcessEnv = process.env): boolean {
  const required = mfaRequiredRoles(env);
  return roles.some((r) => required.includes(r));
}

// ------------------------------------------------------------------
// Wiederherstellungscodes: 10 Codes à 10 Zeichen, nur als SHA-256-Hash
// gespeichert, einmal verwendbar.
// ------------------------------------------------------------------

const RECOVERY_COUNT = 10;

function hashCode(code: string): string {
  return createHash("sha256").update(code.toUpperCase().replace(/-/g, "")).digest("hex");
}

export function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_COUNT }, () => {
    const raw = randomBytes(5).toString("hex").toUpperCase(); // 10 Hex-Zeichen
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

export async function storeRecoveryCodes(userId: string, codes: string[]): Promise<void> {
  await db.mfaRecoveryCode.deleteMany({ where: { userId } });
  await db.mfaRecoveryCode.createMany({
    data: codes.map((c) => ({ userId, codeHash: hashCode(c) })),
  });
}

/** Verbraucht einen Wiederherstellungscode; true = gültig und jetzt entwertet. */
export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const candidates = await db.mfaRecoveryCode.findMany({ where: { userId, usedAt: null } });
  const given = Buffer.from(hashCode(code));
  for (const c of candidates) {
    const stored = Buffer.from(c.codeHash);
    if (given.length === stored.length && timingSafeEqual(given, stored)) {
      await db.mfaRecoveryCode.update({ where: { id: c.id }, data: { usedAt: new Date() } });
      return true;
    }
  }
  return false;
}

// ------------------------------------------------------------------
// Persistente Login-Drossel (ersetzt die In-Memory-Map, S-02):
// max. 10 Fehlversuche je E-Mail in 15 Minuten, neustartfest.
// ------------------------------------------------------------------

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED = 10;

export async function recordLoginAttempt(email: string, success: boolean): Promise<void> {
  await db.loginAttempt.create({ data: { email, success } });
  // Opportunistisches Aufräumen alter Einträge (> 24 h).
  await db.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
}

export async function isLoginThrottled(email: string): Promise<boolean> {
  const failed = await db.loginAttempt.count({
    where: { email, success: false, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
  });
  return failed >= MAX_FAILED;
}
