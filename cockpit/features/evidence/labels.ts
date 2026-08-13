/**
 * Deutsche Labels für Wertemengen des Evidence-Moduls
 * (Strings statt DB-Enums, siehe ADR-0002; Validierung via Zod in actions.ts).
 */

export const EVIDENCE_DOC_TYPE_LABELS: Record<string, string> = {
  POLICY: "Richtlinie",
  REPORT: "Bericht",
  CERTIFICATE: "Zertifikat",
  TEST_RESULT: "Testergebnis",
  CONTRACT: "Vertrag",
  SCREENSHOT: "Screenshot",
  OTHER: "Sonstiges",
};

export const EVIDENCE_CLASSIFICATION_LABELS: Record<string, string> = {
  PUBLIC: "Öffentlich",
  INTERNAL: "Intern",
  CONFIDENTIAL: "Vertraulich",
  STRICTLY_CONFIDENTIAL: "Streng vertraulich",
};

export const EVIDENCE_REVIEW_STATUS_LABELS: Record<string, string> = {
  NOT_REVIEWED: "Nicht reviewt",
  REVIEWED: "Reviewt",
  EXPIRED: "Abgelaufen",
  REJECTED: "Abgelehnt",
};
