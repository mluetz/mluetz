"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import {
  createMfaCookie,
  createSessionCookie,
  destroyMfaCookie,
  destroySessionCookie,
  getSessionUser,
  readMfaCookie,
} from "@/lib/auth/session";
import {
  consumeRecoveryCode,
  generateRecoveryCodes,
  isLoginThrottled,
  recordLoginAttempt,
  requiresMfa,
  storeRecoveryCodes,
} from "@/lib/auth/mfa";
import { generateTotpSecret, totpUri, verifyTotp } from "@/lib/auth/totp";
import type { RoleKey } from "@/lib/domain/enums";

/**
 * Demo-Login (nur Entwicklungsumgebung, AUTH_DEMO_LOGIN=true).
 * Produktion: OIDC/Entra ID über die vorbereitete Auth-Abstraktion (ADR-0003).
 *
 * Login-Drossel: persistent in der DB (LoginAttempt), max. 10 Fehlversuche
 * je E-Mail in 15 Minuten — übersteht Container-Neustarts (Review v3, S-02).
 *
 * MFA (TOTP): Für Rollen aus MFA_REQUIRED_ROLES (Default ADMIN, ISO,
 * SECOND_LINE) wird nach der Passwortprüfung KEINE Session erstellt,
 * sondern ein 5-Minuten-Pre-Auth-Cookie; die Session entsteht erst nach
 * gültigem TOTP- oder Wiederherstellungscode. Nicht eingerichtetes MFA
 * wird beim Login erzwungen (Setup-Flow).
 */

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export interface LoginState {
  error?: string;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (process.env.AUTH_DEMO_LOGIN !== "true") {
    return { error: "Demo-Login ist deaktiviert. Bitte Enterprise-SSO verwenden." };
  }
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Bitte E-Mail und Passwort angeben." };

  const email = parsed.data.email.toLowerCase().trim();
  if (await isLoginThrottled(email)) {
    await audit({
      userEmail: email,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: email,
      comment: "Rate Limit erreicht",
    });
    return { error: "Zu viele Anmeldeversuche. Bitte später erneut versuchen." };
  }

  const user = await db.user.findUnique({
    where: { email },
    include: { roles: { include: { role: true } } },
  });
  const ok = user && user.active && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!ok) {
    await recordLoginAttempt(email, false);
    await audit({
      userEmail: email,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user?.id ?? email,
    });
    return { error: "Anmeldung fehlgeschlagen. E-Mail oder Passwort ist falsch." };
  }

  await recordLoginAttempt(email, true);

  const roles = user.roles.map((r) => r.role.key as RoleKey);
  if (requiresMfa(roles)) {
    await createMfaCookie(user.id, user.mfaEnabledAt ? "verify" : "setup");
    redirect("/login/mfa");
  }

  await createSessionCookie(user.id);
  await audit({
    userId: user.id,
    userEmail: user.email,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
  });
  redirect("/overview");
}

// ------------------------------------------------------------------
// MFA: Setup-Kontext laden, Einrichtung abschließen, Code prüfen
// ------------------------------------------------------------------

export interface MfaContext {
  mode: "verify" | "setup";
  email: string;
  /** Nur im Setup-Modus gefüllt. */
  secret?: string;
  otpauthUri?: string;
}

/** Kontext für die MFA-Seite; legt im Setup-Modus bei Bedarf ein Secret an. */
export async function getMfaContext(): Promise<MfaContext | null> {
  const pre = await readMfaCookie();
  if (!pre) return null;
  const user = await db.user.findUnique({ where: { id: pre.userId } });
  if (!user || !user.active) return null;

  if (pre.mode === "setup") {
    let secret = user.mfaEnabledAt ? null : user.mfaSecret;
    if (!secret) {
      secret = generateTotpSecret();
      await db.user.update({ where: { id: user.id }, data: { mfaSecret: secret } });
    }
    return {
      mode: "setup",
      email: user.email,
      secret,
      otpauthUri: totpUri(secret, user.email, "ICT & TPRM Cockpit"),
    };
  }
  return { mode: "verify", email: user.email };
}

export interface MfaState {
  error?: string;
  /** Nach erfolgreichem Setup einmalig angezeigte Wiederherstellungscodes. */
  recoveryCodes?: string[];
}

const mfaSchema = z.object({ code: z.string().min(6).max(20) });

export async function verifyMfa(_prev: MfaState, formData: FormData): Promise<MfaState> {
  const pre = await readMfaCookie();
  if (!pre) return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  const parsed = mfaSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: "Bitte einen gültigen Code eingeben." };

  const user = await db.user.findUnique({ where: { id: pre.userId } });
  if (!user || !user.active || !user.mfaSecret) {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const code = parsed.data.code.trim();
  let valid = verifyTotp(user.mfaSecret, code);
  let viaRecovery = false;
  if (!valid && pre.mode === "verify" && code.length >= 10) {
    valid = await consumeRecoveryCode(user.id, code);
    viaRecovery = valid;
  }
  if (!valid) {
    await recordLoginAttempt(user.email, false);
    await audit({
      userEmail: user.email,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user.id,
      comment: "MFA-Code ungültig",
    });
    return { error: "Code ungültig. Bitte erneut versuchen." };
  }

  let recoveryCodes: string[] | undefined;
  if (pre.mode === "setup") {
    recoveryCodes = generateRecoveryCodes();
    await storeRecoveryCodes(user.id, recoveryCodes);
    await db.user.update({ where: { id: user.id }, data: { mfaEnabledAt: new Date() } });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "MFA_ENROLL",
      entityType: "User",
      entityId: user.id,
      comment: "TOTP eingerichtet, Wiederherstellungscodes erzeugt",
    });
  }

  await destroyMfaCookie();
  await createSessionCookie(user.id);
  await audit({
    userId: user.id,
    userEmail: user.email,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    comment: viaRecovery ? "Anmeldung mit Wiederherstellungscode" : "Anmeldung mit MFA",
  });

  if (recoveryCodes) return { recoveryCodes };
  redirect("/overview");
}

/** Nach Anzeige der Wiederherstellungscodes weiter in die Anwendung. */
export async function continueAfterEnroll(): Promise<void> {
  redirect("/overview");
}

export async function logout(): Promise<void> {
  const user = await getSessionUser();
  if (user) {
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "LOGOUT",
      entityType: "User",
      entityId: user.id,
    });
  }
  await destroySessionCookie();
  redirect("/login");
}
