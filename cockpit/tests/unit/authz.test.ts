import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "@/lib/authz-map";
import { ROLES, type RoleKey } from "@/lib/domain/enums";

const allRoles = Object.keys(ROLES) as RoleKey[];

describe("RBAC-Berechtigungsmatrix", () => {
  it("verwendet ausschließlich definierte Rollen", () => {
    for (const [perm, roles] of Object.entries(PERMISSIONS)) {
      for (const role of roles) {
        expect(allRoles, `Unbekannte Rolle "${role}" in ${perm}`).toContain(role);
      }
    }
  });

  it("Auditor hat ausschließlich Lese-/Export-Rechte", () => {
    for (const [perm, roles] of Object.entries(PERMISSIONS)) {
      if ((roles as readonly string[]).includes("AUDITOR")) {
        const readOnly = perm.endsWith(":read") || perm === "export" || perm === "audit:read";
        expect(readOnly, `Auditor darf nicht: ${perm}`).toBe(true);
      }
    }
  });

  it("Management (Read-only) darf nur lesen, exportieren und Akzeptanzen/Freigaben entscheiden", () => {
    for (const [perm, roles] of Object.entries(PERMISSIONS)) {
      if ((roles as readonly string[]).includes("MANAGEMENT")) {
        const allowed =
          perm.endsWith(":read") || ["export", "acceptance:approve", "risk:approve"].includes(perm);
        expect(allowed, `Management darf nicht: ${perm}`).toBe(true);
      }
    }
  });

  it("Administration ist auf die Admin-Rolle beschränkt", () => {
    expect(PERMISSIONS["admin"]).toEqual(["ADMIN"]);
  });

  it("Least Privilege: Schreibrechte auf Risiken nicht für reine Leserollen", () => {
    for (const role of ["MANAGEMENT", "AUDITOR"] as const) {
      expect(PERMISSIONS["risk:write"]).not.toContain(role);
      expect(PERMISSIONS["thirdparty:write"]).not.toContain(role);
      expect(PERMISSIONS["control:write"]).not.toContain(role);
    }
  });

  it("Audit Trail ist auf revisionsnahe Rollen beschränkt", () => {
    expect(PERMISSIONS["audit:read"]).toEqual(
      expect.arrayContaining(["ADMIN", "AUDITOR", "SECOND_LINE", "ISO"]),
    );
    expect(PERMISSIONS["audit:read"]).not.toContain("ACTION_OWNER");
  });
});
