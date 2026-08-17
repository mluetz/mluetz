"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createSessionCookie, destroySessionCookie, getSessionUser } from "@/lib/auth/session";

/**
 * Demo-Login (nur Entwicklungsumgebung, AUTH_DEMO_LOGIN=true).
 * Produktion: OIDC/Entra ID über die vorbereitete Auth-Abstraktion (ADR-0003).
 * Rate Limiting: max. 10 Versuche pro E-Mail in 15 Minuten (In-Memory;
 * in produktiven Mehrinstanz-Setups durch zentralen Store ersetzen).
 */

const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

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
  if (rateLimited(email)) {
    await audit({
      userEmail: email,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: email,
      comment: "Rate Limit erreicht",
    });
    return { error: "Zu viele Anmeldeversuche. Bitte später erneut versuchen." };
  }

  const user = await db.user.findUnique({ where: { email } });
  const ok = user && user.active && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!ok) {
    await audit({
      userEmail: email,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user?.id ?? email,
    });
    return { error: "Anmeldung fehlgeschlagen. E-Mail oder Passwort ist falsch." };
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
