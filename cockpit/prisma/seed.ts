/**
 * Seed: vollständig synthetische Demo-Daten (keine realen Firmen-, Kunden-
 * oder Mitarbeiterdaten). Fiktives Institut: "Nordlicht Bank AG".
 *
 * Ausführen: npm run db:seed   (oder npm run db:reset für frischen Stand)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { RUNBOOKS } from "../lib/content/runbooks";
import { PLAYBOOKS } from "../lib/content/playbooks";
import { inherentRisk, residualRisk } from "../lib/domain/risk-calc";

const db = new PrismaClient();

const DEMO_PASSWORD = "Demo!2026";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding …");

  // ---------- Rollen & Berechtigungen ----------
  const roleDefs: Array<[string, string, string]> = [
    ["ADMIN", "Administrator", "Benutzer, Rollen, Stammdaten und Einstellungen verwalten"],
    ["ICT_RISK_MANAGER", "ICT Risk Manager", "Risiken anlegen, bewerten, überwachen; Maßnahmen und Reports steuern"],
    ["TPRM_MANAGER", "Third Party Risk Manager", "Drittparteien verwalten und bewerten"],
    ["ISO", "Information Security Officer", "Fachliche Prüfung, Quality Reviews, Sicherheitsanforderungen"],
    ["RISK_OWNER", "Risk Owner", "Risiken bewerten, freigeben, Behandlungsstrategie festlegen"],
    ["CONTROL_OWNER", "Control Owner", "Kontrollen dokumentieren, Nachweise, Kontrolltests"],
    ["ACTION_OWNER", "Action Owner", "Maßnahmen aktualisieren, Termine und Nachweise pflegen"],
    ["SECOND_LINE", "Reviewer / Second Line", "Unabhängige Qualitätssicherung und Freigaben"],
    ["MANAGEMENT", "Management", "Read-only Dashboard/Reports; Freigaben von Entscheidungen und Akzeptanzen"],
    ["AUDITOR", "Auditor", "Lesender, revisionsbezogener Zugriff inkl. Audit Trail"],
  ];
  const roles = new Map<string, string>();
  for (const [key, name, description] of roleDefs) {
    const r = await db.role.create({ data: { key, name, description } });
    roles.set(key, r.id);
  }

  const permissionDefs: Array<[string, string]> = [
    ["risk:read", "Risiken lesen"],
    ["risk:write", "Risiken anlegen und ändern"],
    ["risk:assess", "Risiken bewerten"],
    ["risk:review", "Quality Reviews durchführen"],
    ["risk:approve", "Risiken freigeben"],
    ["acceptance:request", "Risikoakzeptanz beantragen"],
    ["acceptance:approve", "Risikoakzeptanz genehmigen"],
    ["action:write", "Maßnahmen pflegen"],
    ["control:write", "Kontrollen pflegen"],
    ["control:test", "Kontrolltests durchführen"],
    ["thirdparty:write", "Drittparteien pflegen"],
    ["evidence:write", "Nachweise pflegen"],
    ["compliance:write", "Compliance-Mappings pflegen"],
    ["runbook:execute", "Runbooks ausführen"],
    ["playbook:execute", "Playbooks ausführen"],
    ["report:create", "Reports erstellen"],
    ["export", "Daten exportieren"],
    ["audit:read", "Audit Trail lesen"],
    ["admin", "Administration"],
  ];
  for (const [key, description] of permissionDefs) {
    await db.permission.create({ data: { key, description } });
  }
  // Rollen-Berechtigungs-Zuordnung entsprechend lib/authz.ts (statische Wahrheit)
  const { PERMISSIONS } = await import("../lib/authz-map");
  for (const [permKey, roleKeys] of Object.entries(PERMISSIONS)) {
    const perm = await db.permission.findUnique({ where: { key: permKey } });
    if (!perm) continue;
    for (const rk of roleKeys) {
      const roleId = roles.get(rk);
      if (roleId) {
        await db.rolePermission.create({ data: { roleId, permissionId: perm.id } });
      }
    }
  }

  // ---------- Benutzer (ein Demo-Konto je Rolle) ----------
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const userDefs: Array<[string, string, string[]]> = [
    ["admin@demo.example", "Alex Berger (Admin)", ["ADMIN"]],
    ["riskmanager@demo.example", "Mara Wolf (ICT Risk Manager)", ["ICT_RISK_MANAGER"]],
    ["tprm@demo.example", "Jonas Feld (TPRM Manager)", ["TPRM_MANAGER"]],
    ["iso@demo.example", "Ines Sturm (ISO)", ["ISO"]],
    ["riskowner@demo.example", "Robert Ohl (Risk Owner)", ["RISK_OWNER"]],
    ["controlowner@demo.example", "Carla Ost (Control Owner)", ["CONTROL_OWNER"]],
    ["actionowner@demo.example", "Amir Omar (Action Owner)", ["ACTION_OWNER"]],
    ["secondline@demo.example", "Sven Lindt (Second Line)", ["SECOND_LINE"]],
    ["management@demo.example", "Maria Groß (Management)", ["MANAGEMENT"]],
    ["auditor@demo.example", "Astrid Uhl (Auditorin)", ["AUDITOR"]],
  ];
  const users = new Map<string, string>();
  for (const [email, name, roleKeys] of userDefs) {
    const u = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        roles: { create: roleKeys.map((rk) => ({ roleId: roles.get(rk)! })) },
      },
    });
    users.set(email, u.id);
  }
  const uAdmin = users.get("admin@demo.example")!;
  const uRm = users.get("riskmanager@demo.example")!;
  const uTprm = users.get("tprm@demo.example")!;
  const uIso = users.get("iso@demo.example")!;
  const uRo = users.get("riskowner@demo.example")!;
  const uCo = users.get("controlowner@demo.example")!;
  const uAo = users.get("actionowner@demo.example")!;
  const uSl = users.get("secondline@demo.example")!;
  const uMgmt = users.get("management@demo.example")!;

  // ---------- Organisation & Stammdaten ----------
  const bank = await db.organizationalUnit.create({
    data: { name: "Nordlicht Bank AG", kind: "COMPANY" },
  });
  const kvg = await db.organizationalUnit.create({
    data: { name: "Nordlicht Asset Management GmbH", kind: "COMPANY" },
  });
  const ouIT = await db.organizationalUnit.create({
    data: { name: "IT & Operations", kind: "BUSINESS_UNIT", parentId: bank.id },
  });
  const ouPB = await db.organizationalUnit.create({
    data: { name: "Private Banking", kind: "BUSINESS_UNIT", parentId: bank.id },
  });
  const ouWM = await db.organizationalUnit.create({
    data: { name: "Wealth Management", kind: "BUSINESS_UNIT", parentId: kvg.id },
  });
  const ouCF = await db.organizationalUnit.create({
    data: { name: "Corporate Functions", kind: "BUSINESS_UNIT", parentId: bank.id },
  });

  const locFfm = await db.location.create({ data: { name: "Frankfurt", country: "DE" } });
  const locSb = await db.location.create({ data: { name: "Saarbrücken", country: "DE" } });
  const locPar = await db.location.create({ data: { name: "Paris", country: "FR" } });
  const locLux = await db.location.create({ data: { name: "Luxemburg", country: "LU" } });

  const cfDefs: Array<[string, string, boolean]> = [
    ["Zahlungsverkehr", "Abwicklung des nationalen und internationalen Zahlungsverkehrs", true],
    ["Wertpapierabwicklung", "Settlement und Verwahrung von Wertpapiergeschäften", true],
    ["Kundenportal & Online Banking", "Digitaler Zugangskanal für Kunden", true],
    ["Regulatorisches Meldewesen", "Aufsichtsrechtliche Meldungen und Berichte", true],
    ["Handelsplattform", "Orderannahme und -ausführung", true],
    ["Personalabrechnung", "Gehalts- und Personalprozesse", false],
  ];
  const cfs: string[] = [];
  for (const [name, description, isCritical] of cfDefs) {
    const cf = await db.criticalFunction.create({ data: { name, description, isCritical } });
    cfs.push(cf.id);
  }

  const bpDefs: Array<[string, string, string, string]> = [
    ["Kundenzahlungen ausführen", "End-to-End-Prozess Zahlungsauftrag bis Buchung", "CRITICAL", ouIT.id],
    ["Wertpapierorder abwickeln", "Orderannahme, Routing, Settlement", "CRITICAL", ouPB.id],
    ["Kunden-Onboarding", "Neukundenaufnahme inkl. KYC", "HIGH", ouPB.id],
    ["Regulatorische Meldungen erstellen", "Erstellung und Abgabe aufsichtlicher Meldungen", "HIGH", ouCF.id],
    ["Portfolio-Reporting", "Kundenreporting im Wealth Management", "MEDIUM", ouWM.id],
    ["IT-Änderungsmanagement", "Change- und Releaseprozess der IT", "HIGH", ouIT.id],
  ];
  const bps: string[] = [];
  for (const [name, description, criticality, ouId] of bpDefs) {
    const bp = await db.businessProcess.create({ data: { name, description, criticality, ouId } });
    bps.push(bp.id);
  }

  const assetDefs: Array<[string, string, string, string]> = [
    ["Core-Banking-System \"KERN24\"", "APPLICATION", "STRICTLY_CONFIDENTIAL", locFfm.id],
    ["Zahlungsverkehrs-Gateway", "APPLICATION", "STRICTLY_CONFIDENTIAL", locFfm.id],
    ["Kundenportal Web/App", "APPLICATION", "CONFIDENTIAL", locSb.id],
    ["Data Warehouse", "DATA", "CONFIDENTIAL", locFfm.id],
    ["Rechenzentrum Frankfurt", "FACILITY", "CONFIDENTIAL", locFfm.id],
    ["Netzwerk-Backbone", "INFRASTRUCTURE", "CONFIDENTIAL", locFfm.id],
    ["Handelssystem \"TradeLine\"", "APPLICATION", "STRICTLY_CONFIDENTIAL", locPar.id],
    ["Meldewesen-Plattform", "APPLICATION", "CONFIDENTIAL", locLux.id],
    ["Mitarbeiter-Endgeräte", "DEVICE", "INTERNAL", locSb.id],
    ["Identity-Provider (IAM)", "INFRASTRUCTURE", "STRICTLY_CONFIDENTIAL", locFfm.id],
  ];
  const assets: string[] = [];
  for (const [name, assetType, classification, locationId] of assetDefs) {
    const a = await db.asset.create({
      data: { name, assetType, classification, locationId, ownerId: uCo },
    });
    assets.push(a.id);
  }

  // ---------- Drittparteien (12, vollständig fiktiv) ----------
  interface TpSeed {
    tpId: string;
    name: string;
    service: string;
    country: string;
    serviceLocations: string;
    dataLocations: string;
    infoTypes: string;
    critical: boolean;
    category: string;
    criticality: string;
    inherent: number;
    residual: number;
    dd: string;
    status: string;
    concentration: boolean;
    substitutability: string;
    assessmentDaysAgo: number | null;
    nextReviewInDays: number | null;
    contractEndInDays: number | null;
    exit: "TESTED" | "APPROVED" | "DRAFT" | "MISSING" | "UNTESTED";
    subs?: Array<[string, string, string, boolean]>;
  }
  const tpSeeds: TpSeed[] = [
    { tpId: "TP-001", name: "CloudRhein GmbH", service: "IaaS/PaaS-Hosting für Kundenportal und Fachanwendungen", country: "DE", serviceLocations: "Frankfurt, Berlin", dataLocations: "DE (Frankfurt), IE (Dublin)", infoTypes: "Kundenstammdaten, Transaktionsdaten", critical: true, category: "CLOUD_HOSTING", criticality: "CRITICAL", inherent: 20, residual: 9, dd: "COMPLETED", status: "MONITORING", concentration: true, substitutability: "DIFFICULT", assessmentDaysAgo: 90, nextReviewInDays: 275, contractEndInDays: 540, exit: "TESTED", subs: [["NordDC Data Centers AG", "DE", "Rechenzentrumsbetrieb", true], ["SecureLink Networks", "NL", "Netzwerkanbindung", false]] },
    { tpId: "TP-002", name: "PaySwift Processing S.A.", service: "Zahlungsverkehrsabwicklung (SEPA/SWIFT-Anbindung)", country: "LU", serviceLocations: "Luxemburg", dataLocations: "LU, DE", infoTypes: "Zahlungsdaten, Kontodaten", critical: true, category: "PAYMENT_PROCESSING", criticality: "CRITICAL", inherent: 20, residual: 12, dd: "COMPLETED", status: "MONITORING", concentration: false, substitutability: "HARDLY_SUBSTITUTABLE", assessmentDaysAgo: 200, nextReviewInDays: 165, contractEndInDays: 900, exit: "UNTESTED", subs: [["NordDC Data Centers AG", "DE", "Backup-Rechenzentrum", true]] },
    { tpId: "TP-003", name: "SecureIdent AG", service: "Identity- & Access-Management as a Service (IAM)", country: "DE", serviceLocations: "München", dataLocations: "DE", infoTypes: "Identitätsdaten, Authentisierungsdaten", critical: true, category: "SECURITY_SERVICES", criticality: "HIGH", inherent: 16, residual: 6, dd: "COMPLETED", status: "MONITORING", concentration: false, substitutability: "DIFFICULT", assessmentDaysAgo: 60, nextReviewInDays: 305, contractEndInDays: 420, exit: "APPROVED" },
    { tpId: "TP-004", name: "DataVault Analytics Ltd.", service: "Data-Warehouse-Betrieb und BI-Plattform", country: "IE", serviceLocations: "Dublin", dataLocations: "IE, DE", infoTypes: "aggregierte Kundendaten, Berichtsdaten", critical: false, category: "DATA_ANALYTICS", criticality: "MEDIUM", inherent: 12, residual: 6, dd: "COMPLETED", status: "MONITORING", concentration: false, substitutability: "EASY", assessmentDaysAgo: 150, nextReviewInDays: 215, contractEndInDays: 700, exit: "DRAFT" },
    { tpId: "TP-005", name: "HelpDesk24 Services GmbH", service: "IT-Service-Desk (1st/2nd Level)", country: "DE", serviceLocations: "Saarbrücken, Leipzig", dataLocations: "DE", infoTypes: "Ticketdaten, eingeschränkte Nutzerdaten", critical: false, category: "IT_SUPPORT", criticality: "LOW", inherent: 8, residual: 4, dd: "COMPLETED", status: "MONITORING", concentration: false, substitutability: "EASY", assessmentDaysAgo: 300, nextReviewInDays: 65, contractEndInDays: 180, exit: "MISSING" },
    { tpId: "TP-006", name: "TradeCore Systems S.A.S.", service: "Betrieb und Wartung der Handelsplattform", country: "FR", serviceLocations: "Paris", dataLocations: "FR", infoTypes: "Orderdaten, Marktdaten", critical: true, category: "TRADING_SYSTEMS", criticality: "CRITICAL", inherent: 20, residual: 12, dd: "IN_PROGRESS", status: "RISK_ASSESSMENT", concentration: false, substitutability: "HARDLY_SUBSTITUTABLE", assessmentDaysAgo: null, nextReviewInDays: 30, contractEndInDays: 1100, exit: "MISSING" },
    { tpId: "TP-007", name: "NetGuard Cyber Defense GmbH", service: "SOC-Services und Managed Detection & Response", country: "DE", serviceLocations: "Bonn", dataLocations: "DE", infoTypes: "Security-Events, Log-Daten", critical: true, category: "SECURITY_SERVICES", criticality: "HIGH", inherent: 15, residual: 6, dd: "COMPLETED", status: "MONITORING", concentration: false, substitutability: "DIFFICULT", assessmentDaysAgo: 45, nextReviewInDays: 320, contractEndInDays: 610, exit: "APPROVED" },
    { tpId: "TP-008", name: "ArchivPlus Dokumenten-Service AG", service: "Digitale Langzeitarchivierung", country: "AT", serviceLocations: "Wien", dataLocations: "AT, DE", infoTypes: "Vertragsdokumente, Archivdaten", critical: false, category: "ARCHIVING", criticality: "MEDIUM", inherent: 9, residual: 4, dd: "COMPLETED", status: "MONITORING", concentration: false, substitutability: "DIFFICULT", assessmentDaysAgo: 400, nextReviewInDays: -35, contractEndInDays: 800, exit: "DRAFT" },
    { tpId: "TP-009", name: "SwiftPrint Output Management KG", service: "Druck- und Versanddienstleistungen Kundenkommunikation", country: "DE", serviceLocations: "Mainz", dataLocations: "DE", infoTypes: "Kundenadressen, Dokumenteninhalte", critical: false, category: "OUTPUT_MANAGEMENT", criticality: "LOW", inherent: 6, residual: 3, dd: "COMPLETED", status: "MONITORING", concentration: false, substitutability: "EASY", assessmentDaysAgo: 250, nextReviewInDays: 115, contractEndInDays: 75, exit: "MISSING" },
    { tpId: "TP-010", name: "RegTech Reporting Solutions GmbH", service: "SaaS für regulatorisches Meldewesen", country: "DE", serviceLocations: "Frankfurt", dataLocations: "DE", infoTypes: "Meldedaten, Finanzdaten", critical: true, category: "SAAS", criticality: "HIGH", inherent: 16, residual: 8, dd: "COMPLETED", status: "MONITORING", concentration: true, substitutability: "DIFFICULT", assessmentDaysAgo: 120, nextReviewInDays: 245, contractEndInDays: 45, exit: "UNTESTED", subs: [["CloudRhein GmbH", "DE", "Hosting der SaaS-Plattform", true]] },
    { tpId: "TP-011", name: "TeleConnect Carrier Services B.V.", service: "WAN-/Standortvernetzung und Internetanbindung", country: "NL", serviceLocations: "Amsterdam, Frankfurt", dataLocations: "Transitdaten EU", infoTypes: "Netzwerkverkehr (transport-verschlüsselt)", critical: true, category: "NETWORK", criticality: "HIGH", inherent: 15, residual: 8, dd: "COMPLETED", status: "MONITORING", concentration: false, substitutability: "DIFFICULT", assessmentDaysAgo: 180, nextReviewInDays: 185, contractEndInDays: 365, exit: "APPROVED" },
    { tpId: "TP-012", name: "KanzleiPartner Legal Tech GmbH", service: "Vertragsmanagement-Software (SaaS)", country: "DE", serviceLocations: "Hamburg", dataLocations: "DE", infoTypes: "Vertragsdaten", critical: false, category: "SAAS", criticality: "LOW", inherent: 6, residual: 3, dd: "NOT_STARTED", status: "SCREENING", concentration: false, substitutability: "EASY", assessmentDaysAgo: null, nextReviewInDays: 20, contractEndInDays: null, exit: "MISSING" },
  ];

  const tps: string[] = [];
  for (const t of tpSeeds) {
    const tp = await db.thirdParty.create({
      data: {
        tpId: t.tpId,
        name: t.name,
        providedService: t.service,
        businessOwnerId: uRo,
        contractOwnerId: uTprm,
        registeredCountry: t.country,
        serviceLocations: t.serviceLocations,
        dataLocations: t.dataLocations,
        informationTypes: t.infoTypes,
        supportsCriticalFunction: t.critical,
        ictServiceCategory: t.category,
        criticality: t.criticality,
        inherentRiskScore: t.inherent,
        residualRiskScore: t.residual,
        dueDiligenceStatus: t.dd,
        status: t.status,
        concentrationRisk: t.concentration,
        substitutability: t.substitutability,
        auditRights: t.tpId !== "TP-012",
        incidentReporting: t.critical,
        assessmentDate: t.assessmentDaysAgo != null ? daysFromNow(-t.assessmentDaysAgo) : null,
        nextReviewDate: t.nextReviewInDays != null ? daysFromNow(t.nextReviewInDays) : null,
        openFindings:
          t.tpId === "TP-002"
            ? "Exit-Plan-Test überfällig; Nachweis Notfallübung 2026 ausstehend"
            : t.tpId === "TP-006"
              ? "Due Diligence läuft; ISO-27001-Zertifikat angefordert"
              : null,
      },
    });
    tps.push(tp.id);
    if (t.contractEndInDays !== null || t.tpId === "TP-012") {
      await db.contract.create({
        data: {
          thirdPartyId: tp.id,
          title: `Rahmenvertrag ${t.name}`,
          startDate: daysFromNow(-700),
          endDate: t.contractEndInDays != null ? daysFromNow(t.contractEndInDays) : null,
          noticePeriodDays: t.critical ? 180 : 90,
          auditRights: t.tpId !== "TP-012",
          accessRights: t.critical,
          incidentReporting: t.critical,
          notes: t.critical ? "DORA-Vertragsklauseln (Audit-, Zugangs-, Exit-Rechte) enthalten." : null,
        },
      });
    }
    // Exit-Strategie: 2 fehlend (TP-006 kritisch!, TP-005/009/012 unkritisch), 2 ungetestet (TP-002, TP-010)
    if (t.exit !== "MISSING") {
      await db.exitStrategy.create({
        data: {
          thirdPartyId: tp.id,
          strategySummary:
            t.exit === "DRAFT"
              ? "Entwurf: Rückführung auf Alternativanbieter, Datenexport vertraglich gesichert."
              : "Gestufter Exit: Parallelbetrieb, Datenmigration, Vertragsübergabe; Alternativanbieter identifiziert.",
          exitPlanExists: t.exit !== "DRAFT",
          lastTestDate: t.exit === "TESTED" ? daysFromNow(-150) : null,
          testResult: t.exit === "TESTED" ? "PASSED_WITH_FINDINGS" : null,
          substituteOptions: t.substitutability === "EASY" ? "Mehrere Marktalternativen verfügbar" : "Begrenzte Alternativen, Migrationsaufwand hoch",
          status: t.exit === "TESTED" ? "TESTED" : t.exit === "APPROVED" ? "APPROVED" : t.exit === "UNTESTED" ? "APPROVED" : "DRAFT",
        },
      });
    }
    for (const [sname, scountry, sservice, scritical] of t.subs ?? []) {
      await db.subcontractor.create({
        data: { thirdPartyId: tp.id, name: sname, country: scountry, service: sservice, critical: scritical },
      });
    }
  }

  // ---------- ICT-Services (8) ----------
  const ictDefs: Array<[string, string, string, string | null, number[]]> = [
    ["Kundenportal-Hosting", "Betrieb der Portal-Infrastruktur", "CLOUD_HOSTING", tps[0]!, [2]],
    ["Zahlungsverkehrs-Processing", "SEPA-/SWIFT-Verarbeitung", "PAYMENT_PROCESSING", tps[1]!, [0]],
    ["Identity & Access Management", "Zentrale Authentisierung/Autorisierung", "SECURITY_SERVICES", tps[2]!, [0, 2, 4]],
    ["Security Operations Center", "24/7-Überwachung und Response", "SECURITY_SERVICES", tps[6]!, [0, 1, 2, 4]],
    ["Handelsplattform-Betrieb", "Betrieb TradeLine", "TRADING_SYSTEMS", tps[5]!, [4]],
    ["Regulatorisches Melde-SaaS", "Meldewesen-Software als Service", "SAAS", tps[9]!, [3]],
    ["Standortvernetzung (WAN)", "Netzanbindung aller Standorte", "NETWORK", tps[10]!, [0, 1, 2, 4]],
    ["Interne Betriebsplattform", "Eigenbetriebene Container-Plattform", "DATA_CENTER", null, [1, 3]],
  ];
  const icts: string[] = [];
  for (const [name, description, category, providerId, cfIdx] of ictDefs) {
    const s = await db.ictService.create({
      data: {
        name,
        description,
        category,
        providerId,
        criticalFunctions: { connect: cfIdx.map((i) => ({ id: cfs[i]! })) },
      },
    });
    icts.push(s.id);
  }

  // ---------- Risikokategorien (Appetit = max. akzeptierter Residual-Score) ----------
  const catDefs: Array<[string, string, string, number]> = [
    ["CYBER", "Cyber & Angriffe", "Externe und interne Angriffe auf ICT-Systeme", 6],
    ["AVAILABILITY", "Verfügbarkeit & Kontinuität", "Ausfälle von Systemen, Services und Standorten", 8],
    ["THIRD_PARTY", "Drittparteien & Auslagerung", "Risiken aus ICT-Drittparteien und Subdienstleistern", 6],
    ["DATA", "Daten & Vertraulichkeit", "Datenverlust, -abfluss und Datenschutzverstöße", 6],
    ["CHANGE", "Change & Projekte", "Risiken aus Änderungen, Releases und Projekten", 9],
    ["COMPLIANCE", "Regulatorik & Compliance", "Nichterfüllung regulatorischer Anforderungen", 6],
    ["IDENTITY", "Identitäten & Zugriffe", "Unberechtigte Zugriffe, Berechtigungsmängel", 6],
  ];
  const cats = new Map<string, string>();
  for (const [key, name, description, appetiteThreshold] of catDefs) {
    const c = await db.riskCategory.create({ data: { key, name, description, appetiteThreshold } });
    cats.set(key, c.id);
  }

  // ---------- Regulatorische Anforderungen ----------
  const regDefs: Array<[string, string, string, string, string]> = [
    ["DORA-GOV-01", "DORA", "Kap. II, Art. 5–6", "IKT-Risikomanagementrahmen", "Einrichtung und Pflege eines soliden, umfassenden IKT-Risikomanagementrahmens"],
    ["DORA-GOV-02", "DORA", "Kap. II, Art. 6", "Risikotoleranz für IKT-Risiken", "Festlegung und Überwachung der Risikotoleranzschwelle für IKT-Risiken"],
    ["DORA-PROT-01", "DORA", "Kap. II, Art. 9", "Schutz und Prävention", "Schutzmaßnahmen für IKT-Systeme (Sicherheitsrichtlinien, Netzwerksicherheit, Verschlüsselung)"],
    ["DORA-DET-01", "DORA", "Kap. II, Art. 10", "Erkennung anomaler Aktivitäten", "Mechanismen zur Erkennung anomaler Aktivitäten und IKT-Vorfälle"],
    ["DORA-INC-01", "DORA", "Kap. III", "IKT-Vorfallsmanagement", "Prozess zur Behandlung und Klassifizierung IKT-bezogener Vorfälle inkl. Meldung"],
    ["DORA-TEST-01", "DORA", "Kap. IV", "Tests der digitalen Resilienz", "Programm zum Testen der digitalen operationalen Resilienz"],
    ["DORA-TPR-01", "DORA", "Kap. V, Art. 28", "Management des IKT-Drittparteienrisikos", "Strategie und Register für IKT-Drittparteien; Bewertung vor Vertragsschluss"],
    ["DORA-TPR-02", "DORA", "Kap. V, Art. 28–30", "Vertragliche Mindestinhalte", "Audit-, Zugangs-, Kündigungs- und Exit-Rechte in IKT-Verträgen"],
    ["DORA-TPR-03", "DORA", "Kap. V", "Konzentrationsrisiko", "Bewertung von IKT-Konzentrationsrisiken vor und während der Auslagerung"],
    ["EBA-ICT-01", "EBA_ICT", "Abschn. 3.3", "ICT-Risikomanagement-Governance", "Governance und Strategie für ICT- und Sicherheitsrisiken"],
    ["EBA-ICT-02", "EBA_ICT", "Abschn. 3.4", "Informationssicherheitsrichtlinie", "Dokumentierte Informationssicherheitsrichtlinie und -organisation"],
    ["EBA-OUT-01", "EBA_OUTSOURCING", "Abschn. 12", "Auslagerungsregister", "Führung eines vollständigen Registers aller Auslagerungen"],
    ["EBA-OUT-02", "EBA_OUTSOURCING", "Abschn. 15", "Exit-Strategien", "Dokumentierte Exit-Strategien für kritische Auslagerungen"],
    ["ISO-A5", "ISO27001", "A.5", "Organisatorische Kontrollen", "Richtlinien, Rollen, Verantwortlichkeiten und Bedrohungsinformationen"],
    ["ISO-A8", "ISO27001", "A.8", "Technische Kontrollen", "Zugriffssteuerung, Verschlüsselung, Logging, Schwachstellenmanagement"],
    ["ISO27005-RA", "ISO27005", "Kap. 7–8", "Risikobeurteilung", "Methodik für Identifikation, Analyse und Bewertung von Informationssicherheitsrisiken"],
    ["NIST-ID", "NIST_CSF", "Identify/Protect", "Asset- und Risikotransparenz", "Identifikation von Assets, Geschäftsumfeld und Risiken; Schutzmaßnahmen"],
    ["NIS2-GOV", "NIS2", "Art. 20–21", "Governance & Risikomaßnahmen", "Verantwortung der Leitung, Risikomanagementmaßnahmen (soweit anwendbar)"],
    ["INT-POL-01", "INTERNAL", "Richtlinie IS-01", "Interne Informationssicherheits-Policy", "Konzernweite Vorgaben zu Informationssicherheit und Risikoappetit"],
  ];
  const regs = new Map<string, string>();
  for (const [refId, framework, reference, title, description] of regDefs) {
    const r = await db.regulatoryRequirement.create({
      data: { refId, framework, reference, title, description },
    });
    regs.set(refId, r.id);
  }

  // ---------- Kontrollen (20) ----------
  const ctlDefs: Array<[string, string, string, string, string, string, string, string, string, number, string[]]> = [
    // id, name, objective, type, automation, frequency, designEff, operEff, nextTestInDays(sign), regs
    ["CTL-001", "Multi-Faktor-Authentifizierung", "Schutz vor unberechtigtem Zugriff auf Kernsysteme", "PREVENTIVE", "AUTOMATED", "CONTINUOUS", "EFFECTIVE", "EFFECTIVE", "90", 90, ["DORA-PROT-01", "ISO-A8"]],
    ["CTL-002", "Privilegierte Zugriffsverwaltung (PAM)", "Kontrolle administrativer Zugriffe", "PREVENTIVE", "SEMI_AUTOMATED", "CONTINUOUS", "LARGELY_EFFECTIVE", "PARTIALLY_EFFECTIVE", "30", 30, ["ISO-A8", "DORA-PROT-01"]],
    ["CTL-003", "Berechtigungs-Rezertifizierung", "Regelmäßige Überprüfung vergebener Berechtigungen", "DETECTIVE", "SEMI_AUTOMATED", "QUARTERLY", "EFFECTIVE", "PARTIALLY_EFFECTIVE", "-10", -10, ["ISO-A5", "EBA-ICT-02"]],
    ["CTL-004", "Patch- und Schwachstellenmanagement", "Zeitnahe Behebung bekannter Schwachstellen", "PREVENTIVE", "SEMI_AUTOMATED", "MONTHLY", "LARGELY_EFFECTIVE", "PARTIALLY_EFFECTIVE", "45", 45, ["DORA-PROT-01", "ISO-A8"]],
    ["CTL-005", "Security Monitoring (SOC/SIEM)", "Erkennung anomaler Aktivitäten und Angriffe", "DETECTIVE", "AUTOMATED", "CONTINUOUS", "EFFECTIVE", "EFFECTIVE", "120", 120, ["DORA-DET-01"]],
    ["CTL-006", "Backup und Wiederherstellungstests", "Wiederherstellbarkeit kritischer Daten", "CORRECTIVE", "SEMI_AUTOMATED", "MONTHLY", "EFFECTIVE", "LARGELY_EFFECTIVE", "60", 60, ["DORA-TEST-01", "ISO-A8"]],
    ["CTL-007", "Notfall- und BCM-Übungen", "Nachweis der Reaktionsfähigkeit bei Ausfällen", "CORRECTIVE", "MANUAL", "ANNUALLY", "LARGELY_EFFECTIVE", "NOT_TESTED", "75", 75, ["DORA-TEST-01"]],
    ["CTL-008", "Change-Management-Freigaben", "Kontrollierte Produktionsänderungen", "PREVENTIVE", "SEMI_AUTOMATED", "CONTINUOUS", "EFFECTIVE", "LARGELY_EFFECTIVE", "100", 100, ["EBA-ICT-01"]],
    ["CTL-009", "Netzwerksegmentierung", "Begrenzung der Ausbreitung von Angriffen", "PREVENTIVE", "AUTOMATED", "CONTINUOUS", "LARGELY_EFFECTIVE", "LARGELY_EFFECTIVE", "150", 150, ["DORA-PROT-01", "ISO-A8"]],
    ["CTL-010", "Verschlüsselung ruhender Daten", "Schutz der Vertraulichkeit gespeicherter Daten", "PREVENTIVE", "AUTOMATED", "CONTINUOUS", "EFFECTIVE", "EFFECTIVE", "180", 180, ["DORA-PROT-01", "ISO-A8"]],
    ["CTL-011", "Security-Awareness-Programm", "Sensibilisierung der Mitarbeitenden (Phishing u. a.)", "PREVENTIVE", "MANUAL", "QUARTERLY", "LARGELY_EFFECTIVE", "PARTIALLY_EFFECTIVE", "40", 40, ["ISO-A5"]],
    ["CTL-012", "Drittparteien-Due-Diligence", "Risikoprüfung vor Vertragsschluss", "PREVENTIVE", "MANUAL", "EVENT_DRIVEN", "EFFECTIVE", "LARGELY_EFFECTIVE", "110", 110, ["DORA-TPR-01", "EBA-OUT-01"]],
    ["CTL-013", "Laufende Drittparteien-Überwachung", "Kontinuierliches Monitoring kritischer Drittparteien", "DETECTIVE", "SEMI_AUTOMATED", "QUARTERLY", "LARGELY_EFFECTIVE", "PARTIALLY_EFFECTIVE", "-5", -5, ["DORA-TPR-01", "EBA-OUT-01"]],
    ["CTL-014", "Vertragsklausel-Standard (DORA)", "Verpflichtende Vertragsinhalte für ICT-Verträge", "PREVENTIVE", "MANUAL", "EVENT_DRIVEN", "EFFECTIVE", "LARGELY_EFFECTIVE", "200", 200, ["DORA-TPR-02", "EBA-OUT-02"]],
    ["CTL-015", "Exit-Plan-Tests", "Nachweis der Durchführbarkeit von Exit-Strategien", "CORRECTIVE", "MANUAL", "ANNUALLY", "PARTIALLY_EFFECTIVE", "INEFFECTIVE", "-20", -20, ["EBA-OUT-02", "DORA-TPR-02"]],
    ["CTL-016", "Incident-Response-Prozess", "Strukturierte Reaktion auf Sicherheitsvorfälle", "CORRECTIVE", "SEMI_AUTOMATED", "CONTINUOUS", "EFFECTIVE", "LARGELY_EFFECTIVE", "85", 85, ["DORA-INC-01"]],
    ["CTL-017", "Data-Loss-Prevention (DLP)", "Verhinderung unautorisierten Datenabflusses", "DETECTIVE", "AUTOMATED", "CONTINUOUS", "PARTIALLY_EFFECTIVE", "PARTIALLY_EFFECTIVE", "25", 25, ["ISO-A8"]],
    ["CTL-018", "Sichere Softwareentwicklung (SSDLC)", "Sicherheitsanforderungen im Entwicklungsprozess", "PREVENTIVE", "SEMI_AUTOMATED", "CONTINUOUS", "LARGELY_EFFECTIVE", "NOT_TESTED", "55", 55, ["ISO-A8", "DORA-PROT-01"]],
    ["CTL-019", "Protokollierung und Log-Schutz", "Nachvollziehbarkeit sicherheitsrelevanter Ereignisse", "DETECTIVE", "AUTOMATED", "CONTINUOUS", "EFFECTIVE", "EFFECTIVE", "140", 140, ["ISO-A8", "DORA-DET-01"]],
    ["CTL-020", "Physische Zutrittskontrolle RZ", "Schutz der Rechenzentrumsinfrastruktur", "PREVENTIVE", "SEMI_AUTOMATED", "CONTINUOUS", "EFFECTIVE", "EFFECTIVE", "160", 160, ["ISO-A5"]],
  ];
  const ctls: string[] = [];
  for (const [controlId, name, objective, controlType, automation, frequency, de, oe, _s, nextTestDays, regRefs] of ctlDefs) {
    const c = await db.control.create({
      data: {
        controlId,
        name,
        objective,
        description: `${objective}. Kontrolle wird ${automation === "MANUAL" ? "manuell" : automation === "AUTOMATED" ? "automatisiert" : "teilautomatisiert"} ausgeführt.`,
        controlType,
        automation,
        frequency,
        ownerId: uCo,
        designEffectiveness: de,
        operatingEffectiveness: oe,
        nextTestDate: daysFromNow(Number(nextTestDays)),
        regulatoryRequirements: { connect: regRefs.map((r) => ({ id: regs.get(r)! })) },
        assets: { connect: [{ id: assets[0]! }] },
      },
    });
    ctls.push(c.id);
  }
  // Kontrolltests (Beispiele, inkl. eines negativen Ergebnisses)
  await db.controlAssessment.create({
    data: { controlId: ctls[14]!, testedById: uIso, testDate: daysFromNow(-30), testResult: "FAILED", designEffectiveness: "PARTIALLY_EFFECTIVE", operatingEffectiveness: "INEFFECTIVE", findings: "Exit-Plan-Tests für 2 kritische Drittparteien nicht durchgeführt; Testkonzept veraltet.", evidenceNote: "EV-011" },
  });
  await db.controlAssessment.create({
    data: { controlId: ctls[0]!, testedById: uSl, testDate: daysFromNow(-45), testResult: "PASSED", designEffectiveness: "EFFECTIVE", operatingEffectiveness: "EFFECTIVE", findings: null, evidenceNote: "EV-004" },
  });
  await db.controlAssessment.create({
    data: { controlId: ctls[2]!, testedById: uIso, testDate: daysFromNow(-70), testResult: "PASSED_WITH_FINDINGS", designEffectiveness: "EFFECTIVE", operatingEffectiveness: "PARTIALLY_EFFECTIVE", findings: "Rezertifizierung Q2 in 2 Bereichen verspätet abgeschlossen.", evidenceNote: "EV-005" },
  });

  // ---------- Risiken (25) ----------
  interface RiskSeed {
    n: number;
    title: string;
    cat: string;
    l: number;
    i: number;
    eff: number; // 0/25/50/75/100
    status: string;
    strategy: string | null;
    ou: string;
    loc: string;
    assets: number[];
    bps: number[];
    icts: number[];
    cfs: number[];
    tps: number[];
    ctls: number[];
    regs: string[];
    reviewInDays: number | null;
    owner: boolean; // hat Risk Owner?
    cause: string;
    event: string;
    impact: string;
    threat: string;
    vuln: string;
  }
  const riskSeeds: RiskSeed[] = [
    { n: 1, title: "Ransomware-Angriff auf Core Banking", cat: "CYBER", l: 3, i: 5, eff: 75, status: "TREATMENT", strategy: "REDUCE", ou: ouIT.id, loc: locFfm.id, assets: [0, 5], bps: [0], icts: [7], cfs: [0, 1], tps: [], ctls: [0, 3, 4, 5, 15], regs: ["DORA-PROT-01", "DORA-DET-01"], reviewInDays: 80, owner: true, cause: "Zunehmende Professionalisierung von Ransomware-Gruppen bei gleichzeitig verzögertem Patching einzelner Legacy-Komponenten.", event: "Verschlüsselung zentraler Core-Banking-Komponenten durch Ransomware.", impact: "Ausfall des Zahlungsverkehrs und der Kontoführung über mehrere Tage; Wiederanlaufkosten; aufsichtsrechtliche Meldungen; Reputationsschaden.", threat: "Organisierte Ransomware-Gruppen", vuln: "Verzögertes Patching bei Legacy-Systemen" },
    { n: 2, title: "Ausfall des Zahlungsverkehrs-Dienstleisters", cat: "THIRD_PARTY", l: 2, i: 5, eff: 50, status: "OPEN", strategy: "REDUCE", ou: ouIT.id, loc: locFfm.id, assets: [1], bps: [0], icts: [1], cfs: [0], tps: [1], ctls: [12, 6], regs: ["DORA-TPR-01", "DORA-TPR-03"], reviewInDays: 45, owner: true, cause: "Hohe Abhängigkeit von einem einzelnen Processing-Dienstleister ohne kurzfristige Ausweichoption.", event: "Mehrtägiger Ausfall der SEPA-/SWIFT-Verarbeitung bei PaySwift Processing S.A.", impact: "Zahlungsverkehr als kritische Funktion unterbrochen; Vertragsstrafen; Meldepflichten; Kundenabwanderung.", threat: "Betriebsausfall beim Dienstleister", vuln: "Fehlende getestete Exit-/Ausweichoption" },
    { n: 3, title: "Phishing-Kampagnen gegen Mitarbeitende", cat: "CYBER", l: 4, i: 3, eff: 50, status: "MONITORING", strategy: "REDUCE", ou: ouCF.id, loc: locSb.id, assets: [8], bps: [2], icts: [2], cfs: [2], tps: [], ctls: [10, 0, 4], regs: ["DORA-PROT-01", "ISO-A5"], reviewInDays: 120, owner: true, cause: "Gezielte Social-Engineering-Kampagnen gegen Finanzinstitute.", event: "Kompromittierung von Mitarbeiter-Konten durch Phishing.", impact: "Unberechtigter Zugriff auf interne Systeme; möglicher Datenabfluss; Folgeangriffe.", threat: "Phishing / Social Engineering", vuln: "Menschlicher Faktor, unvollständige Awareness" },
    { n: 4, title: "Cloud-Konzentrationsrisiko Hosting-Anbieter", cat: "THIRD_PARTY", l: 3, i: 4, eff: 25, status: "OPEN", strategy: "REDUCE", ou: ouIT.id, loc: locFfm.id, assets: [2], bps: [0, 4], icts: [0], cfs: [2], tps: [0, 9], ctls: [12, 14], regs: ["DORA-TPR-03"], reviewInDays: 30, owner: true, cause: "Mehrere kritische Services (Portal, Melde-SaaS) laufen direkt oder mittelbar beim selben Cloud-Anbieter.", event: "Großflächiger Ausfall oder Insolvenz des Cloud-Anbieters CloudRhein GmbH.", impact: "Gleichzeitiger Ausfall mehrerer kritischer Services; keine kurzfristige Migrationsmöglichkeit.", threat: "Anbieterausfall / Insolvenz", vuln: "Konzentration mehrerer Services bei einem Anbieter" },
    { n: 5, title: "Unzureichende Exit-Fähigkeit Handelsplattform", cat: "THIRD_PARTY", l: 3, i: 4, eff: 0, status: "OPEN", strategy: null, ou: ouPB.id, loc: locPar.id, assets: [6], bps: [1], icts: [4], cfs: [4], tps: [5], ctls: [14], regs: ["EBA-OUT-02", "DORA-TPR-02"], reviewInDays: 20, owner: true, cause: "Für die Handelsplattform existiert keine dokumentierte Exit-Strategie; Due Diligence noch nicht abgeschlossen.", event: "Notwendiger kurzfristiger Anbieterwechsel ohne vorbereiteten Exit-Plan.", impact: "Längerer Ausfall der Handelsfunktion; unkontrollierte Migrationskosten; regulatorische Beanstandung.", threat: "Vendor Lock-in", vuln: "Fehlende Exit-Strategie und ungetesteter Exit-Plan" },
    { n: 6, title: "Datenabfluss über fehlerhafte DLP-Abdeckung", cat: "DATA", l: 3, i: 4, eff: 25, status: "TREATMENT", strategy: "REDUCE", ou: ouWM.id, loc: locLux.id, assets: [3], bps: [4], icts: [7], cfs: [], tps: [3], ctls: [16, 9], regs: ["ISO-A8"], reviewInDays: 60, owner: true, cause: "DLP-Regeln decken neue Cloud-Kollaborationskanäle nicht ab.", event: "Unbemerkter Abfluss vertraulicher Kundendaten über nicht überwachte Kanäle.", impact: "Datenschutzverletzung; Meldepflichten; Bußgelder; Vertrauensverlust.", threat: "Innentäter / versehentliche Weitergabe", vuln: "Lückenhafte DLP-Abdeckung" },
    { n: 7, title: "Verspätete Rezertifizierung privilegierter Rechte", cat: "IDENTITY", l: 4, i: 3, eff: 50, status: "TREATMENT", strategy: "REDUCE", ou: ouIT.id, loc: locFfm.id, assets: [9], bps: [5], icts: [2], cfs: [], tps: [2], ctls: [1, 2], regs: ["ISO-A8", "EBA-ICT-02"], reviewInDays: 40, owner: true, cause: "Rezertifizierungskampagnen werden manuell gesteuert und verzögern sich wiederholt.", event: "Verwaiste oder überprivilegierte Konten bleiben über Monate bestehen.", impact: "Erhöhtes Missbrauchs- und Angriffspotenzial; Prüfungsfeststellungen.", threat: "Missbrauch überprivilegierter Konten", vuln: "Manuelle, verzögerte Rezertifizierung" },
    { n: 8, title: "Ausfall Rechenzentrum Frankfurt", cat: "AVAILABILITY", l: 2, i: 5, eff: 75, status: "MONITORING", strategy: "REDUCE", ou: ouIT.id, loc: locFfm.id, assets: [4, 5], bps: [0, 1], icts: [7], cfs: [0, 1], tps: [], ctls: [5, 6, 19], regs: ["DORA-TEST-01"], reviewInDays: 150, owner: true, cause: "Standortkonzentration zentraler Infrastruktur in einem Rechenzentrum.", event: "Längerer RZ-Ausfall (Brand, Stromversorgung, Kühlung).", impact: "Unterbrechung kritischer Funktionen bis zum Schwenk auf den Ausweichstandort.", threat: "Elementarereignisse, technisches Versagen", vuln: "Begrenzte Georedundanz einzelner Altsysteme" },
    { n: 9, title: "SaaS-Meldewesen: Anbieterabhängigkeit", cat: "THIRD_PARTY", l: 3, i: 3, eff: 25, status: "OPEN", strategy: null, ou: ouCF.id, loc: locLux.id, assets: [7], bps: [3], icts: [5], cfs: [3], tps: [9], ctls: [12, 13], regs: ["DORA-TPR-01", "EBA-OUT-01"], reviewInDays: 15, owner: true, cause: "Meldewesen-SaaS wird von einem Anbieter betrieben, dessen Vertrag in Kürze ausläuft; Exit-Plan ungetestet.", event: "Vertragsende ohne rechtzeitige Verlängerung oder Migrationsoption.", impact: "Verspätete aufsichtsrechtliche Meldungen; Sanktionen.", threat: "Vertrags-/Anbieterrisiko", vuln: "Ungetesteter Exit-Plan, kurze Restlaufzeit" },
    { n: 10, title: "Fehlerhafte Changes in Kernsystemen", cat: "CHANGE", l: 3, i: 4, eff: 75, status: "MONITORING", strategy: "REDUCE", ou: ouIT.id, loc: locFfm.id, assets: [0], bps: [5], icts: [7], cfs: [0, 1], tps: [], ctls: [7, 17], regs: ["EBA-ICT-01"], reviewInDays: 170, owner: true, cause: "Hohe Release-Frequenz bei komplexen Abhängigkeiten.", event: "Fehlerhafter Change verursacht Produktionsstörung im Core Banking.", impact: "Teilausfall von Buchungsprozessen; Nacharbeiten; Kundenbeschwerden.", threat: "Fehlbedienung / Prozessfehler", vuln: "Komplexität, unvollständige Testabdeckung" },
    { n: 11, title: "DDoS-Angriff auf Kundenportal", cat: "CYBER", l: 4, i: 3, eff: 75, status: "MONITORING", strategy: "REDUCE", ou: ouIT.id, loc: locSb.id, assets: [2], bps: [], icts: [0, 6], cfs: [2], tps: [0, 10], ctls: [8, 4], regs: ["DORA-PROT-01", "DORA-DET-01"], reviewInDays: 200, owner: true, cause: "Finanzinstitute sind bevorzugtes Ziel von DDoS-Erpressungen.", event: "Volumetrischer DDoS-Angriff auf das Kundenportal.", impact: "Nichtverfügbarkeit des Online-Bankings; Kundenunzufriedenheit.", threat: "DDoS-Angriffe", vuln: "Exponierte Internet-Services" },
    { n: 12, title: "Subdienstleister-Kette Cloud-Hosting intransparent", cat: "THIRD_PARTY", l: 3, i: 3, eff: 25, status: "OPEN", strategy: null, ou: ouIT.id, loc: locFfm.id, assets: [2], bps: [], icts: [0], cfs: [2], tps: [0], ctls: [13], regs: ["DORA-TPR-01"], reviewInDays: 25, owner: false, cause: "Subdienstleister des Cloud-Anbieters und deren Standorte sind nur teilweise dokumentiert.", event: "Sicherheits- oder Verfügbarkeitsvorfall bei einem unbekannten Subdienstleister.", impact: "Unerkannte Abhängigkeiten; verzögerte Reaktion; regulatorische Lücken im Register.", threat: "Intransparente Lieferkette", vuln: "Unvollständige Subdienstleister-Dokumentation" },
    { n: 13, title: "Insider-Missbrauch von Kundendaten", cat: "DATA", l: 2, i: 4, eff: 50, status: "MONITORING", strategy: "REDUCE", ou: ouPB.id, loc: locFfm.id, assets: [0, 3], bps: [2], icts: [], cfs: [], tps: [], ctls: [2, 16, 18], regs: ["ISO-A8"], reviewInDays: 190, owner: true, cause: "Weitreichende Leseberechtigungen in Kundensystemen.", event: "Missbräuchlicher Abruf und Weitergabe von Kundendaten durch Innentäter.", impact: "Datenschutzverletzung, strafrechtliche Relevanz, Reputationsschaden.", threat: "Innentäter", vuln: "Überbreite Berechtigungen" },
    { n: 14, title: "Veraltete Kryptografie in Legacy-Schnittstellen", cat: "CYBER", l: 3, i: 3, eff: 50, status: "TREATMENT", strategy: "REDUCE", ou: ouIT.id, loc: locFfm.id, assets: [1, 5], bps: [0], icts: [], cfs: [0], tps: [], ctls: [9], regs: ["ISO-A8"], reviewInDays: 90, owner: true, cause: "Historisch gewachsene Schnittstellen nutzen veraltete TLS-Konfigurationen.", event: "Ausnutzung schwacher Verschlüsselung zur Kompromittierung von Datenübertragungen.", impact: "Vertraulichkeitsverlust bei Zahlungsdaten.", threat: "Kryptografische Angriffe", vuln: "Veraltete Protokollversionen" },
    { n: 15, title: "Nichterfüllung DORA-Registerpflichten", cat: "COMPLIANCE", l: 3, i: 4, eff: 50, status: "TREATMENT", strategy: "REDUCE", ou: ouCF.id, loc: locFfm.id, assets: [], bps: [3], icts: [], cfs: [3], tps: [], ctls: [11, 13], regs: ["DORA-TPR-01", "EBA-OUT-01"], reviewInDays: 70, owner: true, cause: "Das Informationsregister zu ICT-Drittparteien ist historisch unvollständig.", event: "Aufsichtsanfrage trifft auf lückenhaftes Drittparteienregister.", impact: "Aufsichtsrechtliche Feststellungen; Nacharbeiten unter Zeitdruck.", threat: "Regulatorische Prüfung", vuln: "Unvollständige Registerdaten" },
    { n: 16, title: "Schatten-IT in Fachbereichen", cat: "IDENTITY", l: 4, i: 2, eff: 25, status: "IN_ASSESSMENT", strategy: null, ou: ouWM.id, loc: locLux.id, assets: [8], bps: [4], icts: [], cfs: [], tps: [], ctls: [], regs: ["ISO-A5"], reviewInDays: null, owner: false, cause: "Fachbereiche nutzen nicht freigegebene Cloud-Tools zur Zusammenarbeit.", event: "Verarbeitung vertraulicher Daten in nicht bewerteten Diensten.", impact: "Unbewertete Risiken; Datenschutz- und Sicherheitslücken.", threat: "Unkontrollierte Dienste", vuln: "Fehlende Governance für Tool-Einführung" },
    { n: 17, title: "Fehlende Wiederanlauftests Ausweich-RZ", cat: "AVAILABILITY", l: 3, i: 4, eff: 25, status: "QUALITY_REVIEW", strategy: null, ou: ouIT.id, loc: locFfm.id, assets: [4], bps: [0], icts: [7], cfs: [0, 1], tps: [], ctls: [6], regs: ["DORA-TEST-01"], reviewInDays: null, owner: true, cause: "Die jährliche Wiederanlaufübung wurde zweimal verschoben.", event: "Schwenk auf das Ausweich-RZ schlägt im Ernstfall fehl.", impact: "Verlängerte Ausfallzeit kritischer Funktionen.", threat: "Technisches Versagen im Failover", vuln: "Ungetestete Wiederanlaufprozeduren" },
    { n: 18, title: "Kompromittierung des SOC-Dienstleisters", cat: "THIRD_PARTY", l: 2, i: 4, eff: 50, status: "OPEN", strategy: "REDUCE", ou: ouIT.id, loc: locFfm.id, assets: [5], bps: [], icts: [3], cfs: [0, 2], tps: [6], ctls: [12, 13], regs: ["DORA-TPR-01"], reviewInDays: 55, owner: true, cause: "Der SOC-Dienstleister hat weitreichenden Einblick in Sicherheitsarchitektur und Logdaten.", event: "Kompromittierung des Dienstleisters mit Zugriff auf Kundendaten mehrerer Institute.", impact: "Abfluss sicherheitsrelevanter Informationen; gezielte Folgeangriffe.", threat: "Supply-Chain-Angriff", vuln: "Privilegierter Einblick des Dienstleisters" },
    { n: 19, title: "Manipulation von Meldedaten", cat: "DATA", l: 2, i: 4, eff: 75, status: "MONITORING", strategy: "REDUCE", ou: ouCF.id, loc: locLux.id, assets: [7], bps: [3], icts: [5], cfs: [3], tps: [9], ctls: [18, 7], regs: ["DORA-PROT-01"], reviewInDays: 210, owner: true, cause: "Meldedaten durchlaufen mehrere manuelle Verarbeitungsschritte.", event: "Unbemerkte Manipulation oder Korruption von Meldedaten vor Abgabe.", impact: "Fehlerhafte aufsichtsrechtliche Meldungen; Korrekturaufwand; Sanktionen.", threat: "Manipulation / Integritätsverlust", vuln: "Manuelle Prozessschritte ohne durchgängige Prüfsummen" },
    { n: 20, title: "Ausfall WAN-Anbindung Standorte", cat: "AVAILABILITY", l: 3, i: 3, eff: 75, status: "MONITORING", strategy: "REDUCE", ou: ouIT.id, loc: locSb.id, assets: [5], bps: [], icts: [6], cfs: [0, 2], tps: [10], ctls: [8], regs: ["DORA-TPR-03"], reviewInDays: 230, owner: true, cause: "Standortvernetzung über einen Carrier mit begrenzter Pfadredundanz.", event: "Mehrstündiger WAN-Ausfall einzelner Standorte.", impact: "Eingeschränkte Arbeitsfähigkeit; Umschaltaufwand.", threat: "Carrier-Ausfall, Tiefbauschäden", vuln: "Begrenzte Pfadredundanz" },
    { n: 21, title: "Unzureichende Kontrolle der KI-gestützten Tools", cat: "CHANGE", l: 3, i: 3, eff: 25, status: "IN_ASSESSMENT", strategy: null, ou: ouIT.id, loc: locSb.id, assets: [8], bps: [5], icts: [], cfs: [], tps: [], ctls: [], regs: ["INT-POL-01"], reviewInDays: null, owner: true, cause: "Einführung KI-gestützter Assistenz-Tools ohne abgeschlossene Risikobewertung.", event: "Vertrauliche Daten werden in nicht freigegebene KI-Dienste eingegeben.", impact: "Datenabfluss; unklare Rechtslage; Compliance-Verstöße.", threat: "Unkontrollierte Datenverarbeitung", vuln: "Fehlende Nutzungsrichtlinie und technische Leitplanken" },
    { n: 22, title: "Personalengpass ICT-Risikomanagement", cat: "COMPLIANCE", l: 4, i: 2, eff: 25, status: "ACCEPTED", strategy: "ACCEPT", ou: ouCF.id, loc: locSb.id, assets: [], bps: [], icts: [], cfs: [], tps: [], ctls: [], regs: ["DORA-GOV-01"], reviewInDays: 100, owner: true, cause: "Offene Stellen im Risikomanagement-Team bei wachsendem Aufgabenumfang.", event: "Reviews und Reports können nicht fristgerecht erstellt werden.", impact: "Qualitäts- und Terminrisiken in der Risikosteuerung.", threat: "Ressourcenengpass", vuln: "Personaldecke", },
    { n: 23, title: "Fehlende MFA für Legacy-Fachanwendung", cat: "IDENTITY", l: 3, i: 3, eff: 50, status: "TREATMENT", strategy: "REDUCE", ou: ouPB.id, loc: locFfm.id, assets: [0], bps: [2], icts: [2], cfs: [], tps: [2], ctls: [0], regs: ["ISO-A8"], reviewInDays: 85, owner: true, cause: "Eine Legacy-Fachanwendung unterstützt keine moderne MFA-Integration.", event: "Kontoübernahme durch gestohlene Zugangsdaten.", impact: "Unberechtigte Transaktionen; Datenabfluss.", threat: "Credential Stuffing", vuln: "Fehlende MFA-Unterstützung" },
    { n: 24, title: "Vertragsende Druckdienstleister ohne Nachfolge", cat: "THIRD_PARTY", l: 4, i: 2, eff: 50, status: "OPEN", strategy: null, ou: ouCF.id, loc: locFfm.id, assets: [], bps: [], icts: [], cfs: [], tps: [8], ctls: [13], regs: ["EBA-OUT-01"], reviewInDays: 35, owner: false, cause: "Rahmenvertrag läuft in unter 90 Tagen aus; Ausschreibung verzögert.", event: "Vertragsende ohne Anschlusslösung für Kundenkommunikation.", impact: "Verzögerter Versand gesetzlich erforderlicher Kundeninformationen.", threat: "Vertragsauslauf", vuln: "Verzögerte Beschaffung" },
    { n: 25, title: "Draft: Quantencomputing-Bedrohung für Kryptografie", cat: "CYBER", l: 2, i: 4, eff: 0, status: "DRAFT", strategy: null, ou: ouIT.id, loc: locFfm.id, assets: [9], bps: [], icts: [], cfs: [], tps: [], ctls: [], regs: [], reviewInDays: null, owner: false, cause: "Mittel- bis langfristige Entwicklung leistungsfähiger Quantencomputer.", event: "Heute aufgezeichnete verschlüsselte Daten werden zukünftig entschlüsselbar (harvest now, decrypt later).", impact: "Langfristiger Vertraulichkeitsverlust archivierter Daten.", threat: "Quantencomputing", vuln: "Nicht quantensichere Kryptografie" },
  ];

  const riskIds: string[] = [];
  for (const r of riskSeeds) {
    const inh = inherentRisk(r.l, r.i);
    const res = residualRisk(inh, r.eff);
    const risk = await db.risk.create({
      data: {
        riskId: `RISK-2026-${String(r.n).padStart(4, "0")}`,
        title: r.title,
        description: `${r.event} ${r.impact}`,
        cause: r.cause,
        riskEvent: r.event,
        impactDescription: r.impact,
        threat: r.threat,
        vulnerability: r.vuln,
        existingControls: r.ctls.length
          ? `Verknüpfte Kontrollen: ${r.ctls.map((i) => ctlDefs[i]![0]).join(", ")}`
          : "Keine wirksamen Kontrollen dokumentiert.",
        status: r.status,
        treatmentStrategy: r.strategy,
        targetScore: Math.min(res, 6),
        dueDate: r.status === "TREATMENT" ? daysFromNow(90) : null,
        nextReviewDate: r.reviewInDays != null ? daysFromNow(r.reviewInDays) : null,
        approvalStatus: ["OPEN", "TREATMENT", "MONITORING", "ACCEPTED"].includes(r.status) ? "APPROVED" : "NOT_SUBMITTED",
        categoryId: cats.get(r.cat)!,
        riskOwnerId: r.owner ? uRo : null,
        createdById: uRm,
        ouId: r.ou,
        locationId: r.loc,
        assets: { connect: r.assets.map((i) => ({ id: assets[i]! })) },
        processes: { connect: r.bps.map((i) => ({ id: bps[i]! })) },
        ictServices: { connect: r.icts.map((i) => ({ id: icts[i]! })) },
        criticalFunctions: { connect: r.cfs.map((i) => ({ id: cfs[i]! })) },
        thirdParties: { connect: r.tps.map((i) => ({ id: tps[i]! })) },
        regulatoryRequirements: { connect: r.regs.map((k) => ({ id: regs.get(k)! })) },
        controls: { create: r.ctls.map((i) => ({ controlId: ctls[i]! })) },
      },
    });
    riskIds.push(risk.id);
    if (r.status !== "DRAFT") {
      const assessment = await db.riskAssessment.create({
        data: {
          riskId: risk.id,
          assessorId: r.owner ? uRo : uRm,
          assessedAt: daysFromNow(-(20 + r.n)),
          likelihood: r.l,
          impact: r.i,
          controlEffectiveness: r.eff,
          inherentScore: inh,
          residualScore: res,
          justification: `Likelihood ${r.l} und Impact ${r.i} auf Basis von Bedrohungslage, Historie und Expertenschätzung; Kontrollwirksamkeit ${r.eff} % gemäß letztem Kontrolltest.`,
          isCurrent: true,
          dimensionScores: {
            create: [
              { dimension: "AVAILABILITY", score: Math.min(5, r.i) },
              { dimension: "CONFIDENTIALITY", score: Math.max(1, r.i - 1) },
              { dimension: "REGULATORY", score: Math.max(1, r.i - 1) },
              { dimension: "REPUTATION", score: Math.max(1, r.i - 2) },
            ],
          },
        },
      });
      void assessment;
    }
  }

  // ---------- Maßnahmen (32, einige überfällig) ----------
  interface ActionSeed {
    riskIdx: number;
    title: string;
    prio: string;
    status: string;
    progress: number;
    dueInDays: number;
    escalation?: number;
    validation?: string;
  }
  const actionSeeds: ActionSeed[] = [
    { riskIdx: 0, title: "EDR-Rollout auf alle Server abschließen", prio: "CRITICAL", status: "IN_PROGRESS", progress: 70, dueInDays: 30 },
    { riskIdx: 0, title: "Offline-Backup-Konzept härten (Immutable Storage)", prio: "HIGH", status: "IN_PROGRESS", progress: 40, dueInDays: 60 },
    { riskIdx: 0, title: "Ransomware-Tabletop-Übung durchführen", prio: "MEDIUM", status: "PLANNED", progress: 0, dueInDays: 90 },
    { riskIdx: 1, title: "Ausweichroute über Zweit-Processing vertraglich sichern", prio: "CRITICAL", status: "IN_PROGRESS", progress: 25, dueInDays: 45, escalation: 1 },
    { riskIdx: 1, title: "Exit-Plan PaySwift testen (Desktop-Übung)", prio: "HIGH", status: "PLANNED", progress: 0, dueInDays: -12, escalation: 2 },
    { riskIdx: 2, title: "Phishing-Simulationskampagne Q4", prio: "MEDIUM", status: "APPROVED", progress: 0, dueInDays: 40 },
    { riskIdx: 2, title: "FIDO2-Hardware-Token für Risikogruppen", prio: "HIGH", status: "IN_PROGRESS", progress: 55, dueInDays: 50 },
    { riskIdx: 3, title: "Multi-Cloud-Zielbild erstellen", prio: "HIGH", status: "IN_PROGRESS", progress: 30, dueInDays: 100 },
    { riskIdx: 3, title: "Konzentrationsanalyse dem Vorstand vorlegen", prio: "HIGH", status: "COMPLETED", progress: 100, dueInDays: -20, validation: "VALIDATED" },
    { riskIdx: 4, title: "Exit-Strategie TradeLine erstellen", prio: "CRITICAL", status: "IN_PROGRESS", progress: 15, dueInDays: -25, escalation: 3 },
    { riskIdx: 4, title: "Due Diligence TradeCore abschließen", prio: "HIGH", status: "IN_PROGRESS", progress: 60, dueInDays: 20 },
    { riskIdx: 5, title: "DLP-Regeln auf Cloud-Kanäle ausweiten", prio: "HIGH", status: "IN_PROGRESS", progress: 45, dueInDays: 35 },
    { riskIdx: 5, title: "Datenklassifizierungs-Richtlinie aktualisieren", prio: "MEDIUM", status: "COMPLETED", progress: 100, dueInDays: -40, validation: "VALIDATED" },
    { riskIdx: 6, title: "Automatisierte Rezertifizierungs-Workflows einführen", prio: "HIGH", status: "IN_PROGRESS", progress: 65, dueInDays: 25 },
    { riskIdx: 6, title: "Sofort-Bereinigung verwaister Konten", prio: "CRITICAL", status: "COMPLETED", progress: 100, dueInDays: -60, validation: "VALIDATED" },
    { riskIdx: 7, title: "Georedundanz für verbleibende Altsysteme", prio: "HIGH", status: "IN_PROGRESS", progress: 50, dueInDays: 120 },
    { riskIdx: 8, title: "Vertragsverlängerung RegTech verhandeln", prio: "CRITICAL", status: "IN_PROGRESS", progress: 35, dueInDays: 14, escalation: 1 },
    { riskIdx: 8, title: "Exit-Plan RegTech-SaaS testen", prio: "HIGH", status: "PLANNED", progress: 0, dueInDays: -8, escalation: 1 },
    { riskIdx: 9, title: "Automatisierte Regressionstests ausbauen", prio: "MEDIUM", status: "IN_PROGRESS", progress: 75, dueInDays: 70 },
    { riskIdx: 10, title: "DDoS-Schutz auf Anycast-Scrubbing erweitern", prio: "MEDIUM", status: "COMPLETED", progress: 100, dueInDays: -90, validation: "VALIDATED" },
    { riskIdx: 11, title: "Subdienstleister-Register CloudRhein vervollständigen", prio: "HIGH", status: "IN_PROGRESS", progress: 40, dueInDays: -5, escalation: 1 },
    { riskIdx: 12, title: "UEBA-Anomalieerkennung pilotieren", prio: "MEDIUM", status: "PLANNED", progress: 0, dueInDays: 110 },
    { riskIdx: 13, title: "TLS-Konfigurationen der Legacy-Schnittstellen härten", prio: "HIGH", status: "IN_PROGRESS", progress: 80, dueInDays: 15 },
    { riskIdx: 14, title: "DORA-Informationsregister vervollständigen", prio: "CRITICAL", status: "IN_PROGRESS", progress: 55, dueInDays: 40 },
    { riskIdx: 14, title: "Register-Qualitätssicherung als Regelprozess (RB-14)", prio: "MEDIUM", status: "APPROVED", progress: 0, dueInDays: 60 },
    { riskIdx: 16, title: "Wiederanlauftest Ausweich-RZ terminieren und durchführen", prio: "CRITICAL", status: "BLOCKED", progress: 10, dueInDays: -30, escalation: 2 },
    { riskIdx: 17, title: "Auflagenkatalog SOC-Dienstleister nachverfolgen", prio: "MEDIUM", status: "IN_PROGRESS", progress: 50, dueInDays: 45 },
    { riskIdx: 18, title: "Durchgängige Prüfsummen im Meldeprozess", prio: "MEDIUM", status: "EFFECTIVENESS_REVIEW", progress: 100, dueInDays: -15, validation: "VALIDATED" },
    { riskIdx: 19, title: "Zweiten Carrier für kritische Standorte anbinden", prio: "HIGH", status: "IN_PROGRESS", progress: 20, dueInDays: 130 },
    { riskIdx: 20, title: "KI-Nutzungsrichtlinie erstellen und freigeben", prio: "HIGH", status: "IN_PROGRESS", progress: 60, dueInDays: 30 },
    { riskIdx: 22, title: "MFA-Proxy-Lösung für Legacy-Anwendung", prio: "HIGH", status: "IN_PROGRESS", progress: 35, dueInDays: 75 },
    { riskIdx: 23, title: "Ausschreibung Output-Management beschleunigen", prio: "HIGH", status: "IN_PROGRESS", progress: 30, dueInDays: 21, escalation: 1 },
  ];
  let actionNo = 0;
  for (const a of actionSeeds) {
    actionNo += 1;
    await db.action.create({
      data: {
        actionId: `ACT-2026-${String(actionNo).padStart(4, "0")}`,
        riskId: riskIds[a.riskIdx]!,
        title: a.title,
        description: `Maßnahme zur Behandlung von ${riskSeeds[a.riskIdx]!.title}. Ziel: nachweisbare Reduktion des Residual-Risikos.`,
        ownerId: uAo,
        priority: a.prio,
        startDate: daysFromNow(-30),
        dueDate: daysFromNow(a.dueInDays),
        status: a.status,
        progress: a.progress,
        expectedRiskReduction: "Reduktion des Residual-Scores um mindestens eine Klasse",
        budget: a.prio === "CRITICAL" ? "hoch (> 100 PT)" : "mittel (20–100 PT)",
        dependencies: a.status === "BLOCKED" ? "Wartet auf Wartungsfenster des RZ-Betreibers" : null,
        validationStatus: a.validation ?? "NOT_VALIDATED",
        escalationLevel: a.escalation ?? 0,
      },
    });
  }

  // ---------- Risikoakzeptanzen ----------
  await db.riskAcceptance.create({
    data: {
      riskId: riskIds[21]!, // Personalengpass
      requestedById: uRo,
      justification: "Kurzfristig keine Besetzung möglich; Priorisierung der kritischen Aufgaben und externe Unterstützung vereinbart.",
      compensatingControls: "Priorisierungsboard, monatliches Backlog-Review durch ISO, externe Unterstützung für Spitzen.",
      status: "APPROVED",
      approvedById: uMgmt,
      approvedAt: daysFromNow(-40),
      validUntil: daysFromNow(140),
      nextReviewDate: daysFromNow(100),
    },
  });
  await db.riskAcceptance.create({
    data: {
      riskId: riskIds[3]!, // Cloud-Konzentration – beantragt, noch offen
      requestedById: uRo,
      justification: "Multi-Cloud-Migration erst 2027 wirtschaftlich darstellbar; Zwischenakzeptanz für 6 Monate beantragt.",
      compensatingControls: "Erweitertes Monitoring, vertragliche Verfügbarkeitszusagen, getesteter Exit-Plan.",
      status: "REQUESTED",
    },
  });
  await db.riskAcceptance.create({
    data: {
      riskId: riskIds[10]!, // DDoS
      requestedById: uRo,
      justification: "Restrisiko nach Scrubbing-Erweiterung innerhalb des Appetits; formale Bestätigung der Monitoring-Phase.",
      compensatingControls: "24/7-SOC-Monitoring, Runbook für DDoS-Fälle.",
      status: "REJECTED",
      approvedById: uMgmt,
      approvedAt: daysFromNow(-10),
    },
  });

  // ---------- Quality Reviews (3) ----------
  const { QUALITY_CRITERIA } = await import("../lib/domain/enums");
  const qrDefs: Array<{ riskIdx: number; outcome: string; score: number; comments: string; rejection?: string }> = [
    { riskIdx: 16, outcome: "IN_PROGRESS", score: 0, comments: "Review läuft: Wiederanlauf-Risiko in Prüfung." },
    { riskIdx: 0, outcome: "APPROVED", score: 92, comments: "Analyse vollständig und nachvollziehbar; Maßnahmenplan SMART." },
    { riskIdx: 15, outcome: "RETURNED", score: 54, comments: "Bewertungsbegründung unzureichend; Asset-Zuordnung fehlt.", rejection: "Kein Risk Owner benannt; Bewertung ohne Begründung; bitte nacharbeiten." },
  ];
  for (const q of qrDefs) {
    await db.qualityReview.create({
      data: {
        riskId: riskIds[q.riskIdx]!,
        reviewerId: uIso,
        reviewerName: "Ines Sturm (ISO)",
        startedAt: daysFromNow(-14),
        completedAt: q.outcome === "IN_PROGRESS" ? null : daysFromNow(-7),
        outcome: q.outcome,
        qualityScore: q.outcome === "IN_PROGRESS" ? null : q.score,
        comments: q.comments,
        rejectionReason: q.rejection,
        checklistItems: {
          create: QUALITY_CRITERIA.map((criterion, i) => ({
            criterion,
            sortOrder: i,
            fulfilled: q.outcome === "IN_PROGRESS" ? null : q.outcome === "APPROVED" ? i !== 11 : i < 7,
            comment: null,
          })),
        },
      },
    });
  }

  // ---------- Evidence (15) ----------
  const evDefs: Array<[string, string, string, number | null, number | null, number | null, number, string]> = [
    // id, title, docType, riskIdx, ctlIdx, tpIdx, validInDays, reviewStatus
    ["EV-001", "ISO-27001-Zertifikat CloudRhein GmbH", "CERTIFICATE", null, null, 0, 200, "REVIEWED"],
    ["EV-002", "SOC-2-Bericht PaySwift Processing", "REPORT", null, null, 1, 120, "REVIEWED"],
    ["EV-003", "Pentest-Bericht Kundenportal 2026", "TEST_RESULT", 10, null, null, 300, "REVIEWED"],
    ["EV-004", "MFA-Kontrolltest Q2/2026", "TEST_RESULT", null, 0, null, 270, "REVIEWED"],
    ["EV-005", "Rezertifizierungs-Protokoll Q2/2026", "TEST_RESULT", 6, 2, null, 250, "REVIEWED"],
    ["EV-006", "BCM-Übungsbericht Ausweich-RZ 2025", "REPORT", 16, 6, null, -30, "EXPIRED"],
    ["EV-007", "Exit-Plan-Test CloudRhein (Desktop-Übung)", "REPORT", null, 14, 0, 210, "REVIEWED"],
    ["EV-008", "Datenschutz-Folgenabschätzung DLP-Erweiterung", "POLICY", 5, 16, null, 400, "NOT_REVIEWED"],
    ["EV-009", "Vertrag RegTech inkl. DORA-Klauseln", "CONTRACT", 8, null, 9, 45, "REVIEWED"],
    ["EV-010", "Awareness-Kampagnen-Auswertung H1/2026", "REPORT", 2, 10, null, 180, "REVIEWED"],
    ["EV-011", "Kontrolltest Exit-Plan-Prozess (Failed)", "TEST_RESULT", 4, 14, null, 330, "REVIEWED"],
    ["EV-012", "Ransomware-Notfallplan v2.1", "POLICY", 0, 15, null, 365, "REVIEWED"],
    ["EV-013", "Subdienstleister-Auskunft CloudRhein", "REPORT", 11, null, 0, 90, "NOT_REVIEWED"],
    ["EV-014", "SLA-Bericht TeleConnect Q2/2026", "REPORT", 19, null, 10, 60, "REVIEWED"],
    ["EV-015", "Managementbeschluss Risikoakzeptanz Personal", "OTHER", 21, null, null, 140, "REVIEWED"],
  ];
  for (const [evidenceId, title, docType, riskIdx, ctlIdx, tpIdx, validInDays, reviewStatus] of evDefs) {
    await db.evidence.create({
      data: {
        evidenceId,
        title,
        docType,
        ownerId: uCo,
        link: `https://dms.internal.example/evidence/${evidenceId.toLowerCase()}`,
        riskId: riskIdx != null ? riskIds[riskIdx]! : null,
        controlId: ctlIdx != null ? ctls[ctlIdx]! : null,
        thirdPartyId: tpIdx != null ? tps[tpIdx]! : null,
        validUntil: daysFromNow(validInDays),
        classification: "CONFIDENTIAL",
        reviewerId: reviewStatus === "REVIEWED" ? uIso : null,
        reviewStatus,
        version: "1.0",
      },
    });
  }

  // ---------- Compliance-Mappings ----------
  const cmDefs: Array<[string, string, string, string | null]> = [
    ["DORA-GOV-01", "PARTIALLY_IMPLEMENTED", "Risikomanagementrahmen dokumentiert; Cockpit in Einführung, Methodik freigegeben.", "EV-012"],
    ["DORA-GOV-02", "IMPLEMENTED", "Risikoappetit je Kategorie definiert und im Cockpit hinterlegt; Überwachung über Dashboard.", null],
    ["DORA-PROT-01", "EFFECTIVE", "Schutzmaßnahmen implementiert; Kontrolltests 2026 überwiegend wirksam.", "EV-004"],
    ["DORA-DET-01", "IMPLEMENTED", "SOC/SIEM produktiv; Anomalieerkennung im Ausbau (UEBA-Pilot).", null],
    ["DORA-INC-01", "IMPLEMENTED", "Incident-Response-Prozess etabliert und geübt.", "EV-012"],
    ["DORA-TEST-01", "REMEDIATION_REQUIRED", "Wiederanlauftest Ausweich-RZ zweimal verschoben; Maßnahme ACT-2026-0026 läuft.", "EV-006"],
    ["DORA-TPR-01", "PARTIALLY_IMPLEMENTED", "Register vorhanden, Vervollständigung läuft (ACT-2026-0024).", null],
    ["DORA-TPR-02", "IMPLEMENTED", "DORA-Vertragsklausel-Standard etabliert; Bestandsverträge migriert.", "EV-009"],
    ["DORA-TPR-03", "PARTIALLY_IMPLEMENTED", "Konzentrationsanalyse etabliert; Behandlung der Cloud-Konzentration offen.", null],
    ["EBA-OUT-01", "IMPLEMENTED", "Auslagerungsregister im Cockpit geführt.", null],
    ["EBA-OUT-02", "REMEDIATION_REQUIRED", "Exit-Strategien für 2 kritische Drittparteien fehlen bzw. sind ungetestet.", "EV-011"],
    ["ISO-A5", "EFFECTIVE", "Organisatorische Kontrollen etabliert und getestet.", null],
    ["ISO-A8", "EFFECTIVENESS_NOT_TESTED", "Technische Kontrollen implementiert; Wirksamkeitstest für 2 Kontrollen ausstehend.", null],
    ["ISO27005-RA", "IMPLEMENTED", "Methodik dokumentiert (Risk Methodology) und im Cockpit umgesetzt.", null],
    ["NIST-ID", "PARTIALLY_IMPLEMENTED", "Asset-Register vorhanden; Abdeckung Fachbereichs-Assets unvollständig.", null],
    ["NIS2-GOV", "NOT_ASSESSED", "Anwendbarkeitsanalyse für Konzerngesellschaften noch nicht durchgeführt.", null],
    ["INT-POL-01", "IMPLEMENTED", "Interne IS-Policy in Kraft; jährliches Review etabliert.", null],
  ];
  for (const [refId, status, justification, evId] of cmDefs) {
    const evidence = evId ? await db.evidence.findUnique({ where: { evidenceId: evId } }) : null;
    await db.complianceMapping.create({
      data: {
        requirementId: regs.get(refId)!,
        status,
        justification,
        ownerId: uIso,
        assessedAt: daysFromNow(-25),
        evidenceId: evidence?.id ?? null,
        reviewerId: uSl,
        nextReviewDate: daysFromNow(155),
      },
    });
  }

  // ---------- Runbooks & Playbooks ----------
  for (const rb of RUNBOOKS) {
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
  for (const pb of PLAYBOOKS) {
    await db.playbook.create({
      data: {
        code: pb.code,
        scenario: pb.scenario,
        objective: pb.objective,
        activationCriteria: pb.activationCriteria,
        severityGuidance: pb.severityGuidance,
        rolesRaci: pb.rolesRaci,
        initialAssessment: pb.initialAssessment,
        immediateActions: pb.immediateActions,
        riskAnalysis: pb.riskAnalysis,
        decisionTree: pb.decisionTree,
        communication: pb.communication,
        regulatoryCheck: pb.regulatoryCheck,
        measures: pb.measures,
        evidenceRequired: pb.evidenceRequired,
        closureCriteria: pb.closureCriteria,
        postEventReview: pb.postEventReview,
      },
    });
  }

  // Beispiel: eine laufende Runbook-Ausführung und eine aktive Playbook-Ausführung
  const rb05 = await db.runbook.findUnique({ where: { code: "RB-05" }, include: { steps: true } });
  if (rb05) {
    const exec = await db.runbookExecution.create({
      data: {
        runbookId: rb05.id,
        startedById: uRm,
        startedAt: daysFromNow(-2),
        status: "IN_PROGRESS",
        contextNote: "Eskalation der überfälligen Maßnahme ACT-2026-0010 (Exit-Strategie TradeLine).",
      },
    });
    for (const [i, step] of rb05.steps.entries()) {
      await db.runbookStepResult.create({
        data: {
          executionId: exec.id,
          stepId: step.id,
          status: i < 2 ? "DONE" : "OPEN",
          comment: i === 0 ? "Verzug 25 Tage; Priorität Critical." : i === 1 ? "Stellungnahme: Ressourcenkonflikt mit Due-Diligence-Projekt." : null,
          completedById: i < 2 ? uRm : null,
          completedAt: i < 2 ? daysFromNow(-1) : null,
        },
      });
    }
  }
  const pb01 = await db.playbook.findUnique({ where: { code: "PB-01" } });
  if (pb01) {
    await db.playbookExecution.create({
      data: {
        playbookId: pb01.id,
        startedById: uIso,
        startedAt: daysFromNow(-5),
        status: "ACTIVE",
        severity: "HIGH",
        riskId: riskIds[3]!,
        notes: "Cloud-Konzentrationsrisiko über Appetit; Managemententscheidung zur Zwischenakzeptanz in Vorbereitung.",
      },
    });
  }

  // ---------- Einstellungen ----------
  const settings: Array<[string, string, string]> = [
    ["risk.threshold.low.max", "4", "Oberer Score der Klasse Low (1–4)"],
    ["risk.threshold.medium.max", "9", "Oberer Score der Klasse Medium (5–9)"],
    ["risk.threshold.high.max", "16", "Oberer Score der Klasse High (10–16); darüber Critical"],
    ["risk.mitigation.cap", "0.9", "Maximal anrechenbare Risikominderung durch Kontrollen (0–1)"],
  ];
  for (const [key, value, description] of settings) {
    await db.appSetting.create({ data: { key, value, description } });
  }

  // ---------- Beispiel-Audit-Einträge ----------
  await db.auditLog.create({
    data: { userId: uRm, userEmail: "riskmanager@demo.example", action: "CREATE", entityType: "Risk", entityId: riskIds[0]!, comment: "Seed: Ersterfassung" },
  });
  await db.auditLog.create({
    data: { userId: uIso, userEmail: "iso@demo.example", action: "STATUS_CHANGE", entityType: "Risk", entityId: riskIds[0]!, field: "status", oldValue: "SECOND_LINE_REVIEW", newValue: "TREATMENT", comment: "Freigabe nach Second-Line-Review" },
  });
  await db.auditLog.create({
    data: { userId: uMgmt, userEmail: "management@demo.example", action: "ACCEPTANCE_DECISION", entityType: "RiskAcceptance", entityId: riskIds[21]!, newValue: "APPROVED", comment: "Befristete Akzeptanz bis Q1/2027 mit Auflagen" },
  });

  // ---------- DORA-Anforderungskatalog (FRWK-DORA-001) ----------
  const { seedDora } = await import("./dora-seed-core.mjs");
  await seedDora(db, { log: (m: string) => console.log(`  ${m}`) });

  console.log("Seed abgeschlossen.");
  console.log(`Demo-Passwort für alle Konten: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
