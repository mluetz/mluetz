/**
 * Deutsche Labels für Wertemengen des Third-Party-Moduls
 * (Strings statt DB-Enums, siehe ADR-0002; Validierung via Zod in actions.ts).
 */

export const TP_CRITICALITY_LABELS: Record<string, string> = {
  NOT_ASSESSED: "Nicht bewertet",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const DUE_DILIGENCE_LABELS: Record<string, string> = {
  NOT_STARTED: "Nicht begonnen",
  IN_PROGRESS: "Laufend",
  COMPLETED: "Abgeschlossen",
  OVERDUE: "Überfällig",
};

export const SUBSTITUTABILITY_LABELS: Record<string, string> = {
  NOT_ASSESSED: "Nicht bewertet",
  EASY: "Leicht ersetzbar",
  DIFFICULT: "Schwer ersetzbar",
  HARDLY_SUBSTITUTABLE: "Kaum ersetzbar",
};

export const EXIT_STATUS_LABELS: Record<string, string> = {
  MISSING: "Fehlend",
  DRAFT: "Entwurf",
  APPROVED: "Genehmigt",
  TESTED: "Getestet",
  OUTDATED: "Veraltet",
};

export const EXIT_TEST_RESULT_LABELS: Record<string, string> = {
  PASSED: "Bestanden",
  PASSED_WITH_FINDINGS: "Bestanden mit Feststellungen",
  FAILED: "Nicht bestanden",
};
