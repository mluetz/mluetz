/**
 * DORA-Seed (FRWK-DORA-001): Katalog, Demo-Bewertungen, Findings, Vorfälle.
 *
 * Bewusst Plain-JS (ESM) und idempotent, damit derselbe Code
 *  a) aus prisma/seed.ts (frische Demo-Datenbank) und
 *  b) aus scripts/seed-dora.mjs im Container-Entrypoint (Update einer
 *     bestehenden Installation, z. B. Synology) laufen kann.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const catalog = require("../lib/content/dora-catalog.json");

/** Kuratierte Verwebung Anforderung → Runbooks/Playbooks (Default je Kapitel + Overrides). */
const PROCESS_DEFAULTS = {
  K2: "RB-01,RB-02",
  K3: "RB-21",
  K4: "RB-07",
  K5: "RB-09,RB-11",
  K6: "RB-23",
};
const PROCESS_OVERRIDES = {
  "DORA-K2-004": "RB-18,PB-01",
  "DORA-K2-017": "RB-05,PB-03",
  "DORA-K2-023": "RB-10",
  "DORA-K2-041": "PB-05",
  "DORA-K2-051": "RB-02,PB-13",
  "DORA-K2-052": "RB-02",
  "DORA-K3-009": "RB-21,PB-06",
  "DORA-K3-010": "RB-21",
  "DORA-K3-011": "RB-21",
  "DORA-K3-012": "RB-21",
  "DORA-K3-014": "RB-21",
  "DORA-K3-020": "RB-21",
  "DORA-K4-005": "RB-05,PB-10",
  "DORA-K4-009": "RB-07,PB-10",
  "DORA-K4-011": "PB-16",
  "DORA-K5-003": "RB-22",
  "DORA-K5-004": "RB-22",
  "DORA-K5-005": "RB-22,RB-14",
  "DORA-K5-011": "RB-13,PB-07",
  "DORA-K5-012": "RB-12,PB-08",
  "DORA-K5-013": "PB-16",
  "DORA-K5-025": "RB-13,PB-07",
  "DORA-K5-028": "PB-04",
  "DORA-K6-006": "RB-23,PB-14",
  "DORA-K2-059": "PB-17",
};

/**
 * Demo-Reifegradprofil (deterministisch): ergibt die Ziel-Lage des Dokuments –
 * Kap. III grün, Kap. II/VI gelb, Kap. IV und V rot wegen offener Knockouts.
 * maturity: Roh-Reifegrad; evidenced: Nachweis vorhanden und geprüft.
 */
const MATURITY_OVERRIDES = {
  "DORA-K5-011": { maturity: 2, evidenced: true }, // Exit-Strategien fehlen → Knockout (Bezug: TP-006/TP-002)
  "DORA-K5-004": { maturity: 2, evidenced: true }, // Registereinreichung mit Validierungsfehlern → Knockout
  "DORA-K4-006": { maturity: 2, evidenced: true }, // Jahrestest Ausweich-RZ verschoben → Knockout (Bezug RISK-2026-0017)
  "DORA-K2-059": { maturity: 4, evidenced: false }, // Showcase Nachweissperre: 4 bewertet, ohne Nachweis wirksam 2
  "DORA-K2-053": { maturity: 3, evidenced: false }, // Showcase Nachweissperre
  "DORA-K3-010": { maturity: 5, evidenced: true },
  "DORA-K3-007": { maturity: 4, evidenced: true },
};

/** Basisprofil je Kapitel: [Muster der Reifegrade] – zyklisch über die Anforderungen gelegt. */
const CHAPTER_PATTERNS = {
  K2: [4, 3, 4, 3, 3, 4, 2, 3, 4, 3, 5, 3, 2, 4, 3],
  K3: [5, 4, 5, 4, 5, 4, 4, 5, 4, 5, 5],
  K4: [4, 3, 3, 4, 3, 2, 4, 3],
  K5: [4, 3, 3, 4, 2, 3, 4, 3, 3, 2],
  K6: [3, 3, 2, 3, 3, 2],
};

function profileFor(req, index) {
  const override = MATURITY_OVERRIDES[req.reqId];
  if (override) return override;
  const pattern = CHAPTER_PATTERNS[req.chapter] ?? [3];
  const maturity = pattern[index % pattern.length];
  // Reifegrade >= 3 sind (bis auf die Showcases oben) mit Nachweis belegt
  return { maturity, evidenced: maturity >= 3 };
}

const NEW_RUNBOOKS = [
  {
    code: "RB-21",
    title: "Schwerwiegenden IKT-Vorfall klassifizieren und melden",
    purpose:
      "Fristgerechte Klassifizierung (Art. 18) und Meldung (Art. 19) schwerwiegender IKT-Vorfälle an die Aufsicht – 4 h/24 h, 72 h, 1 Monat – inkl. paralleler Prüfung NIS-2 und DSGVO.",
    scope: "Alle IKT-bezogenen Vorfälle mit möglicher Wesentlichkeit.",
    trigger:
      "Kenntniserlangung von einem IKT-Vorfall mit potenzieller Auswirkung auf kritische Dienste.",
    prerequisites:
      "Klassifizierungslogik nach DelVO (EU) 2024/1772 operationalisiert; MVP-Portal-Zugang; Bereitschaftsorganisation.",
    input:
      "Vorfallsdaten (Kenntniszeitpunkt, betroffene Dienste, Kundenzahl, Datenverlust, wirtschaftliche Auswirkung).",
    roles:
      "Durchführung: Information Security Officer (SOC); Meldung/Fristen: ICT Risk Manager; Parallelprüfung: Compliance; Kundeninformation: Kommunikation.",
    sla: "Klassifizierung unverzüglich; Erstmeldung ≤ 4 h nach Klassifizierung, absolut ≤ 24 h nach Kenntnis; Zwischenmeldung ≤ 72 h; Abschluss ≤ 1 Monat.",
    escalation:
      "Fristgefährdung → sofortige Eskalation an Management; Meldefristen-Monitor im Cockpit überwacht automatisch.",
    output:
      "Klassifizierungsprotokoll, fristgerechte Meldungen (MVP-Portal), Vorfallsregister-Eintrag, Rücklauf ins Risikoregister (RB-02).",
    kpi: "Meldefristentreue 100 % (KPI-K3-01); Zeit Kenntnis→Klassifizierung.",
    controlPoints:
      "Vier-Augen-Prinzip vor Absendung; Zeitstempel Kenntnis/Klassifizierung/Meldung im Audit Trail.",
    reviewCycle: "Halbjährlich (inkl. Übung)",
    steps: [
      {
        title: "Vorfall erfassen und Kenntniszeitpunkt festhalten",
        description:
          "Vorfall im Cockpit anlegen; Kenntniserlangung dokumentieren – sie startet alle Fristen.",
        role: "Information Security Officer",
      },
      {
        title: "Klassifizierung nach den 7 Kriterien",
        description:
          "Betroffene Kunden/Transaktionen, Dauer, geografische Ausbreitung, Datenverluste, Kritikalität, wirtschaftliche Auswirkungen bewerten; Schwellen der DelVO 2024/1772 anwenden.",
        role: "Information Security Officer",
        decision: true,
        evidence: "Klassifizierungsprotokoll",
      },
      {
        title: "Parallele Pflichtenstränge prüfen",
        description:
          "DSGVO Art. 33 (Datenschutzbeauftragter) und NIS-2/BSIG-Relevanz prüfen und Prüfentscheidung dokumentieren – auch bei Verneinung.",
        role: "Reviewer / Second Line",
        decision: true,
      },
      {
        title: "Erstmeldung absetzen",
        description:
          "Harmonisiertes Formular (DfVO 2025/302) befüllen und über das MVP-Portal einreichen; Zeitstempel sichern.",
        role: "ICT Risk Manager",
        evidence: "Einreichungsbestätigung",
      },
      {
        title: "Kundeninformation prüfen",
        description:
          "Bei Berührung finanzieller Kundeninteressen unverzügliche Information der Kunden (Art. 19 Abs. 3) veranlassen.",
        role: "Management",
        decision: true,
      },
      {
        title: "Zwischen- und Abschlussmeldung steuern",
        description:
          "Fristen im Meldefristen-Monitor verfolgen; Zwischenmeldung ≤ 72 h, Abschlussmeldung mit Root-Cause-Analyse ≤ 1 Monat.",
        role: "ICT Risk Manager",
        evidence: "Meldeverzeichnis vollständig",
      },
      {
        title: "Lessons Learned ins Risikoregister",
        description:
          "Erkenntnisse nach Art. 13 Abs. 2 in Risikobewertungen und Maßnahmen überführen (RB-02).",
        role: "ICT Risk Manager",
      },
    ],
  },
  {
    code: "RB-22",
    title: "Informationsregister jährlich einreichen",
    purpose:
      "Vollständige, validierungsfeste jährliche Einreichung des Informationsregisters nach Art. 28 Abs. 3 (ITS (EU) 2024/2956) an die Aufsicht.",
    scope:
      "Alle vertraglichen Vereinbarungen über IKT-Dienstleistungen, einschließlich Subunternehmerketten.",
    trigger:
      "Jährlicher Einreichungstermin der Aufsicht; anlassbezogen bei wesentlichen Änderungen.",
    prerequisites:
      "Drittparteien-Register vollständig (RB-09/RB-11); Datenqualität geprüft (RB-14).",
    input: "Third-Party-Register, Verträge, Subdienstleister, Datenstandorte, CIF-Zuordnungen.",
    roles:
      "Durchführung: Third Party Risk Manager; Datenqualität: ICT Risk Manager; Freigabe: Management.",
    sla: "Einreichung fristgerecht zum aufsichtlichen Stichtag; interne Validierung 10 Arbeitstage vorher abgeschlossen.",
    escalation:
      "Validierungsfehler der ESAs → Bereinigung binnen der behördlichen Frist; Eskalation an Management bei Fristgefahr.",
    output:
      "Eingereichtes Register (xBRL/Excel über MVP-Portal), Validierungsprotokoll, Einreichungsbestätigung.",
    kpi: "Vollständigkeit des Registers 100 % (KPI-K5-01); Validierungsfehlerquote.",
    controlPoints:
      "Vier-Augen-Freigabe vor Einreichung; Abgleich Registerdaten ↔ Vertragsverzeichnis.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Registerdaten aktualisieren",
        description:
          "Alle Verträge, Leistungs- und Datenstandorte, Subdienstleister und CIF-Kennzeichnungen im Third-Party-Register auf Stand bringen.",
        role: "Third Party Risk Manager",
      },
      {
        title: "Vollständigkeit prüfen",
        description:
          "Pflichtfelder nach ITS 2024/2956 je Vertrag prüfen; Lücken mit Ownern schließen (RB-14).",
        role: "Third Party Risk Manager",
        evidence: "Vollständigkeitsprüfung",
      },
      {
        title: "Validierungslauf durchführen",
        description:
          "Export erzeugen und gegen die Validierungsregeln der ESAs prüfen; Fehler bereinigen.",
        role: "ICT Risk Manager",
        evidence: "Validierungsprotokoll",
      },
      {
        title: "Freigabe einholen",
        description: "Vier-Augen-Freigabe des Exports durch Management dokumentieren.",
        role: "Management",
        decision: true,
      },
      {
        title: "Einreichen und archivieren",
        description:
          "Über das MVP-Portal einreichen; Bestätigung revisionssicher im Evidence-Register ablegen.",
        role: "Third Party Risk Manager",
        evidence: "Einreichungsbestätigung",
      },
    ],
  },
  {
    code: "RB-23",
    title: "Threat-Intelligence-Alert abgleichen (Time to Assess)",
    purpose:
      "Systematische Übersetzung externer Bedrohungsinformationen in interne Betroffenheitsanalysen und Maßnahmen (Art. 45 i. V. m. Art. 13).",
    scope: "Alle eingehenden Advisories aus Sharing-Communities, CERTs und Herstellerwarnungen.",
    trigger: "Eingang eines externen Alerts/Advisories.",
    prerequisites:
      "Aktuelles Asset-Inventar und vollständiges Informationsregister (kritischer Pfad!).",
    input: "Alert (IoCs, betroffene Produkte/Versionen), Asset-Register, Drittparteien-Register.",
    roles:
      "Durchführung: Information Security Officer (SOC); Risiko-Update: ICT Risk Manager; Provider-Kontakt: Third Party Risk Manager.",
    sla: "Time to Assess ≤ 24 h (KPI-K6-02): vom Alert-Eingang bis zum abgeschlossenen Registerabgleich.",
    escalation:
      "Betroffenheit kritischer Funktionen → PB-14/PB-04; aktive Ausnutzung → Incident-Prozess (RB-21).",
    output:
      "Abgleichprotokoll, aktualisierte Risikobewertungen, ggf. Maßnahmen und Provider-Anfragen.",
    kpi: "Auswertungsquote 100 % (KPI-K6-01); Time to Assess ≤ 24 h (KPI-K6-02).",
    controlPoints:
      "Jeder Alert erhält eine dokumentierte Abgleich-Entscheidung – auch bei Nichtbetroffenheit.",
    reviewCycle: "Jährlich",
    steps: [
      {
        title: "Alert erfassen und bewerten",
        description:
          "Quelle, Schweregrad und betroffene Produkte/Versionen aufnehmen; Eingangszeitpunkt dokumentieren.",
        role: "Information Security Officer",
      },
      {
        title: "Asset-Abgleich",
        description:
          "Betroffenheit der eigenen Assets und ICT-Services prüfen (Versionen, Exposition).",
        role: "Information Security Officer",
      },
      {
        title: "Provider-Abgleich",
        description:
          "Informationsregister prüfen: Welche Dienstleister und Subdienstleister setzen die betroffene Komponente ein? Anfragen stellen.",
        role: "Third Party Risk Manager",
        evidence: "Abgleichprotokoll",
      },
      {
        title: "Risiko- und Maßnahmenableitung",
        description:
          "Betroffene Risiken neu bewerten (RB-02), Sofortmaßnahmen und Patches als Maßnahmen anlegen.",
        role: "ICT Risk Manager",
        decision: true,
      },
      {
        title: "Time to Assess dokumentieren",
        description:
          "Abschlusszeitpunkt festhalten; KPI-K6-02 speist sich aus diesen Zeitstempeln.",
        role: "Information Security Officer",
      },
    ],
  },
];

const NEW_PLAYBOOK = {
  code: "PB-17",
  scenario: "Offener DORA-Knockout",
  objective:
    "Eine knockout-relevante MUSS-Anforderung mit Reifegrad unter 3 unverzüglich beherrschen: Kapitelstatus ROT, Berichtspflicht an das Leitungsorgan, Behebung binnen 10 Arbeitstagen.",
  activationCriteria:
    "Score-Engine meldet eine KO-Anforderung mit wirksamem Reifegrad < 3 (inkl. Nachweissperre) – z. B. nach Neubewertung, abgelaufenem Nachweis oder negativem Test.",
  severityGuidance:
    "Immer CRITICAL: Knockouts übersteuern jede Durchschnittsbetrachtung (FRWK-DORA-001 Kap. 11.3, Tabelle 24).",
  rolesRaci:
    "R: ICT Risk Manager; A: Leitungsorgan (Management); C: ISO, verantwortliche Rolle der Anforderung; I: Second Line, Interne Revision.",
  initialAssessment:
    "Ursache klären: fehlende Regelung, fehlender/abgelaufener Nachweis (Nachweissperre) oder festgestellte Unwirksamkeit? Betroffene kritische Funktionen identifizieren.",
  immediateActions:
    "Finding (Schweregrad Kritisch) mit CAPA anlegen; Reaktionsfrist sofort, Behebungsfrist 10 Arbeitstage; Kapitel-Ampel prüfen; Managementbericht auslösen.",
  riskAnalysis:
    "Zugehöriges Register-Risiko bewerten oder anlegen; prüfen, ob die Lücke weitere Anforderungen oder laufende Prüfungen berührt.",
  decisionTree:
    "Nachweis existiert, ist aber nicht verknüpft/geprüft? → Nachweis nachziehen (RB-19), Neubewertung. Regelung fehlt? → Sofortmaßnahme + kompensierende Kontrolle. Behebung > 10 AT? → Managemententscheidung über Interimsmaßnahmen oder Einschränkung der betroffenen Funktion.",
  communication:
    "Unverzügliche Information an Management (Tabelle 24: Eskalation Leitungsorgan); Aufnahme in den nächsten Managementbericht; bei Prüfungsbezug Compliance einbinden.",
  regulatoryCheck:
    "Knockouts markieren Anforderungen, deren Nichterfüllung in aufsichtlichen Prüfungen mit hoher Wahrscheinlichkeit zu Feststellungen führt – Dokumentation der Behebung revisionssicher führen.",
  measures:
    "CAPA mit Wirksamkeitskriterium; Nachtest/Neubewertung erst nach Wirksamkeitsnachweis; Reifegrad-Neubewertung schließt den Regelkreis.",
  evidenceRequired:
    "Finding, CAPA, Wirksamkeitsnachweis, Neubewertung mit Begründung, Managementbericht.",
  closureCriteria:
    "Wirksamer Reifegrad der Anforderung ≥ 3 (inkl. gültigem Nachweis); Kapitel-Ampel neu berechnet; Finding geschlossen.",
  postEventReview:
    "Warum wurde der Knockout nicht früher erkannt? Frühindikatoren (Nachweis-Abläufe, Testtermine) in RB-19/RB-14 schärfen.",
};

function hoursFromNow(now, h) {
  return new Date(now.getTime() + h * 3_600_000);
}
function daysFromNow(now, d) {
  return new Date(now.getTime() + d * 86_400_000);
}

/**
 * @param {import("@prisma/client").PrismaClient} db
 * @param {{ assessorEmail?: string, creatorEmail?: string, log?: (msg: string) => void }} opts
 * @returns {Promise<{seeded: boolean}>}
 */
export async function seedDora(db, opts = {}) {
  const log = opts.log ?? (() => {});
  const now = new Date();

  const existing = await db.doraRequirement.count();
  if (existing >= catalog.requirements.length) {
    log(`DORA-Katalog bereits vorhanden (${existing} Anforderungen) – übersprungen.`);
    return { seeded: false };
  }

  const assessor = await db.user.findUnique({
    where: { email: opts.assessorEmail ?? "iso@demo.example" },
  });
  const creator = await db.user.findUnique({
    where: { email: opts.creatorEmail ?? "riskmanager@demo.example" },
  });
  if (!assessor || !creator) {
    throw new Error(
      "Demo-Benutzer (iso@/riskmanager@demo.example) nicht gefunden – Basis-Seed fehlt.",
    );
  }

  // ---------- Kapitel & Anforderungen ----------
  const chapterIds = {};
  for (const ch of catalog.chapters) {
    const row = await db.doraChapter.upsert({
      where: { key: ch.key },
      update: {},
      create: {
        key: ch.key,
        roman: ch.roman,
        title: ch.title,
        articleRange: ch.articles,
        weightPercent: ch.weight,
      },
    });
    chapterIds[ch.key] = row.id;
  }

  let evidenceCounter = await db.evidence.count();
  const chapterIndex = {};
  for (const req of catalog.requirements) {
    const idx = (chapterIndex[req.chapter] = (chapterIndex[req.chapter] ?? -1) + 1);
    const profile = profileFor(req, idx);
    const row = await db.doraRequirement.upsert({
      where: { reqId: req.reqId },
      update: {},
      create: {
        reqId: req.reqId,
        chapterId: chapterIds[req.chapter],
        article: req.article,
        title: req.title,
        requirementText: req.requirement,
        evidenceSpec: req.evidence,
        bindingness: req.bindingness,
        weight: req.weight,
        knockout: req.knockout,
        ownerRole: req.ownerRole,
        cwIso27001: req.crosswalk.iso27001,
        cwIso22301: req.crosswalk.iso22301,
        cwNis2Bsig: req.crosswalk.nis2Bsig,
        cwRtsIts: req.crosswalk.rtsIts,
        linkedProcesses: PROCESS_OVERRIDES[req.reqId] ?? PROCESS_DEFAULTS[req.chapter],
      },
    });

    // Aktuelle Bewertung + für einen Teil eine ältere (niedrigere) für den Verlauf
    const monthsAgo = 1 + (idx % 3);
    if (idx % 2 === 0 && profile.maturity >= 2) {
      await db.doraAssessment.create({
        data: {
          requirementId: row.id,
          maturity: Math.max(0, profile.maturity - 2),
          justification:
            "Erstbewertung im Rahmen der Gap-Analyse (Phase 2 des Umsetzungsfahrplans).",
          assessorId: assessor.id,
          assessedAt: daysFromNow(now, -(120 + monthsAgo * 30)),
          isCurrent: false,
        },
      });
    }
    await db.doraAssessment.create({
      data: {
        requirementId: row.id,
        maturity: profile.maturity,
        justification:
          profile.maturity >= 3
            ? "Regelung dokumentiert, freigegeben und angewendet; Nachweise verknüpft."
            : profile.maturity === 2
              ? "Aktivitäten wiederholbar, Dokumentation bzw. Nachweisführung noch unvollständig."
              : "Anforderung bisher nur anlassbezogen adressiert; Regelungsbedarf offen.",
        assessorId: assessor.id,
        assessedAt: daysFromNow(now, -(idx % 45)),
        isCurrent: true,
      },
    });

    if (profile.evidenced) {
      evidenceCounter += 1;
      await db.evidence.create({
        data: {
          evidenceId: `EV-${String(evidenceCounter + 100).padStart(3, "0")}`,
          title: `Nachweis ${req.reqId}: ${req.title.slice(0, 80)}`,
          docType: "REPORT",
          ownerId: assessor.id,
          link: `https://dms.internal.example/dora/${req.reqId.toLowerCase()}`,
          doraRequirementId: row.id,
          validUntil: daysFromNow(now, 180 + (idx % 120)),
          classification: "CONFIDENTIAL",
          reviewerId: assessor.id,
          reviewStatus: "REVIEWED",
          version: "1.0",
        },
      });
    }
  }
  log(`DORA-Katalog: ${catalog.requirements.length} Anforderungen mit Bewertungen angelegt.`);

  // ---------- Neue Runbooks & Playbook ----------
  for (const rb of NEW_RUNBOOKS) {
    const exists = await db.runbook.findUnique({ where: { code: rb.code } });
    if (exists) continue;
    await db.runbook.create({
      data: {
        code: rb.code,
        title: rb.title,
        purpose: rb.purpose,
        scope: rb.scope,
        triggerText: rb.trigger,
        prerequisites: rb.prerequisites,
        input: rb.input,
        rolesText: rb.roles,
        sla: rb.sla,
        escalationRules: rb.escalation,
        output: rb.output,
        kpi: rb.kpi,
        controlPoints: rb.controlPoints,
        reviewCycle: rb.reviewCycle,
        steps: {
          create: rb.steps.map((s, i) => ({
            sortOrder: i,
            title: s.title,
            description: s.description,
            responsibleRole: s.role,
            isDecisionPoint: s.decision ?? false,
            requiredEvidence: s.evidence,
          })),
        },
      },
    });
  }
  const pbExists = await db.playbook.findUnique({ where: { code: NEW_PLAYBOOK.code } });
  if (!pbExists) {
    await db.playbook.create({
      data: {
        code: NEW_PLAYBOOK.code,
        scenario: NEW_PLAYBOOK.scenario,
        objective: NEW_PLAYBOOK.objective,
        activationCriteria: NEW_PLAYBOOK.activationCriteria,
        severityGuidance: NEW_PLAYBOOK.severityGuidance,
        rolesRaci: NEW_PLAYBOOK.rolesRaci,
        initialAssessment: NEW_PLAYBOOK.initialAssessment,
        immediateActions: NEW_PLAYBOOK.immediateActions,
        riskAnalysis: NEW_PLAYBOOK.riskAnalysis,
        decisionTree: NEW_PLAYBOOK.decisionTree,
        communication: NEW_PLAYBOOK.communication,
        regulatoryCheck: NEW_PLAYBOOK.regulatoryCheck,
        measures: NEW_PLAYBOOK.measures,
        evidenceRequired: NEW_PLAYBOOK.evidenceRequired,
        closureCriteria: NEW_PLAYBOOK.closureCriteria,
        postEventReview: NEW_PLAYBOOK.postEventReview,
      },
    });
  }
  log("RB-21, RB-22, RB-23 und PB-17 angelegt.");

  // ---------- Findings mit CAPA-Verwebung ----------
  const findAction = async (actionId) =>
    (await db.action.findUnique({ where: { actionId } }))?.id ?? null;
  const findReq = async (reqId) =>
    (await db.doraRequirement.findUnique({ where: { reqId } }))?.id ?? null;

  const findings = [
    {
      findingId: "FND-2026-0001",
      reqId: "DORA-K5-011",
      source: "SELF_ASSESSMENT",
      severity: "CRITICAL",
      title: "Exit-Strategien für zwei CIF-Dienstleister fehlen bzw. sind ungetestet",
      description:
        "Für die Handelsplattform (TP-006) fehlt die Ausstiegsstrategie vollständig; für den Zahlungsverkehrs-Processor (TP-002) ist der Exit-Plan seit über 24 Monaten ungetestet. Knockout-Anforderung DORA-K5-011 steht damit unter Reifegrad 3.",
      capaActionId: "ACT-2026-0010",
      status: "IN_PROGRESS",
      detectedDaysAgo: 30,
      effectivenessCriterion:
        "Getesteter Exit-Plan je CIF-Dienstleister vorhanden; Neubewertung DORA-K5-011 ≥ 3.",
    },
    {
      findingId: "FND-2026-0002",
      reqId: "DORA-K4-006",
      source: "TEST",
      severity: "CRITICAL",
      title: "Jahrestest der Wiederanlaufverfahren zweimal verschoben",
      description:
        "Der Umschalttest auf das Ausweich-Rechenzentrum wurde zweimal verschoben; der jährliche Testnachweis für CIF-Systeme (Art. 24 Abs. 6) fehlt. Bezug: RISK-2026-0017.",
      capaActionId: "ACT-2026-0026",
      status: "IN_PROGRESS",
      detectedDaysAgo: 45,
      effectivenessCriterion:
        "Erfolgreicher Failover-Test mit Protokoll; RTO-Nachweis je kritischer Funktion.",
    },
    {
      findingId: "FND-2026-0003",
      reqId: "DORA-K5-004",
      source: "AUDIT",
      severity: "HIGH",
      title: "Informationsregister: Validierungsfehler bei der Probeeinreichung",
      description:
        "Die Probeeinreichung des Informationsregisters erzeugte Validierungsfehler der ESAs (fehlende Subdienstleister-Angaben, unvollständige Datenstandorte).",
      capaActionId: "ACT-2026-0024",
      status: "IN_PROGRESS",
      detectedDaysAgo: 20,
      effectivenessCriterion: "Fehlerfreier Validierungslauf; Vier-Augen-Freigabe dokumentiert.",
    },
    {
      findingId: "FND-2026-0004",
      reqId: "DORA-K2-053",
      source: "AUDIT",
      severity: "MEDIUM",
      title: "Awareness-Programm ohne dokumentierte Erfolgskontrolle",
      description:
        "Schulungen finden statt, eine Erfolgskontrolle (Quoten, Wirksamkeitsmessung) ist jedoch nicht nachweisbar; Nachweissperre begrenzt den Reifegrad.",
      capaActionId: "ACT-2026-0006",
      status: "OPEN",
      detectedDaysAgo: 12,
      effectivenessCriterion:
        "Teilnahmequoten und Phishing-Testergebnisse als verknüpfter Nachweis.",
    },
    {
      findingId: "FND-2026-0005",
      reqId: "DORA-K2-059",
      source: "INCIDENT",
      severity: "HIGH",
      title: "Audit-Trail-Lücken bei einer CIF-Schnittstelle",
      description:
        "Die Nachbereitung eines Vorfalls zeigte, dass Protokolle der Zahlungsschnittstelle nachträglich veränderbar waren – Verbindlichkeit (Non-Repudiation) nicht gewährleistet.",
      capaActionId: null,
      status: "OPEN",
      detectedDaysAgo: 5,
      effectivenessCriterion: "WORM-/Append-only-Nachweis für alle CIF-Protokolle.",
    },
  ];

  const { FINDING_SEVERITY_RULES } = {
    FINDING_SEVERITY_RULES: {
      CRITICAL: { responseDays: 0, remediationDays: 14 },
      HIGH: { responseDays: 7, remediationDays: 42 },
      MEDIUM: { responseDays: 14, remediationDays: 126 },
      LOW: { responseDays: 28, remediationDays: 252 },
    },
  };

  for (const f of findings) {
    const exists = await db.doraFinding.findUnique({ where: { findingId: f.findingId } });
    if (exists) continue;
    const rules = FINDING_SEVERITY_RULES[f.severity];
    const detectedAt = daysFromNow(now, -f.detectedDaysAgo);
    await db.doraFinding.create({
      data: {
        findingId: f.findingId,
        requirementId: await findReq(f.reqId),
        source: f.source,
        severity: f.severity,
        title: f.title,
        description: f.description,
        detectedAt,
        responseDueAt: daysFromNow(detectedAt, rules.responseDays),
        remediationDueAt: daysFromNow(detectedAt, rules.remediationDays),
        status: f.status,
        effectivenessCriterion: f.effectivenessCriterion,
        escalatedTo:
          f.severity === "CRITICAL" ? "Leitungsorgan" : f.severity === "HIGH" ? "CISO" : null,
        actionId: f.capaActionId ? await findAction(f.capaActionId) : null,
        createdById: creator.id,
      },
    });
  }
  log(`${findings.length} DORA-Findings mit CAPA-Verknüpfung angelegt.`);

  // ---------- Demo-Vorfälle mit Meldefristen ----------
  if (!(await db.incident.findUnique({ where: { incidentId: "INC-2026-0001" } }))) {
    const cif = await db.criticalFunction.findFirst({ where: { name: "Zahlungsverkehr" } });
    const tp = await db.thirdParty.findFirst({ where: { tpId: "TP-002" } });
    const awarenessAt = hoursFromNow(now, -20);
    const classifiedAt = hoursFromNow(now, -18);
    const initialSubmitted = hoursFromNow(now, -15);
    await db.incident.create({
      data: {
        incidentId: "INC-2026-0001",
        title: "Störung der SEPA-Verarbeitung beim Processing-Dienstleister",
        description:
          "Der Zahlungsverkehrs-Dienstleister meldet eine Störung der SEPA-Batchverarbeitung; Rückstau von Kundenzahlungen, Workaround aktiv. Klassifizierung als schwerwiegend nach Art. 18 (kritischer Dienst betroffen, > 10 % der Transaktionen verzögert).",
        awarenessAt,
        classifiedAt,
        isMajor: true,
        classificationNote:
          "Kriterien erfüllt: Kritikalität der Dienste (Zahlungsverkehr), Dauer/Ausfallzeit, betroffene Transaktionen. Wirtschaftliche Auswirkung in Prüfung.",
        status: "CONTAINED",
        gdprRelevant: true,
        nis2Relevant: false,
        criticalFunctionId: cif?.id ?? null,
        thirdPartyId: tp?.id ?? null,
        createdById: creator.id,
        reports: {
          create: [
            {
              reportType: "DORA_INITIAL",
              dueAt: hoursFromNow(classifiedAt, 4),
              submittedAt: initialSubmitted,
              reference: "MVP-2026-08-0113",
            },
            { reportType: "DORA_INTERMEDIATE", dueAt: hoursFromNow(initialSubmitted, 72) },
            {
              reportType: "GDPR_NOTIFICATION",
              dueAt: hoursFromNow(awarenessAt, 72),
            },
          ],
        },
      },
    });
  }
  if (!(await db.incident.findUnique({ where: { incidentId: "INC-2026-0002" } }))) {
    await db.incident.create({
      data: {
        incidentId: "INC-2026-0002",
        title: "Phishing-Welle ohne Kontokompromittierung",
        description:
          "Gezielte Phishing-Kampagne gegen Mitarbeitende; keine erfolgreiche Kompromittierung, keine Wesentlichkeitsschwelle erreicht. Als nicht schwerwiegend klassifiziert; Prüfentscheidung dokumentiert.",
        awarenessAt: daysFromNow(now, -30),
        classifiedAt: daysFromNow(now, -30),
        isMajor: false,
        classificationNote:
          "Schwellen der DelVO 2024/1772 nicht erreicht; DSGVO-/NIS-2-Prüfung negativ, dokumentiert.",
        status: "CLOSED",
        gdprRelevant: false,
        nis2Relevant: false,
        createdById: creator.id,
      },
    });
  }
  log("Demo-Vorfälle INC-2026-0001 (laufende Fristen) und INC-2026-0002 angelegt.");

  return { seeded: true };
}
