import type { RoleKey } from "@/lib/domain/enums";

/**
 * Statische Rollen→Berechtigungs-Zuordnung (Single Source of Truth).
 * Bewusst ohne "server-only", damit Seed und Tests sie nutzen können;
 * die Durchsetzung erfolgt ausschließlich serverseitig über lib/authz.ts.
 */
export const PERMISSIONS = {
  "risk:read": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "RISK_OWNER", "CONTROL_OWNER", "ACTION_OWNER", "SECOND_LINE", "MANAGEMENT", "AUDITOR"],
  "risk:write": ["ADMIN", "ICT_RISK_MANAGER", "RISK_OWNER"],
  "risk:assess": ["ADMIN", "ICT_RISK_MANAGER", "RISK_OWNER", "ISO"],
  "risk:review": ["ADMIN", "ISO", "SECOND_LINE"],
  "risk:approve": ["ADMIN", "RISK_OWNER", "SECOND_LINE", "MANAGEMENT"],
  "acceptance:request": ["ADMIN", "ICT_RISK_MANAGER", "RISK_OWNER"],
  "acceptance:approve": ["ADMIN", "MANAGEMENT"],
  "action:read": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "RISK_OWNER", "CONTROL_OWNER", "ACTION_OWNER", "SECOND_LINE", "MANAGEMENT", "AUDITOR"],
  "action:write": ["ADMIN", "ICT_RISK_MANAGER", "ACTION_OWNER"],
  "action:escalate": ["ADMIN", "ICT_RISK_MANAGER", "ISO", "SECOND_LINE"],
  "control:read": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "RISK_OWNER", "CONTROL_OWNER", "ACTION_OWNER", "SECOND_LINE", "MANAGEMENT", "AUDITOR"],
  "control:write": ["ADMIN", "ICT_RISK_MANAGER", "CONTROL_OWNER", "ISO"],
  "control:test": ["ADMIN", "CONTROL_OWNER", "ISO", "SECOND_LINE"],
  "thirdparty:read": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "RISK_OWNER", "CONTROL_OWNER", "ACTION_OWNER", "SECOND_LINE", "MANAGEMENT", "AUDITOR"],
  "thirdparty:write": ["ADMIN", "TPRM_MANAGER"],
  "evidence:read": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "RISK_OWNER", "CONTROL_OWNER", "ACTION_OWNER", "SECOND_LINE", "MANAGEMENT", "AUDITOR"],
  "evidence:write": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "CONTROL_OWNER", "ISO"],
  "compliance:read": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "SECOND_LINE", "MANAGEMENT", "AUDITOR"],
  "compliance:write": ["ADMIN", "ISO", "ICT_RISK_MANAGER"],
  "runbook:read": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "RISK_OWNER", "CONTROL_OWNER", "ACTION_OWNER", "SECOND_LINE", "MANAGEMENT", "AUDITOR"],
  "runbook:execute": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "CONTROL_OWNER", "ACTION_OWNER", "SECOND_LINE"],
  "playbook:execute": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "SECOND_LINE"],
  "report:read": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "SECOND_LINE", "MANAGEMENT", "AUDITOR"],
  "report:create": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO"],
  "export": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "SECOND_LINE", "MANAGEMENT", "AUDITOR"],
  "incident:read": ["ADMIN", "ICT_RISK_MANAGER", "TPRM_MANAGER", "ISO", "RISK_OWNER", "CONTROL_OWNER", "ACTION_OWNER", "SECOND_LINE", "MANAGEMENT", "AUDITOR"],
  "incident:write": ["ADMIN", "ISO", "ICT_RISK_MANAGER"],
  "dora:assess": ["ADMIN", "ISO", "ICT_RISK_MANAGER", "SECOND_LINE"],
  "audit:read": ["ADMIN", "AUDITOR", "SECOND_LINE", "ISO"],
  "admin": ["ADMIN"],
} as const satisfies Record<string, readonly RoleKey[]>;

export type PermissionKey = keyof typeof PERMISSIONS;
