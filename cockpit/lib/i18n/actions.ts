"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Setzt die UI-Sprache. Kein HttpOnly (reine Anzeige-Präferenz ohne
 * Personenbezug); ein Jahr gültig. Die aufrufende Komponente refresht
 * anschließend die aktuelle Route (router.refresh()).
 *
 * Persistenz pro Benutzer (Redesign Welle 4, D-15/7.6): Angemeldete
 * Benutzer erhalten die Sprachwahl zusätzlich im Profil (User.locale),
 * damit Berichte in der gewählten Sprache erzeugt werden und die Wahl
 * geräteübergreifend gilt.
 */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  const user = await getSessionUser();
  if (user && user.locale !== locale) {
    await db.user.update({ where: { id: user.id }, data: { locale } });
  }
}
