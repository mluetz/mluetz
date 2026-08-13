import { COMPLIANCE_STATUS, type ComplianceStatus } from "@/lib/domain/enums";

/**
 * Mappt den Compliance-Status auf eine Badge-Variante.
 * Farbe wird immer mit Text kombiniert (nie Farbe allein).
 */
export type ComplianceBadgeVariant = "low" | "medium" | "critical" | "secondary";

export function complianceStatusVariant(status: string): ComplianceBadgeVariant {
  switch (status) {
    case "EFFECTIVE":
    case "IMPLEMENTED":
      return "low";
    case "PARTIALLY_IMPLEMENTED":
    case "PLANNED":
    case "EFFECTIVENESS_NOT_TESTED":
      return "medium";
    case "INEFFECTIVE":
    case "REMEDIATION_REQUIRED":
      return "critical";
    default:
      // NOT_ASSESSED | NOT_APPLICABLE
      return "secondary";
  }
}

export function complianceStatusLabel(status: string): string {
  return COMPLIANCE_STATUS[status as ComplianceStatus] ?? status;
}
