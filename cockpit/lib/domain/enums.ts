/**
 * Zentrale Wertemengen (statt DB-Enums, siehe ADR-0002).
 * Jede Menge hat deutsche Labels; serverseitige Validierung via Zod in den Actions.
 */

export const ROLES = {
  ADMIN: "Administrator",
  ICT_RISK_MANAGER: "ICT Risk Manager",
  TPRM_MANAGER: "Third Party Risk Manager",
  ISO: "Information Security Officer",
  RISK_OWNER: "Risk Owner",
  CONTROL_OWNER: "Control Owner",
  ACTION_OWNER: "Action Owner",
  SECOND_LINE: "Reviewer / Second Line",
  MANAGEMENT: "Management (Read-only)",
  AUDITOR: "Auditor",
} as const;
export type RoleKey = keyof typeof ROLES;

export const RISK_STATUS = {
  DRAFT: "Draft",
  IN_ASSESSMENT: "In Assessment",
  QUALITY_REVIEW: "Quality Review",
  APPROVAL_PENDING: "Approval Pending",
  SECOND_LINE_REVIEW: "Second-Line Review",
  OPEN: "Open",
  TREATMENT: "Treatment in Progress",
  MONITORING: "Monitoring",
  ACCEPTED: "Accepted",
  CLOSURE_REVIEW: "Closure Review",
  CLOSED: "Closed",
  REJECTED: "Rejected",
} as const;
export type RiskStatus = keyof typeof RISK_STATUS;

/** Erlaubte Workflow-Übergänge des Risikos (Kap. 9). */
export const RISK_TRANSITIONS: Record<RiskStatus, RiskStatus[]> = {
  DRAFT: ["IN_ASSESSMENT"],
  IN_ASSESSMENT: ["QUALITY_REVIEW", "DRAFT"],
  QUALITY_REVIEW: ["APPROVAL_PENDING", "IN_ASSESSMENT", "REJECTED"],
  APPROVAL_PENDING: ["SECOND_LINE_REVIEW", "IN_ASSESSMENT", "REJECTED"],
  SECOND_LINE_REVIEW: ["OPEN", "IN_ASSESSMENT", "REJECTED"],
  OPEN: ["TREATMENT", "MONITORING", "ACCEPTED", "CLOSURE_REVIEW"],
  TREATMENT: ["MONITORING", "OPEN", "CLOSURE_REVIEW"],
  MONITORING: ["TREATMENT", "OPEN", "ACCEPTED", "CLOSURE_REVIEW"],
  ACCEPTED: ["MONITORING", "CLOSURE_REVIEW"],
  CLOSURE_REVIEW: ["CLOSED", "MONITORING"],
  CLOSED: [],
  REJECTED: ["DRAFT"],
};

export const TREATMENT_STRATEGY = {
  AVOID: "Avoid (Vermeiden)",
  REDUCE: "Reduce (Reduzieren)",
  TRANSFER: "Transfer (Übertragen)",
  ACCEPT: "Accept (Akzeptieren)",
} as const;
export type TreatmentStrategy = keyof typeof TREATMENT_STRATEGY;

export const LIKELIHOOD = {
  1: "Rare",
  2: "Unlikely",
  3: "Possible",
  4: "Likely",
  5: "Almost Certain",
} as const;

export const IMPACT = {
  1: "Insignificant",
  2: "Minor",
  3: "Moderate",
  4: "Major",
  5: "Severe",
} as const;

export const IMPACT_DIMENSIONS = {
  CONFIDENTIALITY: "Vertraulichkeit",
  INTEGRITY: "Integrität",
  AVAILABILITY: "Verfügbarkeit",
  AUTHENTICITY: "Authentizität",
  FINANCIAL: "Finanzielle Auswirkungen",
  REGULATORY: "Regulatorische Auswirkungen",
  CUSTOMER: "Kundenwirkung",
  REPUTATION: "Reputationswirkung",
  BUSINESS_INTERRUPTION: "Betriebsunterbrechung",
  DATA_PROTECTION: "Datenschutz",
  CRITICAL_FUNCTION: "Kritische / wichtige Funktionen",
} as const;
export type ImpactDimension = keyof typeof IMPACT_DIMENSIONS;

export const CONTROL_EFFECTIVENESS_PERCENT = [0, 25, 50, 75, 100] as const;
export const CONTROL_EFFECTIVENESS_LABELS: Record<number, string> = {
  0: "0 % – nicht vorhanden",
  25: "25 % – unzureichend",
  50: "50 % – teilweise wirksam",
  75: "75 % – weitgehend wirksam",
  100: "100 % – wirksam",
};

export const RISK_CLASS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
} as const;
export type RiskClass = keyof typeof RISK_CLASS;

export const ACTION_STATUS = {
  PLANNED: "Planned",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
  EFFECTIVENESS_REVIEW: "Effectiveness Review",
  CLOSED: "Closed",
} as const;
export type ActionStatus = keyof typeof ACTION_STATUS;

export const ACTION_TRANSITIONS: Record<ActionStatus, ActionStatus[]> = {
  PLANNED: ["APPROVED"],
  APPROVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["BLOCKED", "COMPLETED"],
  BLOCKED: ["IN_PROGRESS"],
  COMPLETED: ["EFFECTIVENESS_REVIEW"],
  EFFECTIVENESS_REVIEW: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
};

export const PRIORITY = {
  LOW: "Niedrig",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
  CRITICAL: "Kritisch",
} as const;

export const TP_STATUS = {
  SCREENING: "Initial Screening",
  CRITICALITY: "Kritikalitätsbewertung",
  DUE_DILIGENCE: "Due Diligence",
  RISK_ASSESSMENT: "Risk Assessment",
  CONTRACT_REVIEW: "Vertrags- und Kontrollprüfung",
  APPROVAL: "Approval",
  MONITORING: "Ongoing Monitoring",
  RENEWAL: "Renewal",
  EXIT: "Exit",
} as const;
export type TpStatus = keyof typeof TP_STATUS;

export const TP_TRANSITIONS: Record<TpStatus, TpStatus[]> = {
  SCREENING: ["CRITICALITY"],
  CRITICALITY: ["DUE_DILIGENCE"],
  DUE_DILIGENCE: ["RISK_ASSESSMENT"],
  RISK_ASSESSMENT: ["CONTRACT_REVIEW"],
  CONTRACT_REVIEW: ["APPROVAL", "RISK_ASSESSMENT"],
  APPROVAL: ["MONITORING", "EXIT"],
  MONITORING: ["RENEWAL", "EXIT"],
  RENEWAL: ["MONITORING", "EXIT"],
  EXIT: [],
};

export const COMPLIANCE_STATUS = {
  NOT_ASSESSED: "Not Assessed",
  NOT_APPLICABLE: "Not Applicable",
  PLANNED: "Planned",
  PARTIALLY_IMPLEMENTED: "Partially Implemented",
  IMPLEMENTED: "Implemented",
  EFFECTIVENESS_NOT_TESTED: "Effectiveness Not Tested",
  EFFECTIVE: "Effective",
  INEFFECTIVE: "Ineffective",
  REMEDIATION_REQUIRED: "Remediation Required",
} as const;
export type ComplianceStatus = keyof typeof COMPLIANCE_STATUS;

export const ACCEPTANCE_STATUS = {
  REQUESTED: "Beantragt",
  IN_REVIEW: "In Prüfung",
  APPROVED: "Genehmigt (befristet)",
  REJECTED: "Abgelehnt",
  EXPIRED: "Abgelaufen",
  TERMINATED: "Beendet",
} as const;

export const EFFECTIVENESS_RATING = {
  NOT_TESTED: "Nicht getestet",
  INEFFECTIVE: "Unwirksam",
  PARTIALLY_EFFECTIVE: "Teilweise wirksam",
  LARGELY_EFFECTIVE: "Weitgehend wirksam",
  EFFECTIVE: "Wirksam",
} as const;

export const QUALITY_CRITERIA = [
  "Risiko verständlich und vollständig beschrieben",
  "Ursache, Ereignis und Auswirkung getrennt dargestellt",
  "Asset und Geschäftsprozess zugeordnet",
  "Risk Owner benannt",
  "Bewertung nachvollziehbar begründet",
  "Bestehende Kontrollen konkret dokumentiert",
  "Kontrollwirksamkeit durch Nachweise belegt",
  "Residual Risk plausibel",
  "Maßnahmen SMART formuliert",
  "Fälligkeiten realistisch",
  "Regulatorische Zuordnung vollständig",
  "Risikoakzeptanz ordnungsgemäß genehmigt (falls zutreffend)",
  "Nächste Überprüfung festgelegt",
] as const;

export const FRAMEWORKS = {
  DORA: "DORA",
  DORA_RTS: "DORA RTS/ITS",
  EBA_ICT: "EBA GL ICT & Security Risk",
  EBA_OUTSOURCING: "EBA GL Outsourcing",
  ISO27001: "ISO/IEC 27001:2022",
  ISO27005: "ISO/IEC 27005",
  NIST_CSF: "NIST CSF 2.0",
  NIS2: "NIS2",
  INTERNAL: "Interne Policy",
} as const;

/** Pflicht-Hinweis Regulatorik (Kap. 6) – überall dort anzeigen, wo Compliance-Status erscheinen. */
export const COMPLIANCE_DISCLAIMER =
  "Die Anwendung unterstützt die Dokumentation und Steuerung regulatorischer Anforderungen. " +
  "Sie ersetzt keine rechtliche, aufsichtsrechtliche oder unabhängige Compliance-Prüfung.";
