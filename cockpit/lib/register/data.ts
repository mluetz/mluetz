import "server-only";
import { db } from "@/lib/db";
import { isValidLei } from "@/lib/domain/lei";

/**
 * Informationsregister (Review v3, P1-01) — Schicht 1 und 3:
 * fachliche Datenerhebung und Validierungslauf ("Probeeinreichung").
 * Die Meldebogen-/Feldzuordnung (Schicht 2) kommt ausschließlich aus den
 * Daten (ItsTemplateVersion/ItsFieldMapping), nie aus dem Code.
 */

export interface RegisterRecord {
  /** Datensatzart: ENTITY | PROVIDER | ARRANGEMENT | FUNCTION | CHAIN */
  kind: string;
  /** Fachlicher Schlüssel für Fehlerlisten (z. B. TP-001, Vertragstitel). */
  ref: string;
  /** Flache Feldwerte, adressiert über cockpitField-Pfade des Mappings. */
  fields: Record<string, string | number | boolean | null>;
}

export interface ValidationIssue {
  ref: string;
  kind: string;
  field: string;
  severity: "ERROR" | "WARNING";
  message: string;
}

const SUBSTITUTABILITY_CODES = ["EASY", "DIFFICULT", "HARDLY_SUBSTITUTABLE", "NOT_ASSESSED"];

export async function collectRegisterRecords(): Promise<RegisterRecord[]> {
  const [entities, tps] = await Promise.all([
    db.reportingEntity.findMany({ include: { parent: true } }),
    db.thirdParty.findMany({
      include: {
        contracts: { include: { clauses: true, preAssessment: true } },
        criticalFunctions: true,
        subcontractors: { include: { parent: true } },
        exitStrategy: true,
      },
      orderBy: { tpId: "asc" },
    }),
  ]);

  const records: RegisterRecord[] = [];

  for (const e of entities) {
    records.push({
      kind: "ENTITY",
      ref: e.name,
      fields: {
        "entity.name": e.name,
        "entity.lei": e.lei,
        "entity.nationalId": e.nationalId,
        "entity.nationalIdType": e.nationalIdType,
        "entity.consolidationLevel": e.consolidationLevel,
        "entity.parent": e.parent?.name ?? null,
      },
    });
  }

  for (const tp of tps) {
    records.push({
      kind: "PROVIDER",
      ref: tp.tpId,
      fields: {
        "tp.tpId": tp.tpId,
        "tp.name": tp.name,
        "tp.lei": tp.lei,
        "tp.nationalId": tp.nationalId,
        "tp.nationalIdType": tp.nationalIdType,
        "tp.country": tp.registeredCountry,
        "tp.serviceCategory": tp.ictServiceCategory,
        "tp.substitutability": tp.substitutability,
        "tp.cifCount": tp.criticalFunctions.length,
        "tp.exitPlanPresent": tp.exitStrategy != null && tp.exitStrategy.status !== "MISSING",
      },
    });

    for (const c of tp.contracts) {
      records.push({
        kind: "ARRANGEMENT",
        ref: `${tp.tpId}/${c.contractRef ?? c.title}`,
        fields: {
          "contract.ref": c.contractRef,
          "contract.title": c.title,
          "contract.tp": tp.tpId,
          "contract.startDate": c.startDate.toISOString().slice(0, 10),
          "contract.endDate": c.endDate?.toISOString().slice(0, 10) ?? null,
          "contract.noticePeriodDays": c.noticePeriodDays,
          "contract.countryOfProvision": c.countryOfProvision,
          "contract.countryOfDataStorage": c.countryOfDataStorage,
          "contract.countryOfDataProcessing": c.countryOfDataProcessing,
          "contract.cif": tp.criticalFunctions.length > 0,
          "contract.preAssessmentResult": c.preAssessment?.result ?? null,
        },
      });
    }

    for (const cf of tp.criticalFunctions) {
      records.push({
        kind: "FUNCTION",
        ref: `${tp.tpId}/${cf.cfId}`,
        fields: {
          "function.cfId": cf.cfId,
          "function.name": cf.name,
          "function.idCode": cf.functionIdCode,
          "function.isCritical": cf.isCritical,
          "function.tp": tp.tpId,
        },
      });
    }

    for (const s of tp.subcontractors) {
      records.push({
        kind: "CHAIN",
        ref: `${tp.tpId}/${s.name}`,
        fields: {
          "chain.tp": tp.tpId,
          "chain.name": s.name,
          "chain.lei": s.lei,
          "chain.rank": s.rank,
          "chain.parent": s.parent?.name ?? tp.name,
          "chain.country": s.country,
          "chain.service": s.service,
          "chain.sharePercent": s.sharePercent,
          "chain.providesCifService": s.providesCifService,
        },
      });
    }
  }

  return records;
}

/** Fachlicher Validierungslauf (Pflichtfelder, LEI-Prüfziffer, Codelisten,
 *  Referenzintegrität) — Ergebnis als Fehlerliste je Datensatz. */
export function validateRegisterRecords(records: RegisterRecord[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (
    r: RegisterRecord,
    field: string,
    severity: "ERROR" | "WARNING",
    message: string,
  ) => issues.push({ ref: r.ref, kind: r.kind, field, severity, message });

  const providerIds = new Set(
    records.filter((r) => r.kind === "PROVIDER").map((r) => String(r.fields["tp.tpId"])),
  );

  for (const r of records) {
    const f = r.fields;
    if (r.kind === "ENTITY") {
      if (!f["entity.lei"]) push(r, "entity.lei", "ERROR", "LEI der meldenden Entität fehlt.");
      else if (!isValidLei(String(f["entity.lei"])))
        push(r, "entity.lei", "ERROR", "LEI-Prüfziffer ungültig (ISO 17442).");
    }
    if (r.kind === "PROVIDER") {
      const lei = f["tp.lei"] ? String(f["tp.lei"]) : null;
      if (lei) {
        if (!isValidLei(lei)) push(r, "tp.lei", "ERROR", "LEI-Prüfziffer ungültig (ISO 17442).");
      } else if (!f["tp.nationalId"] || !f["tp.nationalIdType"]) {
        push(
          r,
          "tp.lei",
          "ERROR",
          "Weder LEI noch nationale Kennung mit Kennungstyp vorhanden.",
        );
      }
      if (!SUBSTITUTABILITY_CODES.includes(String(f["tp.substitutability"])))
        push(r, "tp.substitutability", "ERROR", "Unzulässiger Codelistenwert.");
      else if (f["tp.substitutability"] === "NOT_ASSESSED" && Number(f["tp.cifCount"]) > 0)
        push(r, "tp.substitutability", "ERROR", "Substituierbarkeit bei CIF-Bezug nicht bewertet.");
      if (Number(f["tp.cifCount"]) > 0 && f["tp.exitPlanPresent"] !== true)
        push(r, "tp.exitPlanPresent", "ERROR", "Ausstiegsplan bei CIF-Bezug fehlt (Art. 28 Abs. 8).");
    }
    if (r.kind === "ARRANGEMENT") {
      if (!f["contract.ref"])
        push(r, "contract.ref", "ERROR", "Vertrags-Referenznummer fehlt (Registerpflichtfeld).");
      if (!providerIds.has(String(f["contract.tp"])))
        push(r, "contract.tp", "ERROR", "Referenzintegrität: Dienstleister nicht im Register.");
      for (const c of [
        "contract.countryOfProvision",
        "contract.countryOfDataStorage",
        "contract.countryOfDataProcessing",
      ]) {
        if (!f[c]) push(r, c, "ERROR", "Land fehlt (Leistungserbringung/Datenspeicherung/-verarbeitung).");
      }
      if (f["contract.cif"] === true && f["contract.noticePeriodDays"] == null)
        push(r, "contract.noticePeriodDays", "ERROR", "Kündigungsfrist bei CIF-Vertrag fehlt.");
      if (f["contract.cif"] === true && !f["contract.preAssessmentResult"])
        push(r, "contract.preAssessmentResult", "WARNING", "Vorabbewertung nach Art. 29 nicht dokumentiert.");
    }
    if (r.kind === "FUNCTION") {
      if (!f["function.idCode"])
        push(r, "function.idCode", "ERROR", "Funktions-Identifikationscode fehlt.");
    }
    if (r.kind === "CHAIN") {
      if (f["chain.rank"] == null || Number(f["chain.rank"]) < 1)
        push(r, "chain.rank", "ERROR", "Kettenrang fehlt oder ungültig.");
      if (!f["chain.country"]) push(r, "chain.country", "ERROR", "Land des Kettenglieds fehlt.");
      if (f["chain.sharePercent"] == null)
        push(r, "chain.sharePercent", "WARNING", "Leistungsanteil des Kettenglieds nicht erfasst.");
    }
  }
  return issues;
}

/** CSV-Erzeugung strikt aus dem Daten-Mapping der gewählten Fassung. */
export function buildCsvFromMapping(
  records: RegisterRecord[],
  mappings: {
    cockpitField: string;
    template: string;
    fieldId: string;
    required: boolean;
  }[],
): { template: string; csv: string }[] {
  const byTemplate = new Map<string, { cockpitField: string; fieldId: string }[]>();
  for (const m of mappings) {
    const list = byTemplate.get(m.template) ?? [];
    list.push({ cockpitField: m.cockpitField, fieldId: m.fieldId });
    byTemplate.set(m.template, list);
  }

  const kindForTemplatePrefix = (fields: { cockpitField: string }[]): string => {
    const first = fields[0]?.cockpitField ?? "";
    if (first.startsWith("entity.")) return "ENTITY";
    if (first.startsWith("tp.")) return "PROVIDER";
    if (first.startsWith("contract.")) return "ARRANGEMENT";
    if (first.startsWith("function.")) return "FUNCTION";
    return "CHAIN";
  };

  const esc = (v: string | number | boolean | null | undefined): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const out: { template: string; csv: string }[] = [];
  for (const [template, fields] of byTemplate) {
    const kind = kindForTemplatePrefix(fields);
    const rows = records.filter((r) => r.kind === kind);
    const header = fields.map((f) => f.fieldId).join(";");
    const body = rows
      .map((r) => fields.map((f) => esc(r.fields[f.cockpitField])).join(";"))
      .join("\n");
    out.push({ template, csv: body ? `${header}\n${body}` : header });
  }
  return out;
}
