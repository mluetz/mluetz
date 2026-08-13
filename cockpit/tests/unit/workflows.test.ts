import { describe, expect, it } from "vitest";
import {
  ACTION_STATUS,
  ACTION_TRANSITIONS,
  RISK_STATUS,
  RISK_TRANSITIONS,
  TP_STATUS,
  TP_TRANSITIONS,
  type ActionStatus,
  type RiskStatus,
  type TpStatus,
} from "@/lib/domain/enums";

describe("Risiko-Workflow", () => {
  it("kennt für jeden Status eine Übergangsdefinition", () => {
    for (const status of Object.keys(RISK_STATUS) as RiskStatus[]) {
      expect(RISK_TRANSITIONS[status]).toBeDefined();
    }
  });

  it("führt den Standardpfad Draft → … → Closed", () => {
    expect(RISK_TRANSITIONS.DRAFT).toContain("IN_ASSESSMENT");
    expect(RISK_TRANSITIONS.IN_ASSESSMENT).toContain("QUALITY_REVIEW");
    expect(RISK_TRANSITIONS.QUALITY_REVIEW).toContain("APPROVAL_PENDING");
    expect(RISK_TRANSITIONS.APPROVAL_PENDING).toContain("SECOND_LINE_REVIEW");
    expect(RISK_TRANSITIONS.SECOND_LINE_REVIEW).toContain("OPEN");
    expect(RISK_TRANSITIONS.OPEN).toContain("TREATMENT");
    expect(RISK_TRANSITIONS.MONITORING).toContain("CLOSURE_REVIEW");
    expect(RISK_TRANSITIONS.CLOSURE_REVIEW).toContain("CLOSED");
  });

  it("erlaubt keine Übergänge aus dem Endstatus", () => {
    expect(RISK_TRANSITIONS.CLOSED).toHaveLength(0);
  });

  it("erlaubt keinen Sprung Draft → Closed", () => {
    expect(RISK_TRANSITIONS.DRAFT).not.toContain("CLOSED");
  });
});

describe("Maßnahmen-Workflow", () => {
  it("folgt Planned → Approved → In Progress → Completed → Effectiveness Review → Closed", () => {
    expect(ACTION_TRANSITIONS.PLANNED).toEqual(["APPROVED"]);
    expect(ACTION_TRANSITIONS.APPROVED).toEqual(["IN_PROGRESS"]);
    expect(ACTION_TRANSITIONS.IN_PROGRESS).toContain("COMPLETED");
    expect(ACTION_TRANSITIONS.COMPLETED).toEqual(["EFFECTIVENESS_REVIEW"]);
    expect(ACTION_TRANSITIONS.EFFECTIVENESS_REVIEW).toContain("CLOSED");
    expect(ACTION_TRANSITIONS.CLOSED).toHaveLength(0);
  });

  it("deckt alle Status ab", () => {
    for (const status of Object.keys(ACTION_STATUS) as ActionStatus[]) {
      expect(ACTION_TRANSITIONS[status]).toBeDefined();
    }
  });
});

describe("Third-Party-Workflow", () => {
  it("folgt Screening → … → Monitoring → Renewal/Exit", () => {
    expect(TP_TRANSITIONS.SCREENING).toEqual(["CRITICALITY"]);
    expect(TP_TRANSITIONS.APPROVAL).toContain("MONITORING");
    expect(TP_TRANSITIONS.MONITORING).toEqual(expect.arrayContaining(["RENEWAL", "EXIT"]));
    expect(TP_TRANSITIONS.EXIT).toHaveLength(0);
  });

  it("deckt alle Status ab", () => {
    for (const status of Object.keys(TP_STATUS) as TpStatus[]) {
      expect(TP_TRANSITIONS[status]).toBeDefined();
    }
  });
});
