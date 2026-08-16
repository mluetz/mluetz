import { expect, test } from "@playwright/test";

/**
 * End-to-End-Smoke-Tests der Kernprozesse.
 * Voraussetzung: Seed-Daten (npm run db:reset), AUTH_DEMO_LOGIN=true.
 */

const PASSWORD = "Demo!2026";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL("**/overview");
}

test("Login-Seite erreichbar und Fehlermeldung bei falschen Zugangsdaten", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "ICT & TPRM Cockpit" })).toBeVisible();
  await page.getByLabel("E-Mail").fill("riskmanager@demo.example");
  await page.getByLabel("Passwort").fill("falsches-passwort");
  await page.getByRole("button", { name: "Anmelden" }).click();
  // Nicht getByRole("alert"): Der Next.js-Route-Announcer trägt ebenfalls role="alert".
  await expect(page.getByText(/Anmeldung fehlgeschlagen/)).toBeVisible();
});

test("ICT Risk Manager: Dashboard, Risk Register und Detailseite", async ({ page }) => {
  await login(page, "riskmanager@demo.example");
  await expect(page.getByRole("heading", { name: "Executive Dashboard" })).toBeVisible();
  await expect(page.getByText("Offene Risiken")).toBeVisible();

  // KPI-Kachel führt zum gefilterten Register
  await page.getByRole("link", { name: /Über Risikoappetit/ }).first().click();
  await page.waitForURL("**/risks?aboveAppetite=1");
  await expect(page.getByRole("heading", { name: "Risk Register" })).toBeVisible();

  // Detailseite eines Risikos öffnen
  await page.goto("/risks");
  await page.getByRole("link", { name: "RISK-2026-0001" }).click();
  await expect(page.getByText("Inherent Risk")).toBeVisible();
  await expect(page.getByRole("tab", { name: /Bewertung/ })).toBeVisible();
});

test("RBAC: Auditor sieht Audit Trail, aber keine Administration", async ({ page }) => {
  await login(page, "auditor@demo.example");
  await expect(page.getByRole("link", { name: "Audit Trail" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Administration" })).toHaveCount(0);
  // Direktaufruf der Admin-Seite wird abgewiesen
  await page.goto("/admin");
  await expect(page).toHaveURL(/forbidden/);
});

test("Runbooks sind gelistet und Runbook-Detail zeigt Schritte", async ({ page }) => {
  await login(page, "riskmanager@demo.example");
  await page.goto("/runbooks");
  await expect(page.getByText("RB-01")).toBeVisible();
  await page.getByText("RB-03").first().click();
  await expect(page.getByText(/Quality Review/i).first()).toBeVisible();
});

test("Management: Reports erreichbar, Entscheidungsvorlage rendert", async ({ page }) => {
  await login(page, "management@demo.example");
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  await page.goto("/reports/DECISION_PAPER");
  await expect(page.getByText(/Stichtag/)).toBeVisible();
});

test("DORA Wissensbasis: Akkordeon und Begriffs-Modal funktionieren", async ({ page }) => {
  await login(page, "riskmanager@demo.example");
  await page.goto("/dora-knowledge");
  await expect(page.getByRole("heading", { name: "DORA ISRM Wissensbasis" })).toBeVisible();

  // Säule 1 ist initial geöffnet und enthält klickbare Fachbegriffe.
  // Klick mit Retry, bis die React-Hydration die Handler angebunden hat.
  await expect(page.getByText("IKT-Risikomanagementrahmen", { exact: false }).first()).toBeVisible();
  await expect(async () => {
    await page.getByRole("button", { name: "Leitungsorgan", exact: true }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Vorstand");
  await dialog.getByRole("button", { name: "Schließen" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Andere Säule aufklappen (Drittparteien) und dort einen Begriff öffnen
  await page.getByRole("button", { name: /Management des IKT-Drittparteienrisikos/ }).click();
  await page.getByRole("button", { name: "CTPP", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Critical Third-Party Provider");
});
