import type { Locale } from "@/lib/i18n/config";

/**
 * Übersetzungen der App-Shell (Sidebar, Header, Login).
 * Muster für alle Modul-Wörterbücher: ein Objekt je Sprache, identische
 * Schlüsselstruktur; `de` ist die Referenz, `en` wird über den Typ erzwungen.
 */

const de = {
  nav: {
    overview: "Overview",
    risks: "Risks",
    actions: "Actions",
    controls: "Controls",
    thirdParties: "Third Parties",
    assessments: "Assessments",
    runbooks: "Runbooks",
    playbooks: "Playbooks",
    evidence: "Evidence",
    reports: "Reports",
    governance: "Governance",
    doraCompliance: "DORA Compliance",
    doraKnowledge: "DORA Wissensbasis",
    marketComparison: "Marktvergleich",
    auditTrail: "Audit Trail",
    admin: "Administration",
  },
  header: {
    demoBanner: "Demo-Umgebung – ausschließlich synthetische Daten. Kein freigegebenes GRC-System.",
    logout: "Abmelden",
  },
  brand: {
    subtitle: "Risk Cockpit",
  },
  login: {
    title: "ICT & TPRM Cockpit",
    subtitle: "Informationssicherheits-, ICT- und Third-Party-Risikomanagement",
    demoNote:
      "Demo-Umgebung mit ausschließlich synthetischen Daten. Demo-Zugänge: siehe README (z. B. riskmanager@demo.example).",
    cardTitle: "Anmeldung",
    email: "E-Mail",
    password: "Passwort",
    submit: "Anmelden",
    submitting: "Anmeldung läuft…",
    failed: "Anmeldung fehlgeschlagen. E-Mail oder Passwort ist falsch.",
    ssoNote:
      "Der lokale Demo-Login ist deaktiviert. In produktiven Umgebungen erfolgt die Anmeldung über das Enterprise-SSO (OIDC / Microsoft Entra ID) – siehe Betriebsdokumentation.",
  },
};

const en: typeof de = {
  nav: {
    overview: "Overview",
    risks: "Risks",
    actions: "Actions",
    controls: "Controls",
    thirdParties: "Third Parties",
    assessments: "Assessments",
    runbooks: "Runbooks",
    playbooks: "Playbooks",
    evidence: "Evidence",
    reports: "Reports",
    governance: "Governance",
    doraCompliance: "DORA Compliance",
    doraKnowledge: "DORA Knowledge Base",
    marketComparison: "Market Comparison",
    auditTrail: "Audit Trail",
    admin: "Administration",
  },
  header: {
    demoBanner: "Demo environment – synthetic data only. Not an approved GRC system.",
    logout: "Sign out",
  },
  brand: {
    subtitle: "Risk Cockpit",
  },
  login: {
    title: "ICT & TPRM Cockpit",
    subtitle: "Information security, ICT and third-party risk management",
    demoNote:
      "Demo environment with synthetic data only. Demo accounts: see README (e.g. riskmanager@demo.example).",
    cardTitle: "Sign in",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in…",
    failed: "Sign-in failed. Email or password is incorrect.",
    ssoNote:
      "Local demo login is disabled. In production environments, sign-in is handled via enterprise SSO (OIDC / Microsoft Entra ID) – see the operations documentation.",
  },
};

export const CHROME_MESSAGES: Record<Locale, typeof de> = { de, en };
