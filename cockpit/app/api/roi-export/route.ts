import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { ROI_TAXONOMY_VERSION } from "@/lib/content/roi-taxonomies";
import { buildRoiRegister } from "@/lib/domain/roi-build";
import { summarizeFindings, validateRoi } from "@/lib/domain/roi-validation";
import { parseRegisterPayload } from "@/lib/domain/roi-diff";
import { buildRoiPackage, packageFileName } from "@/lib/domain/roi-export";
import { loadRoiInput } from "@/lib/register/roi-data";

/**
 * Meldepaket-Export (Meldeschicht Welle 3, ADR-0007): ZIP mit einer CSV je
 * Meldebogen, Filing Indicators, Metadaten und Prüfbericht.
 *
 * Ohne Parameter: neues Paket aus dem aktuellen Bestand — REJECT-Befunde
 * blockieren; Übersteuerung nur über eine genehmigte, noch nicht verbrauchte
 * ROI_EXPORT_OVERRIDE-Freigabe (wird an den erzeugten Snapshot gebunden).
 * Mit ?snapshot=<id>: unveränderter Wiederabruf eines Meldestands aus der
 * eingefrorenen Payload (Prüfsummenabgleich).
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (!hasPermission(user, "export"))
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });

  const snapshotId = req.nextUrl.searchParams.get("snapshot");
  if (snapshotId) return redownload(snapshotId, user.email);

  if (!hasPermission(user, "thirdparty:write"))
    return NextResponse.json({ error: "Keine Berechtigung zum Erzeugen." }, { status: 403 });

  const { input } = await loadRoiInput();
  const findings = validateRoi(input);
  const summary = summarizeFindings(findings);

  let overrideApprovalId: string | null = null;
  if (summary.reject > 0) {
    const override = await db.approval.findFirst({
      where: { approvalType: "ROI_EXPORT_OVERRIDE", status: "APPROVED", roiSnapshotId: null },
      orderBy: { decidedAt: "desc" },
    });
    if (!override) {
      return NextResponse.json(
        {
          error: `Export gesperrt: ${summary.reject} Befund(e) der Stufe REJECT. Übersteuerung nur mit begründeter Vier-Augen-Freigabe (ROI_EXPORT_OVERRIDE).`,
          summary,
        },
        { status: 409 },
      );
    }
    overrideApprovalId = override.id;
  }

  const register = buildRoiRegister(input);
  const maintainer = input.entities.find((e) => e.id === input.maintainerEntityId) ?? null;
  const reportingLevel =
    maintainer?.consolidationLevel === "CONSOLIDATED"
      ? "CONSOLIDATED"
      : maintainer?.consolidationLevel === "PARTIAL_CONSOLIDATED"
        ? "SUB_CONSOLIDATED"
        : "ENTITY";
  const now = new Date();
  const referenceDate = new Date(now.toISOString().slice(0, 10));

  const last = await db.roiSnapshot.findFirst({
    where: { referenceDate, reportingLevel },
    orderBy: { version: "desc" },
  });
  const version = (last?.version ?? 0) + 1;

  const pkg = buildRoiPackage(register, findings, {
    taxonomyVersion: ROI_TAXONOMY_VERSION,
    referenceDate,
    reportingLevel,
    entityLei: maintainer?.lei ?? null,
    entityName: maintainer?.name ?? null,
    generatedAt: now,
    generatedBy: user.email,
    validationSummary: summary,
  });
  const checksum = createHash("sha256").update(pkg.payload, "utf8").digest("hex");

  const snapshot = await db.roiSnapshot.create({
    data: {
      referenceDate,
      version,
      reportingLevel,
      taxonomyVersion: ROI_TAXONOMY_VERSION,
      validationSummary: JSON.stringify({ summary, findings }),
      payload: pkg.payload,
      checksum,
      createdById: user.id,
    },
  });
  if (overrideApprovalId) {
    // Übersteuerung verbrauchen: an den erzeugten Meldestand binden.
    await db.approval.update({
      where: { id: overrideApprovalId },
      data: { roiSnapshotId: snapshot.id },
    });
  }
  await audit({
    userId: user.id,
    userEmail: user.email,
    action: "EXPORT",
    entityType: "RoiSnapshot",
    entityId: snapshot.id,
    comment: `Meldepaket v${version} (${reportingLevel}, ${referenceDate.toISOString().slice(0, 10)}): REJECT ${summary.reject} · ERROR ${summary.error} · WARNING ${summary.warning} · SHA-256 ${checksum.slice(0, 12)}…${overrideApprovalId ? " · Exportsperre übersteuert (Freigabe)" : ""}`,
  });

  return zipResponse(pkg.zip, packageFileName(referenceDate, reportingLevel, version));
}

async function redownload(snapshotId: string, userEmail: string) {
  const snapshot = await db.roiSnapshot.findUnique({
    where: { id: snapshotId },
    include: { createdBy: { select: { email: true } } },
  });
  if (!snapshot) return NextResponse.json({ error: "Meldestand nicht gefunden." }, { status: 404 });

  const checksum = createHash("sha256").update(snapshot.payload, "utf8").digest("hex");
  if (checksum !== snapshot.checksum) {
    return NextResponse.json(
      { error: "Prüfsummenabweichung — der Meldestand ist nicht mehr integer." },
      { status: 500 },
    );
  }
  const stored = JSON.parse(snapshot.validationSummary ?? "{}") as {
    summary?: import("@/lib/domain/roi-validation").RoiValidationSummary;
    findings?: import("@/lib/domain/roi-validation").RoiFinding[];
  };
  const register = parseRegisterPayload(snapshot.payload);
  const pkg = buildRoiPackage(register, stored.findings ?? [], {
    taxonomyVersion: snapshot.taxonomyVersion,
    referenceDate: snapshot.referenceDate,
    reportingLevel: snapshot.reportingLevel,
    entityLei: null,
    entityName: null,
    generatedAt: snapshot.createdAt,
    generatedBy: snapshot.createdBy.email,
    validationSummary: stored.summary ?? { total: 0, reject: 0, error: 0, warning: 0, byRule: {} },
  });
  // Wiederabruf wird auditiert, verändert aber nichts am Meldestand.
  await audit({
    userId: snapshot.createdById,
    userEmail,
    action: "EXPORT",
    entityType: "RoiSnapshot",
    entityId: snapshot.id,
    comment: `Meldepaket v${snapshot.version} erneut abgerufen (unverändert, SHA-256 geprüft)`,
  });
  return zipResponse(
    pkg.zip,
    packageFileName(snapshot.referenceDate, snapshot.reportingLevel, snapshot.version),
  );
}

function zipResponse(zip: Buffer, filename: string) {
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
