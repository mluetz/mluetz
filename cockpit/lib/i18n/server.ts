import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";
import { getSessionUser } from "@/lib/auth/session";

/**
 * UI-Sprache: Cookie hat Vorrang (Gerätewahl), sonst die im Benutzerprofil
 * persistierte Sprache (Redesign Welle 4, 7.6), sonst Standard.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(value)) return value;
  const user = await getSessionUser().catch(() => null);
  if (user && isLocale(user.locale)) return user.locale;
  return DEFAULT_LOCALE;
}
