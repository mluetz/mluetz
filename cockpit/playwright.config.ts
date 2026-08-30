import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  // Gemeinsame SQLite-Demo-DB und benutzerbezogene Zustände (z. B.
  // persistierte Sprachwahl) vertragen keine parallelen Worker.
  workers: 1,
  use: {
    baseURL: process.env.APP_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    // In Umgebungen mit vorinstalliertem Chromium (PLAYWRIGHT_CHROMIUM_PATH)
    // wird dieser Browser genutzt statt eines Downloads.
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // E2E-Smoke-Tests laufen ohne MFA-Abfrage; der MFA-Flow selbst wird
      // durch Unit-Tests (totp.test.ts) und manuell abgedeckt.
      MFA_REQUIRED_ROLES: "none",
    },
  },
});
