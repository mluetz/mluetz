import type { RoleKey } from "@/lib/domain/enums";

/**
 * Harte Funktionstrennungs-Constraints (Review v3, P2-09):
 * Der AUDITOR darf nicht zugleich operative Owner- oder Admin-Rollen
 * tragen — sonst prüft er seine eigene Arbeit. Die Prüfung ist
 * blockierend (Rollenvergabe) und speist den SoD-Konfliktbericht.
 * Personenbezogene Trennungen (Genehmiger != Antragsteller,
 * Quality Reviewer != Ersteller) werden in den jeweiligen Server
 * Actions erzwungen.
 */

const AUDITOR_INCOMPATIBLE: RoleKey[] = [
  "ADMIN",
  "RISK_OWNER",
  "CONTROL_OWNER",
  "ACTION_OWNER",
  "ICT_RISK_MANAGER",
  "TPRM_MANAGER",
];

export interface SodConflict {
  rule: string;
  roles: RoleKey[];
}

export function sodConflicts(roles: RoleKey[]): SodConflict[] {
  const conflicts: SodConflict[] = [];
  if (roles.includes("AUDITOR")) {
    const clash = AUDITOR_INCOMPATIBLE.filter((r) => roles.includes(r));
    if (clash.length > 0) {
      conflicts.push({
        rule: "Auditor darf keine operativen Owner-/Admin-Rollen tragen",
        roles: ["AUDITOR", ...clash],
      });
    }
  }
  if (roles.includes("SECOND_LINE") && roles.includes("RISK_OWNER")) {
    conflicts.push({
      rule: "Second Line darf nicht zugleich Risk Owner sein",
      roles: ["SECOND_LINE", "RISK_OWNER"],
    });
  }
  return conflicts;
}
