/**
 * Zweisprachigkeit des Cockpits (Deutsch/Englisch).
 *
 * Die Sprache wird als HttpOnly-freier Cookie gehalten (kein Personenbezug,
 * reine UI-Präferenz) und serverseitig gelesen – alle Seiten sind
 * force-dynamic, daher ist keine Middleware/Routing-Lokalisierung nötig.
 * Standard ist Deutsch; die Demo-/Seed-Daten (Risiken, Katalogtexte,
 * Runbook-Inhalte) bleiben bewusst einsprachig deutsch.
 */

export type Locale = "de" | "en";

export const LOCALES: readonly Locale[] = ["de", "en"] as const;

export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_COOKIE = "cockpit.locale";

export function isLocale(value: unknown): value is Locale {
  return value === "de" || value === "en";
}
