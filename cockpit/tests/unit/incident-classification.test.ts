import { describe, expect, it } from "vitest";
import {
  CLASSIFICATION_CRITERIA,
  EMPTY_MEASUREMENTS,
  aggregateRecurring,
  deriveIsMajor,
  evaluateCriteria,
  parseMeasurements,
  type IncidentMeasurements,
} from "@/lib/domain/incident-classification";

const met = (keys: string[]) =>
  CLASSIFICATION_CRITERIA.map((c) => ({ key: c.key, met: keys.includes(c.key) }));

const m = (overrides: Partial<IncidentMeasurements>): IncidentMeasurements => ({
  ...EMPTY_MEASUREMENTS,
  ...overrides,
});

describe("Major-Regel (Auftrag Welle 6, ADR-0010 Nr. 3)", () => {
  it("Kritikalität + Datenverlust => schwerwiegend", () => {
    expect(deriveIsMajor(met(["CRITICAL_SERVICES", "DATA_LOSS"]))).toBe(true);
  });
  it("Kritikalität + zwei weitere Kriterien => schwerwiegend", () => {
    expect(deriveIsMajor(met(["CRITICAL_SERVICES", "DURATION", "ECONOMIC"]))).toBe(true);
  });
  it("Kritikalität + nur ein weiteres Kriterium (ohne Datenverlust) reicht nicht", () => {
    expect(deriveIsMajor(met(["CRITICAL_SERVICES", "DURATION"]))).toBe(false);
  });
  it("ohne Kritikalität nie schwerwiegend — auch bei vielen Kriterien", () => {
    expect(deriveIsMajor(met(["CLIENTS_TRANSACTIONS", "DURATION", "ECONOMIC", "DATA_LOSS"]))).toBe(
      false,
    );
  });
  it("Altschlüssel (CLIENTS/TRANSACTIONS) werden auf das Sammelkriterium normalisiert", () => {
    // Bestandsdaten aus Review v3: CLIENTS und TRANSACTIONS getrennt erfüllt
    // zählen zusammen nur als EIN weiteres Kriterium.
    const legacy = [
      { key: "CRITICAL_SERVICES", met: true },
      { key: "CLIENTS", met: true },
      { key: "TRANSACTIONS", met: true },
    ];
    expect(deriveIsMajor(legacy)).toBe(false);
    expect(deriveIsMajor([...legacy, { key: "DURATION", met: true }])).toBe(true);
  });
  it("Kriterienkatalog umfasst die sieben DelVO-Kriterien", () => {
    expect(CLASSIFICATION_CRITERIA).toHaveLength(7);
    expect(CLASSIFICATION_CRITERIA.map((c) => c.key)).toContain("CLIENTS_TRANSACTIONS");
  });
});

describe("Messwertbewertung (ADR-0010 Nr. 2)", () => {
  it("Kunden/Transaktionen: Schwellwerte absolut und relativ", () => {
    const byKey = (mm: IncidentMeasurements) =>
      new Map(evaluateCriteria(mm).map((r) => [r.key, r.met]));
    expect(byKey(m({ clientsAffectedCount: 150_000 })).get("CLIENTS_TRANSACTIONS")).toBe(true);
    expect(byKey(m({ clientsAffectedPercent: 12 })).get("CLIENTS_TRANSACTIONS")).toBe(true);
    expect(byKey(m({ transactionsPercentOfDaily: 11 })).get("CLIENTS_TRANSACTIONS")).toBe(true);
    expect(
      byKey(m({ clientsAffectedCount: 500, clientsAffectedPercent: 2 })).get(
        "CLIENTS_TRANSACTIONS",
      ),
    ).toBe(false);
  });

  it("Dauer/Dienstausfall, Geografie, Wirtschaft und Schutzziele", () => {
    const results = evaluateCriteria(
      m({
        durationHours: 30,
        memberStatesAffected: 2,
        economicImpactEur: 250_000,
        dataLossIntegrity: true,
        criticalServicesAffected: true,
      }),
    );
    const byKey = new Map(results.map((r) => [r.key, r]));
    expect(byKey.get("DURATION")!.met).toBe(true);
    expect(byKey.get("GEO")!.met).toBe(true);
    expect(byKey.get("ECONOMIC")!.met).toBe(true);
    expect(byKey.get("DATA_LOSS")!.met).toBe(true);
    expect(byKey.get("DATA_LOSS")!.actualValue).toContain("Integrität");
    expect(byKey.get("CRITICAL_SERVICES")!.met).toBe(true);
    expect(byKey.get("REPUTATION")!.met).toBe(false);
    // Messwerte ergeben hier auch die Major-Ableitung
    expect(deriveIsMajor(results)).toBe(true);
  });

  it("leere Messwerte: kein Kriterium erfüllt", () => {
    expect(evaluateCriteria(EMPTY_MEASUREMENTS).every((r) => !r.met)).toBe(true);
  });

  it("parseMeasurements ist tolerant gegen fehlende Felder und defektes JSON", () => {
    expect(parseMeasurements(null)).toBeNull();
    expect(parseMeasurements("kein json")).toBeNull();
    const parsed = parseMeasurements('{"durationHours": 5}');
    expect(parsed!.durationHours).toBe(5);
    expect(parsed!.criticalServicesAffected).toBe(false);
  });
});

describe("Aggregation wiederkehrender Vorfälle (ADR-0010 Nr. 4)", () => {
  const NOW = new Date("2026-08-30T12:00:00Z");
  const small = (occurredAt: string, overrides: Partial<IncidentMeasurements> = {}) => ({
    incidentRef: `INC-${occurredAt}`,
    occurredAt: new Date(occurredAt),
    measurements: m({
      criticalServicesAffected: true,
      durationHours: 15, // einzeln unter der 24-h-Schwelle
      economicImpactEur: 60_000, // einzeln unter der 100-k-Schwelle
      ...overrides,
    }),
  });

  it("kumuliert Vorfälle gleicher Ursache im Sechs-Monats-Fenster zu einem schwerwiegenden Vorfall", () => {
    // Einzeln: nur Kritikalität erfüllt -> nicht schwerwiegend
    expect(deriveIsMajor(evaluateCriteria(small("2026-08-01").measurements))).toBe(false);
    const agg = aggregateRecurring(
      [small("2026-04-10"), small("2026-06-15"), small("2026-08-01")],
      NOW,
    );
    expect(agg.consideredRefs).toHaveLength(3);
    // Kumuliert: Dauer 45 h und Kosten 180 k überschreiten die Schwellen
    expect(agg.combined.durationHours).toBe(45);
    expect(agg.combined.economicImpactEur).toBe(180_000);
    expect(agg.isMajor).toBe(true);
  });

  it("Vorfälle außerhalb des Fensters bleiben unberücksichtigt", () => {
    const agg = aggregateRecurring(
      [small("2025-09-01"), small("2026-08-01")], // erster liegt > 6 Monate zurück
      NOW,
    );
    expect(agg.consideredRefs).toHaveLength(1);
    expect(agg.isMajor).toBe(false); // ein einzelner Vorfall ist kein Aggregat
  });

  it("ein einzelner Vorfall wird nie zum Aggregat, auch wenn er die Kriterien erfüllt", () => {
    const agg = aggregateRecurring(
      [small("2026-08-01", { durationHours: 100, economicImpactEur: 500_000 })],
      NOW,
    );
    expect(deriveIsMajor(agg.results)).toBe(true);
    expect(agg.isMajor).toBe(false);
  });
});
