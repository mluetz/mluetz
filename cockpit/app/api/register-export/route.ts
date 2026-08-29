import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authz";
import { audit } from "@/lib/audit";
import {
  buildCsvFromMapping,
  collectRegisterRecords,
  validateRegisterRecords,
} from "@/lib/register/data";

/**
 * Informationsregister-Export (Review v3, P1-01, Schicht 3):
 * CSV-Set strikt aus dem Daten-Mapping der gewählten ITS-Fassung, mit
 * vorgeschaltetem Validierungslauf, Prüfsumme und Erzeugungsprotokoll
 * (RegisterExport) — auditiert. Fassungen mit Status TO_VERIFY werden
 * exportiert, aber deutlich als Probeeinreichung gekennzeichnet.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (!hasPermission(user, "thirdparty:read"))
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });

  const versionId = req.nextUrl.searchParams.get("version");
  if (!versionId) return NextResponse.json({ error: "version fehlt." }, { status: 400 });
  const version = await db.itsTemplateVersion.findUnique({
    where: { id: versionId },
    include: { mappings: true },
  });
  if (!version) return NextResponse.json({ error: "Fassung nicht gefunden." }, { status: 404 });

  const records = await collectRegisterRecords();
  const issues = validateRegisterRecords(records);
  const errorCount = issues.filter((i) => i.severity === "ERROR").length;
  const csvs = buildCsvFromMapping(records, version.mappings);

  const asOf = new Date();
  const bundle = [
    `# Informationsregister nach Art. 28 Abs. 3 DORA — ${version.status === "VERIFIED" ? "Einreichungsexport" : "PROBEEINREICHUNG (Fassung nicht verifiziert)"}`,
    `# Fassung: ${version.label}`,
    `# Stichtag: ${asOf.toISOString()}`,
    `# Ersteller: ${user.email}`,
    `# Datensätze: ${records.length} · Validierungsfehler: ${errorCount}`,
    "",
    ...csvs.flatMap((c) => [`## ${c.template}`, c.csv, ""]),
  ].join("\n");
  const checksum = createHash("sha256").update(bundle, "utf8").digest("hex");
  const withChecksum = `${bundle}\n# SHA-256: ${checksum}\n`;

  await db.registerExport.create({
    data: {
      templateVersionId: version.id,
      asOfDate: asOf,
      createdById: user.id,
      recordCount: records.length,
      errorCount,
      checksum,
      format: "CSV",
      validationReport: JSON.stringify(issues),
    },
  });
  await audit({
    userId: user.id,
    userEmail: user.email,
    action: "EXPORT",
    entityType: "RegisterExport",
    entityId: version.label,
    comment: `Registerexport: ${records.length} Datensätze, ${errorCount} Fehler, SHA-256 ${checksum.slice(0, 12)}…`,
  });

  return new NextResponse(withChecksum, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="informationsregister_${asOf.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
