/**
 * Seed des Informationsregister-Mappings (Review v3, P1-01) — idempotent.
 * Legt BEIDE im Umlauf befindlichen Bezeichnungsschemata als Fassungs-
 * datensätze an, Status TO_VERIFY: Verbindlich ist allein der Text der
 * DVO (EU) 2024/2956 und die aktuellen ESA-Meldebögen; nichts hiervon ist
 * im Code hartcodiert — ein Fassungswechsel ist Datenpflege.
 *
 * Aufruf: aus prisma/seed.ts oder standalone
 *   node --experimental-strip-types prisma/register-seed.mjs  (bzw. via tsx)
 */

const FIELDSETS = {
  ENTITY: [
    ["entity.name", true],
    ["entity.lei", true],
    ["entity.nationalId", false],
    ["entity.nationalIdType", false],
    ["entity.consolidationLevel", true],
    ["entity.parent", false],
  ],
  PROVIDER: [
    ["tp.tpId", true],
    ["tp.name", true],
    ["tp.lei", false],
    ["tp.nationalId", false],
    ["tp.nationalIdType", false],
    ["tp.country", true],
    ["tp.serviceCategory", true],
    ["tp.substitutability", true],
    ["tp.exitPlanPresent", false],
  ],
  ARRANGEMENT: [
    ["contract.ref", true],
    ["contract.title", false],
    ["contract.tp", true],
    ["contract.startDate", true],
    ["contract.endDate", false],
    ["contract.noticePeriodDays", false],
    ["contract.countryOfProvision", true],
    ["contract.countryOfDataStorage", true],
    ["contract.countryOfDataProcessing", true],
    ["contract.cif", true],
    ["contract.preAssessmentResult", false],
  ],
  FUNCTION: [
    ["function.cfId", true],
    ["function.name", true],
    ["function.idCode", true],
    ["function.isCritical", true],
    ["function.tp", true],
  ],
  CHAIN: [
    ["chain.tp", true],
    ["chain.name", true],
    ["chain.lei", false],
    ["chain.rank", true],
    ["chain.parent", false],
    ["chain.country", true],
    ["chain.service", false],
    ["chain.sharePercent", false],
    ["chain.providesCifService", true],
  ],
};

const SCHEMAS = [
  {
    label: "B_01-Schema (zu verifizieren)",
    source:
      "Bezeichnungsschema B_01.01 … B_99.01 — kursierende Fassung; gegen DVO (EU) 2024/2956 verifizieren",
    templates: {
      ENTITY: "B_01.01",
      PROVIDER: "B_05.01",
      ARRANGEMENT: "B_02.02",
      FUNCTION: "B_06.01",
      CHAIN: "B_05.02",
    },
    fieldPrefix: "c",
  },
  {
    label: "RT-Schema (zu verifizieren)",
    source:
      "Bezeichnungsschema RT.01.01 … RT.11.01 — kursierende Fassung; gegen DVO (EU) 2024/2956 verifizieren",
    templates: {
      ENTITY: "RT.01.01",
      PROVIDER: "RT.05.01",
      ARRANGEMENT: "RT.02.02",
      FUNCTION: "RT.06.01",
      CHAIN: "RT.05.02",
    },
    fieldPrefix: "F",
  },
];

function dataTypeFor(cockpitField) {
  if (cockpitField.endsWith(".lei")) return "LEI";
  if (cockpitField.includes("country") || cockpitField.includes("Country")) return "COUNTRY";
  if (cockpitField.endsWith("Date")) return "DATE";
  if (
    cockpitField.endsWith("Days") ||
    cockpitField.endsWith("rank") ||
    cockpitField.endsWith("Percent")
  )
    return "NUMBER";
  if (
    cockpitField.endsWith(".cif") ||
    cockpitField.endsWith("isCritical") ||
    cockpitField.endsWith("providesCifService") ||
    cockpitField.endsWith("exitPlanPresent")
  )
    return "BOOLEAN";
  if (cockpitField.endsWith("substitutability") || cockpitField.endsWith("consolidationLevel"))
    return "ENUM";
  return "STRING";
}

export async function seedRegisterMapping(db, { log = () => {} } = {}) {
  for (const schema of SCHEMAS) {
    let version = await db.itsTemplateVersion.findUnique({ where: { label: schema.label } });
    if (!version) {
      version = await db.itsTemplateVersion.create({
        data: {
          label: schema.label,
          source: schema.source,
          status: "TO_VERIFY",
          notes:
            "Vor produktiver Einreichung: Meldebogen-Bezeichnungen und Feld-IDs am verbindlichen Text verifizieren, dann Status auf VERIFIED setzen.",
        },
      });
      for (const [kind, fields] of Object.entries(FIELDSETS)) {
        const template = schema.templates[kind];
        let i = 0;
        for (const [cockpitField, required] of fields) {
          i += 1;
          await db.itsFieldMapping.create({
            data: {
              versionId: version.id,
              cockpitField,
              template,
              fieldId: `${schema.fieldPrefix}${String(i * 10).padStart(4, "0")}`,
              dataType: dataTypeFor(cockpitField),
              codeList: cockpitField.endsWith("substitutability")
                ? "SUBSTITUTABILITY"
                : cockpitField.endsWith("consolidationLevel")
                  ? "CONSOLIDATION_LEVEL"
                  : dataTypeFor(cockpitField) === "COUNTRY"
                    ? "ISO3166-1"
                    : null,
              required,
              transformation:
                dataTypeFor(cockpitField) === "BOOLEAN" ? "true/false -> Y/N" : null,
            },
          });
        }
      }
      log(`ITS-Fassung angelegt: ${schema.label}`);
    }
  }

  // Meldende Entitäten (Hierarchie, Konsolidierungsebenen)
  const parentName = "Nordlicht Holding SE";
  let parent = await db.reportingEntity.findFirst({ where: { name: parentName } });
  if (!parent) {
    parent = await db.reportingEntity.create({
      data: {
        name: parentName,
        lei: "529900T8BM49AURSDO55",
        consolidationLevel: "CONSOLIDATED",
      },
    });
    await db.reportingEntity.create({
      data: {
        name: "Nordlicht Bank AG",
        lei: "5299009D9BIL4D4UHT93",
        consolidationLevel: "SOLO",
        parentId: parent.id,
      },
    });
    await db.reportingEntity.create({
      data: {
        name: "Nordlicht Asset Management GmbH",
        nationalId: "HRB 123456",
        nationalIdType: "HRB",
        consolidationLevel: "SOLO",
        parentId: parent.id,
      },
    });
    log("Meldende Entitäten angelegt (Holding + 2 Töchter).");
  }
}
