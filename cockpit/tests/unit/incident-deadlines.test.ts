import { describe, expect, it } from "vitest";
import { computeDeadlines, remainingLabel } from "@/lib/domain/incident-deadlines";

const T0 = new Date("2026-08-17T08:00:00Z"); // Kenntniserlangung

describe("computeDeadlines – DORA (Art. 19)", () => {
  it("Erstmeldung: 4 h nach Klassifizierung, wenn früher als 24 h nach Kenntnis", () => {
    const d = computeDeadlines(
      {
        awarenessAt: T0,
        classifiedAt: new Date("2026-08-17T10:00:00Z"), // +2 h
        isMajor: true,
        gdprRelevant: false,
        nis2Relevant: false,
      },
      T0,
    );
    const initial = d.find((x) => x.reportType === "DORA_INITIAL")!;
    expect(initial.dueAt.toISOString()).toBe("2026-08-17T14:00:00.000Z"); // Klassifizierung + 4 h
  });

  it("absolute Obergrenze 24 h nach Kenntnis greift bei später Klassifizierung", () => {
    const d = computeDeadlines(
      {
        awarenessAt: T0,
        classifiedAt: new Date("2026-08-18T06:00:00Z"), // +22 h → +4 h wäre 26 h nach Kenntnis
        isMajor: true,
        gdprRelevant: false,
        nis2Relevant: false,
      },
      T0,
    );
    const initial = d.find((x) => x.reportType === "DORA_INITIAL")!;
    expect(initial.dueAt.toISOString()).toBe("2026-08-18T08:00:00.000Z"); // Kenntnis + 24 h
  });

  it("ohne Klassifizierung gilt die 24-h-Grenze; Folgefristen bauen darauf auf", () => {
    const d = computeDeadlines(
      {
        awarenessAt: T0,
        classifiedAt: null,
        isMajor: true,
        gdprRelevant: false,
        nis2Relevant: false,
      },
      T0,
    );
    expect(d.find((x) => x.reportType === "DORA_INITIAL")!.dueAt.toISOString()).toBe(
      "2026-08-18T08:00:00.000Z",
    );
    expect(d.find((x) => x.reportType === "DORA_INTERMEDIATE")!.dueAt.toISOString()).toBe(
      "2026-08-21T08:00:00.000Z", // Erstmeldung + 72 h
    );
  });

  it("Zwischen- und Abschlussmeldung verankern sich an tatsächlichen Abgabezeitpunkten", () => {
    const d = computeDeadlines(
      {
        awarenessAt: T0,
        classifiedAt: new Date("2026-08-17T09:00:00Z"),
        isMajor: true,
        gdprRelevant: false,
        nis2Relevant: false,
        submitted: {
          DORA_INITIAL: new Date("2026-08-17T11:00:00Z"),
          DORA_INTERMEDIATE: new Date("2026-08-19T11:00:00Z"),
        },
      },
      T0,
    );
    expect(d.find((x) => x.reportType === "DORA_INTERMEDIATE")!.dueAt.toISOString()).toBe(
      "2026-08-20T11:00:00.000Z", // Ist-Erstmeldung + 72 h
    );
    expect(d.find((x) => x.reportType === "DORA_FINAL")!.dueAt.toISOString()).toBe(
      "2026-09-19T11:00:00.000Z", // Ist-Zwischenmeldung + 1 Monat
    );
  });

  it("nicht schwerwiegend → keine DORA-Fristen", () => {
    const d = computeDeadlines(
      {
        awarenessAt: T0,
        classifiedAt: null,
        isMajor: false,
        gdprRelevant: false,
        nis2Relevant: false,
      },
      T0,
    );
    expect(d.filter((x) => x.reportType.startsWith("DORA"))).toHaveLength(0);
  });
});

describe("computeDeadlines – parallele Pflichtenstränge", () => {
  it("NIS-2 und DSGVO laufen ab Kenntniserlangung", () => {
    const d = computeDeadlines(
      {
        awarenessAt: T0,
        classifiedAt: null,
        isMajor: false,
        gdprRelevant: true,
        nis2Relevant: true,
      },
      T0,
    );
    expect(d.find((x) => x.reportType === "NIS2_EARLY_WARNING")!.dueAt.toISOString()).toBe(
      "2026-08-18T08:00:00.000Z",
    );
    expect(d.find((x) => x.reportType === "NIS2_REPORT")!.dueAt.toISOString()).toBe(
      "2026-08-20T08:00:00.000Z",
    );
    expect(d.find((x) => x.reportType === "GDPR_NOTIFICATION")!.dueAt.toISOString()).toBe(
      "2026-08-20T08:00:00.000Z",
    );
  });
});

describe("Status und Restlaufzeit", () => {
  it("kennzeichnet OK/LATE/DUE/OVERDUE korrekt", () => {
    const base = {
      awarenessAt: T0,
      classifiedAt: null,
      isMajor: false,
      gdprRelevant: true,
      nis2Relevant: false,
    };
    const due = new Date("2026-08-20T08:00:00Z");
    // offen, vor Frist
    expect(computeDeadlines(base, new Date("2026-08-19T08:00:00Z"))[0]!.status).toBe("DUE");
    // offen, nach Frist
    expect(computeDeadlines(base, new Date("2026-08-21T08:00:00Z"))[0]!.status).toBe("OVERDUE");
    // fristgerecht gemeldet
    expect(
      computeDeadlines(
        { ...base, submitted: { GDPR_NOTIFICATION: new Date("2026-08-19T00:00:00Z") } },
        new Date("2026-08-21T08:00:00Z"),
      )[0]!.status,
    ).toBe("OK");
    // zu spät gemeldet
    expect(
      computeDeadlines(
        { ...base, submitted: { GDPR_NOTIFICATION: new Date("2026-08-21T00:00:00Z") } },
        new Date("2026-08-21T08:00:00Z"),
      )[0]!.status,
    ).toBe("LATE");
    expect(remainingLabel(due, new Date("2026-08-20T06:30:00Z"))).toBe("noch 1 h 30 min");
    expect(remainingLabel(due, new Date("2026-08-23T08:00:00Z"))).toBe("überfällig seit 3 T 0 h");
  });
});

describe("Entitätstypabhängige Fristenuhren (Meldeschicht Welle 6, ADR-0010 Nr. 5)", () => {
  // 2026-08-22 ist ein Samstag: Kenntnis Freitag 10:00 -> 24-h-Frist Samstag 10:00
  const FRIDAY = new Date("2026-08-21T10:00:00Z");
  const base = {
    awarenessAt: FRIDAY,
    classifiedAt: null,
    isMajor: true,
    gdprRelevant: false,
    nis2Relevant: false,
  };

  it("Wochenendfrist verschiebt sich auf Montag 12:00 UTC (allgemeiner Entitätstyp)", () => {
    const d = computeDeadlines({ ...base, entityCategory: "INSURANCE_UNDERTAKING" }, FRIDAY);
    const initial = d.find((x) => x.reportType === "DORA_INITIAL")!;
    expect(initial.dueAt.toISOString()).toBe("2026-08-24T12:00:00.000Z"); // Montag 12:00
  });

  it("keine Verschiebung für Kreditinstitute, CCPs und Handelsplatzbetreiber", () => {
    for (const entityCategory of ["CREDIT_INSTITUTION", "CCP", "TRADING_VENUE"]) {
      const d = computeDeadlines({ ...base, entityCategory }, FRIDAY);
      const initial = d.find((x) => x.reportType === "DORA_INITIAL")!;
      expect(initial.dueAt.toISOString(), entityCategory).toBe("2026-08-22T10:00:00.000Z");
    }
  });

  it("keine Verschiebung für NIS-2-relevante Einheiten", () => {
    const d = computeDeadlines(
      { ...base, nis2Relevant: true, entityCategory: "INSURANCE_UNDERTAKING" },
      FRIDAY,
    );
    const initial = d.find((x) => x.reportType === "DORA_INITIAL")!;
    expect(initial.dueAt.toISOString()).toBe("2026-08-22T10:00:00.000Z");
  });

  it("ohne Entitätsangabe bleibt das Altverhalten (keine Verschiebung)", () => {
    const d = computeDeadlines(base, FRIDAY);
    const initial = d.find((x) => x.reportType === "DORA_INITIAL")!;
    expect(initial.dueAt.toISOString()).toBe("2026-08-22T10:00:00.000Z");
  });

  it("Werktagsfristen bleiben unverschoben; Zwischenmeldung wird ebenfalls verschoben", () => {
    // Kenntnis Montag 10:00 -> Frist Dienstag 10:00 (Werktag, keine Verschiebung)
    const MONDAY = new Date("2026-08-17T10:00:00Z");
    const d1 = computeDeadlines(
      { ...base, awarenessAt: MONDAY, entityCategory: "INSURANCE_UNDERTAKING" },
      MONDAY,
    );
    expect(d1.find((x) => x.reportType === "DORA_INITIAL")!.dueAt.toISOString()).toBe(
      "2026-08-18T10:00:00.000Z",
    );
    // Erstmeldung Mittwoch 10:00 abgegeben -> 72 h wäre Samstag -> Montag 12:00
    const d2 = computeDeadlines(
      {
        ...base,
        awarenessAt: MONDAY,
        entityCategory: "INSURANCE_UNDERTAKING",
        submitted: { DORA_INITIAL: new Date("2026-08-19T10:00:00Z") },
      },
      MONDAY,
    );
    expect(d2.find((x) => x.reportType === "DORA_INTERMEDIATE")!.dueAt.toISOString()).toBe(
      "2026-08-24T12:00:00.000Z",
    );
  });
});
