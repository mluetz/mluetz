import { describe, expect, it } from "vitest";
import { shouldUseSecureCookie } from "@/lib/auth/cookie-policy";

/**
 * Regressionstests: Ein Secure-Cookie wird über HTTP vom Browser verworfen –
 * die Anmeldung liefe dann in eine Endlosschleife zur Login-Seite.
 */
describe("shouldUseSecureCookie", () => {
  it("respektiert die explizite Vorgabe", () => {
    expect(shouldUseSecureCookie({ SESSION_COOKIE_SECURE: "true", NODE_ENV: "development" })).toBe(true);
    expect(
      shouldUseSecureCookie({
        SESSION_COOKIE_SECURE: "false",
        NODE_ENV: "production",
        APP_BASE_URL: "https://example.internal",
      }),
    ).toBe(false);
    expect(shouldUseSecureCookie({ SESSION_COOKIE_SECURE: "TRUE " })).toBe(true);
  });

  it("leitet das Flag aus APP_BASE_URL ab", () => {
    // LAN-Betrieb über HTTP (z. B. Synology NAS): kein Secure-Flag
    expect(
      shouldUseSecureCookie({ NODE_ENV: "production", APP_BASE_URL: "http://192.168.178.97:3001" }),
    ).toBe(false);
    // Hinter HTTPS-Reverse-Proxy: Secure-Flag aktiv
    expect(
      shouldUseSecureCookie({ NODE_ENV: "production", APP_BASE_URL: "https://192.168.178.97:8443" }),
    ).toBe(true);
  });

  it("fällt ohne Angaben auf den Produktionsmodus zurück", () => {
    expect(shouldUseSecureCookie({ NODE_ENV: "production" })).toBe(true);
    expect(shouldUseSecureCookie({ NODE_ENV: "development" })).toBe(false);
    expect(shouldUseSecureCookie({})).toBe(false);
  });
});
