import { describe, expect, it } from "vitest";
import { auditHash, canonicalAuditString } from "@/lib/audit-hash";

const entry = {
  seq: 1,
  timestamp: new Date("2026-08-29T10:00:00Z"),
  userId: "u1",
  userEmail: "iso@demo.example",
  action: "UPDATE",
  entityType: "ThirdParty",
  entityId: "tp1",
  field: "criticalFunctions",
  oldValue: "CIF-01",
  newValue: "CIF-01, CIF-03",
  comment: "Verknüpfung ergänzt",
  prevHash: null,
};

describe("Audit-Hash-Verkettung (P1-05)", () => {
  it("ist deterministisch und feldsensitiv", () => {
    const h1 = auditHash(canonicalAuditString(entry));
    const h2 = auditHash(canonicalAuditString({ ...entry }));
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    const tampered = auditHash(canonicalAuditString({ ...entry, newValue: "CIF-01" }));
    expect(tampered).not.toBe(h1);
  });
  it("bindet den Vorgänger-Hash ein (Kette)", () => {
    const h1 = auditHash(canonicalAuditString(entry));
    const next = auditHash(canonicalAuditString({ ...entry, seq: 2, prevHash: h1 }));
    const forged = auditHash(canonicalAuditString({ ...entry, seq: 2, prevHash: "0".repeat(64) }));
    expect(next).not.toBe(forged);
  });
});
