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
  await page
    .getByRole("link", { name: /Über Risikoappetit/ })
    .first()
    .click();
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
  await expect(
    page.getByText("IKT-Risikomanagementrahmen", { exact: false }).first(),
  ).toBeVisible();
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

test("DORA Handbuch: Kapitelübersicht, Detailseite mit Abbildung und Navigation", async ({
  page,
}) => {
  await login(page, "riskmanager@demo.example");
  await page.goto("/dora-knowledge");

  // Handbuch-Übersicht mit Kapitelkarten; Kap. 9 verweist auf den Katalog
  await expect(page.getByText("Das vollständige Handbuch (FRWK-DORA-001)")).toBeVisible();
  await expect(page.getByText("Anforderungskatalog – als interaktives Modul")).toBeVisible();

  // Detailseite Kap. 11 öffnen: Abbildung 9 und Reifegradskala sichtbar.
  // Klick mit Retry, bis die React-Hydration die Navigation angebunden hat.
  await expect(async () => {
    await page.getByRole("link", { name: /Reifegrad- und Scoring-Modell/ }).click();
    await page.waitForURL("**/dora-knowledge/reifegrad-scoring", { timeout: 2000 });
  }).toPass({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: /Kap\. 11/ })).toBeVisible();
  await expect(page.getByAltText(/Abbildung 9:/)).toBeVisible();
  await expect(page.getByText("Tabelle 21: Reifegradskala mit Nachweisanforderung")).toBeVisible();

  // Kapitelnavigation zum nächsten Kapitel (Kap. 12)
  await page
    .getByRole("navigation", { name: "Kapitelnavigation" })
    .getByRole("link", { name: /Findings/ })
    .click();
  await expect(page.getByRole("heading", { name: /Kap\. 12/ })).toBeVisible();
});

test("Sprachumschaltung: EN-Oberfläche, englisches Handbuch mit Figure, zurück zu DE", async ({
  page,
}) => {
  await login(page, "riskmanager@demo.example");

  // Auf Englisch umschalten (Umschalter im Header)
  const toggle = page.getByRole("group", { name: "Sprache wählen" });
  await toggle.getByRole("button").nth(1).click();
  await expect(
    page.getByLabel("Hauptnavigation").getByRole("link", { name: "DORA Knowledge Base" }),
  ).toBeVisible();

  // Wissensbasis auf Englisch: Überschrift, Säulen-Inhalt, Handbuch-Karten
  await page.goto("/dora-knowledge");
  await expect(page.getByRole("heading", { name: "DORA ISRM Knowledge Base" })).toBeVisible();
  await expect(page.getByText("The complete handbook (FRWK-DORA-001)")).toBeVisible();

  // Handbuch-Detail: englischer Titel und englische SVG-Abbildung
  await page.getByRole("link", { name: /Maturity and scoring model|Maturity & scoring/i }).click();
  await expect(page.getByRole("heading", { name: /Ch\. 11/ })).toBeVisible();
  await expect(page.getByAltText(/Figure 9:/)).toBeVisible();

  // Glossar-Modal auf Englisch
  await expect(async () => {
    await page.getByRole("button", { name: "evidence lock", exact: true }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();

  // Zurück auf Deutsch
  const toggleEn = page.getByRole("group", { name: "Select language" });
  await toggleEn.getByRole("button").first().click();
  await expect(
    page.getByLabel("Hauptnavigation").getByRole("link", { name: "DORA Wissensbasis" }),
  ).toBeVisible();
});

test("DORA Compliance: Dashboard, Katalog mit Knockouts und Meldefristen-Monitor", async ({
  page,
}) => {
  await login(page, "iso@demo.example");

  // Dashboard: Index- und Knockout-Kachel
  await page.goto("/dora");
  await expect(page.getByText("DORA Resilience Index").first()).toBeVisible();
  await expect(page.getByText("Offene Knockouts").first()).toBeVisible();

  // Katalog: Filter auf offene Knockouts → DORA-K5-011 sichtbar
  await page.goto("/dora/requirements?openKnockouts=1");
  await expect(page.getByText("DORA-K5-011").first()).toBeVisible();

  // Anforderungsdetail: Crosswalk und Bewertung.
  // Klick mit Retry, bis die React-Hydration die Navigation angebunden hat.
  await expect(async () => {
    await page.getByRole("link", { name: "DORA-K5-011" }).first().click();
    await page.waitForURL("**/dora/requirements/*", { timeout: 2000 });
  }).toPass({ timeout: 15000 });
  await expect(page.getByText(/Ausstiegsstrategien/).first()).toBeVisible();
  await expect(page.getByText(/ISO\/IEC 27001/).first()).toBeVisible();

  // Vorfall mit laufenden Fristen
  await page.goto("/dora/incidents");
  await expect(page.getByText("INC-2026-0001").first()).toBeVisible();
  // Klick mit Retry, bis die React-Hydration die Navigation angebunden hat.
  await expect(async () => {
    await page.getByRole("link", { name: "INC-2026-0001" }).first().click();
    await page.waitForURL("**/dora/incidents/*", { timeout: 2000 });
  }).toPass({ timeout: 15000 });
  await expect(page.getByText("DORA-Zwischenmeldung", { exact: false }).first()).toBeVisible();
});

test("Marktvergleich: Menüpunkt und Analyse-Seite mit Quellen-Hinweis", async ({ page }) => {
  await login(page, "riskmanager@demo.example");
  await page.getByLabel("Hauptnavigation").getByRole("link", { name: "Marktvergleich" }).click();
  await expect(
    page.getByRole("heading", { name: "ODDO BHF im Privatbanken-Vergleich" }),
  ).toBeVisible();
  // Kennzeichnung als öffentliche Marktinformation (keine Demo-Daten)
  await expect(page.getByText(/keine synthetischen Demo-Daten/)).toBeVisible();
  // Kernelemente der Analyse
  await expect(page.getByText("Management Summary")).toBeVisible();
  await expect(page.getByText("Kennzahlenvergleich Geschäftsjahr 2025")).toBeVisible();
  await expect(page.getByText("Quellen und Methodik")).toBeVisible();
});
