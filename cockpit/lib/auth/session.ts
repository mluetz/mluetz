import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { shouldUseSecureCookie } from "@/lib/auth/cookie-policy";
import type { RoleKey } from "@/lib/domain/enums";

/**
 * Leichtgewichtige, abhängigkeitsfreie Session-Schicht (ADR-0003):
 * HMAC-SHA256-signiertes HttpOnly-Cookie, 8 h Gültigkeit, SameSite=Lax.
 * Die Schnittstelle (getSession / requireUser) ist bewusst schmal gehalten,
 * damit sie später 1:1 durch Auth.js mit OIDC/Entra ID ersetzt werden kann.
 */

const COOKIE_NAME = "cockpit_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface SessionPayload {
  userId: string;
  exp: number; // Unix-Sekunden
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  locale: string;
  roles: RoleKey[];
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET fehlt oder ist zu kurz (mind. 32 Zeichen). Siehe .env.example");
  }
  return s;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string): SessionPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (typeof payload.userId !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(userId: string): Promise<void> {
  const token = encodeSession({
    userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// ------------------------------------------------------------------
// MFA-Zwischenzustand: Nach erfolgreicher Passwortprüfung, aber vor
// TOTP-Bestätigung, existiert noch KEINE Session — nur ein kurzlebiges
// (5 min) signiertes Pre-Auth-Cookie. mode "setup" = Ersteinrichtung
// wird beim Login erzwungen, "verify" = Code-Abfrage.
// ------------------------------------------------------------------

const MFA_COOKIE_NAME = "cockpit_mfa";
const MFA_TTL_SECONDS = 5 * 60;

export type MfaMode = "verify" | "setup";

interface MfaPayload {
  userId: string;
  mode: MfaMode;
  exp: number;
}

export async function createMfaCookie(userId: string, mode: MfaMode): Promise<void> {
  const body = Buffer.from(
    JSON.stringify({ userId, mode, exp: Math.floor(Date.now() / 1000) + MFA_TTL_SECONDS }),
  ).toString("base64url");
  const store = await cookies();
  store.set(MFA_COOKIE_NAME, `${body}.${sign(`mfa.${body}`)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: MFA_TTL_SECONDS,
  });
}

export async function readMfaCookie(): Promise<MfaPayload | null> {
  const store = await cookies();
  const token = store.get(MFA_COOKIE_NAME)?.value;
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(`mfa.${body}`);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as MfaPayload;
    if (
      typeof payload.userId !== "string" ||
      (payload.mode !== "verify" && payload.mode !== "setup")
    )
      return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function destroyMfaCookie(): Promise<void> {
  const store = await cookies();
  store.delete(MFA_COOKIE_NAME);
}

/** Aktueller Benutzer inkl. Rollen; pro Request gecacht. Null = nicht angemeldet. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = decodeSession(token);
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user || !user.active) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    locale: user.locale,
    roles: user.roles.map((r) => r.role.key as RoleKey),
  };
});
