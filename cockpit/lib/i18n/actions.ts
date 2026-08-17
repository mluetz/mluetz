"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

/**
 * Setzt die UI-Sprache. Kein HttpOnly (reine Anzeige-Präferenz ohne
 * Personenbezug); ein Jahr gültig. Die aufrufende Komponente refresht
 * anschließend die aktuelle Route (router.refresh()).
 */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
