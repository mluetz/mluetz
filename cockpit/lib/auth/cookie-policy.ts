/**
 * Cookie-Richtlinie der Session (bewusst ohne "server-only", damit sie
 * isoliert testbar ist – verwendet wird sie ausschließlich serverseitig).
 *
 * Soll das Session-Cookie das Secure-Flag tragen?
 *
 * Wichtig: Ein Secure-Cookie wird vom Browser über eine reine HTTP-Verbindung
 * verworfen – die Anmeldung wäre dann wirkungslos (Endlosschleife zur
 * Login-Seite). Deshalb richtet sich das Flag nach dem tatsächlichen Protokoll:
 *
 *   1. SESSION_COOKIE_SECURE ("true"/"false") hat immer Vorrang
 *   2. sonst: aus APP_BASE_URL abgeleitet (https → true, http → false)
 *   3. sonst: Produktionsmodus → true
 *
 * Beim Betrieb hinter einem HTTPS-Reverse-Proxy (siehe
 * docs/operations/synology.md) genügt es, APP_BASE_URL auf die https-URL zu
 * setzen; das Cookie wird dann automatisch wieder als Secure ausgeliefert.
 */
export interface CookieEnv {
  SESSION_COOKIE_SECURE?: string;
  APP_BASE_URL?: string;
  NODE_ENV?: string;
}

export function shouldUseSecureCookie(env: CookieEnv = process.env): boolean {
  const explicit = env.SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if (explicit === "true") return true;
  if (explicit === "false") return false;

  const baseUrl = env.APP_BASE_URL?.trim();
  if (baseUrl) return baseUrl.toLowerCase().startsWith("https://");

  return env.NODE_ENV === "production";
}
