import { describe, expect, it } from "vitest";
import { crc32 } from "node:zlib";
import { buildZip } from "@/lib/domain/zip";
import {
  buildRoiPackage,
  csvCell,
  findingsCsv,
  packageFileName,
  templateCsv,
} from "@/lib/domain/roi-export";
import { diffRegisters, parseRegisterPayload, rowKey } from "@/lib/domain/roi-diff";
import { buildRoiRegister } from "@/lib/domain/roi-build";
import { validateRoi, summarizeFindings } from "@/lib/domain/roi-validation";
import { ROI_TEMPLATES } from "@/lib/content/roi-taxonomies";
import { cleanRoiFixture } from "./helpers/roi-fixture";

describe("ZIP-Writer (Bordmittel, ADR-0007 Nr. 1)", () => {
  it("erzeugt gültige Signaturen, korrekte CRCs und ein End-of-Central-Directory", () => {
    const now = new Date("2026-08-30T12:00:00Z");
    const data = "contract.ref;service.ictServiceType\nCTR-1;S17\n";
    const zip = buildZip(
      [
        { name: "report/B_02.02.csv", data },
        { name: "META-INF/report.json", data: "{}" },
      ],
      now,
    );
    expect(zip.readUInt32LE(0)).toBe(0x04034b50); // local header
    // End of central directory: letzte 22 Bytes
    const eocd = zip.subarray(zip.length - 22);
    expect(eocd.readUInt32LE(0)).toBe(0x06054b50);
    expect(eocd.readUInt16LE(10)).toBe(2); // Eintragsanzahl
    // CRC des ersten Eintrags stimmt mit node:zlib überein
    expect(zip.readUInt32LE(14)).toBe(crc32(Buffer.from(data, "utf8")) >>> 0);
    // STORE: Daten stehen unkomprimiert im Archiv
    expect(zip.includes(Buffer.from("CTR-1;S17"))).toBe(true);
    // Zentralverzeichnis referenziert beide Namen (UTF-8/EFS)
    expect(zip.includes(Buffer.from("META-INF/report.json"))).toBe(true);
  });
});

describe("CSV-Erzeugung (ADR-0007 Nr. 2/3)", () => {
  it("csvCell: Escaping, Datum als ISO-Tag, Boolean als true/false, null leer", () => {
    expect(csvCell('mit "Zitat"; und Trenner')).toBe('"mit ""Zitat""; und Trenner"');
    expect(csvCell(new Date("2026-08-30T10:00:00Z"))).toBe("2026-08-30");
    expect(csvCell(true)).toBe("true");
    expect(csvCell(null)).toBe("");
  });

  it("templateCsv: feste Spaltenzahl je Zeile, Kopf aus der ersten Zeile", () => {
    const csv = templateCsv([
      { "a.x": 1, "a.y": "zwei", "a.z": null },
      { "a.x": 3, "a.y": "vier;fünf", "a.z": true },
    ]);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("a.x;a.y;a.z");
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      // Zellen mit Trenner sind gequotet — Spaltenzahl bleibt konstant
      expect(line.replace(/"[^"]*"/g, "q").split(";")).toHaveLength(3);
    }
  });

  it("findingsCsv: eine Zeile je Befund auf Feldebene", () => {
    const f = cleanRoiFixture();
    f.contracts[0]!.contractRef = null;
    const csv = findingsCsv(validateRoi(f));
    expect(csv).toContain("RV-201");
    expect(csv.split("\n")[0]).toBe("ruleId;severity;template;record;field;message");
  });
});

describe("Meldepaket (Abnahme Welle 3)", () => {
  it("aus dem Seed-äquivalenten Bestand entsteht ein vollständiges Paket, das die eigene Validierung besteht", () => {
    const input = cleanRoiFixture();
    const findings = validateRoi(input);
    expect(findings).toHaveLength(0); // besteht die eigene Validierung
    const register = buildRoiRegister(input);
    const pkg = buildRoiPackage(register, findings, {
      taxonomyVersion: "2024-2956.draft-1",
      referenceDate: new Date("2026-08-30"),
      reportingLevel: "CONSOLIDATED",
      entityLei: "529900T8BM49AURSDO55",
      entityName: "Nordlicht Holding SE",
      generatedAt: new Date("2026-08-30T12:00:00Z"),
      generatedBy: "tprm@demo.example",
      validationSummary: summarizeFindings(findings),
    });
    // eine CSV je belegtem Meldebogen (alle 15 sind aus der Fixture belegt)
    for (const template of ROI_TEMPLATES) {
      expect(pkg.files).toContain(`report/${template}.csv`);
    }
    expect(pkg.files).toContain("META-INF/filing-indicators.csv");
    expect(pkg.files).toContain("META-INF/report.json");
    expect(pkg.files).toContain("pruefbericht.csv");
    expect(pkg.zip.readUInt32LE(0)).toBe(0x04034b50);
    // Payload ist der vollständige Registerabzug
    expect(parseRegisterPayload(pkg.payload)["B_02.02"]).toHaveLength(3);
  });

  it("packageFileName folgt der Konvention", () => {
    expect(packageFileName(new Date("2026-08-30"), "ENTITY", 2)).toBe(
      "roi_2026-08-30_entity_v2.zip",
    );
  });
});

describe("Differenzbericht (Abnahme Welle 3)", () => {
  it("identische Stände: keine Unterschiede", () => {
    const register = buildRoiRegister(cleanRoiFixture());
    const diff = diffRegisters(register, register);
    expect(diff.templates).toHaveLength(0);
    expect(diff.totalAdded + diff.totalChanged + diff.totalRemoved).toBe(0);
  });

  it("manipulierter Vorstand: neu, geändert und entfallen werden je Meldebogen ausgewiesen", () => {
    const previous = buildRoiRegister(cleanRoiFixture());
    const mutated = cleanRoiFixture();
    // geändert: Jahreskosten des ersten Vertrags
    mutated.contracts[0]!.annualCostEur = 999_999;
    // entfallen: gruppeninterner Vertrag entfernt (trifft B_02.01/02.03/03.x)
    mutated.contracts = mutated.contracts.slice(0, 1);
    // neu: zusätzliche Funktion
    mutated.functions.push({
      id: "cf-neu",
      cfId: "CIF-09",
      functionIdCode: "F-009",
      name: "Neue Funktion",
      isCritical: false,
      licensedActivity: null,
      discontinuationImpact: null,
      criticalityRationale: null,
      rtoHours: null,
      rpoHours: null,
    });
    const current = buildRoiRegister(mutated);
    const diff = diffRegisters(previous, current);

    const b0201 = diff.templates.find((d) => d.template === "B_02.01")!;
    expect(b0201.changed).toContain("CTR-2026-001");
    expect(b0201.removed).toContain("CTR-2026-002");
    const b0601 = diff.templates.find((d) => d.template === "B_06.01")!;
    expect(b0601.added).toContain("CIF-09");
    expect(diff.totalRemoved).toBeGreaterThan(0);
    expect(diff.totalAdded).toBeGreaterThan(0);
    expect(diff.totalChanged).toBeGreaterThan(0);
  });

  it("rowKey nutzt fachliche Schlüssel, parseRegisterPayload toleriert Lücken", () => {
    expect(rowKey("B_02.02", { "contract.ref": "C1", "service.ictServiceType": "S17" })).toBe(
      "C1|S17",
    );
    const partial = parseRegisterPayload('{"B_05.01":[{"tp.tpId":"TP-001"}]}');
    expect(partial["B_05.01"]).toHaveLength(1);
    expect(partial["B_01.01"]).toHaveLength(0);
  });
});
