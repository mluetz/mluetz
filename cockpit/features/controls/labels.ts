/**
 * Deutsche Labels für Kontroll-Wertemengen (Strings gemäß prisma/schema.prisma).
 * Bewusst ohne "server-only", da sowohl Server-Seiten als auch Client-Spalten
 * die Labels nutzen (analog lib/domain/enums.ts).
 */

export const CONTROL_TYPE_LABELS = {
  PREVENTIVE: "Präventiv",
  DETECTIVE: "Detektiv",
  CORRECTIVE: "Korrektiv",
} as const;
export type ControlType = keyof typeof CONTROL_TYPE_LABELS;

export const AUTOMATION_LABELS = {
  MANUAL: "Manuell",
  SEMI_AUTOMATED: "Teilautomatisiert",
  AUTOMATED: "Automatisiert",
} as const;
export type Automation = keyof typeof AUTOMATION_LABELS;

export const FREQUENCY_LABELS = {
  CONTINUOUS: "Kontinuierlich",
  DAILY: "Täglich",
  WEEKLY: "Wöchentlich",
  MONTHLY: "Monatlich",
  QUARTERLY: "Quartalsweise",
  ANNUALLY: "Jährlich",
  EVENT_DRIVEN: "Ereignisgesteuert",
} as const;
export type Frequency = keyof typeof FREQUENCY_LABELS;

export const TEST_RESULT_LABELS = {
  PASSED: "Bestanden",
  PASSED_WITH_FINDINGS: "Bestanden mit Feststellungen",
  FAILED: "Nicht bestanden",
} as const;
export type TestResult = keyof typeof TEST_RESULT_LABELS;

type BadgeVariant = "secondary" | "low" | "medium" | "high" | "critical";

/** Ampel-Variante je Wirksamkeitsrating – immer zusammen mit Text-Label verwenden. */
export function effectivenessVariant(rating: string): BadgeVariant {
  switch (rating) {
    case "EFFECTIVE":
      return "low";
    case "LARGELY_EFFECTIVE":
      return "medium";
    case "PARTIALLY_EFFECTIVE":
      return "high";
    case "INEFFECTIVE":
      return "critical";
    default:
      return "secondary";
  }
}

/** Ampel-Variante je Testergebnis – immer zusammen mit Text-Label verwenden. */
export function testResultVariant(result: string): BadgeVariant {
  switch (result) {
    case "PASSED":
      return "low";
    case "PASSED_WITH_FINDINGS":
      return "medium";
    case "FAILED":
      return "critical";
    default:
      return "secondary";
  }
}
