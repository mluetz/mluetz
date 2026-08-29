import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/authz";
import { audit } from "@/lib/audit";

/**
 * Prüfungspaket-Export (Review v3, P3-06/5.6): alle Nachweise, Bewertungen,
 * Findings und Audit-Trail-Auszüge zu EINER Anforderung als ein JSON-Paket
 * mit Manifest und SHA-256-Prüfsumme — für Prüfer reproduzierbar zitierbar.
 * Aufruf: /api/audit-package?requirement=DORA-K5-001
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (!hasPermission(user, "export"))
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });

  const reqId = req.nextUrl.searchParams.get("requirement");
  if (!reqId) return NextResponse.json({ error: "requirement fehlt." }, { status: 400 });

  const requirement = await db.doraRequirement.findUnique({
    where: { reqId },
    include: {
      chapter: true,
      assessments: {
        include: { assessor: { select: { email: true } } },
        orderBy: { assessedAt: "desc" },
      },
      findings: { include: { action: true } },
      evidence: { include: { owner: { select: { email: true } } } },
    },
  });
  if (!requirement) return NextResponse.json({ error: "Anforderung nicht gefunden." }, { status: 404 });

  const trail = await db.auditLog.findMany({
    where: {
      OR: [
        { entityType: "DoraRequirement", entityId: requirement.id },
        { entityType: "DoraFinding", entityId: { in: requirement.findings.map((f) => f.id) } },
        { entityType: "Evidence", entityId: { in: requirement.evidence.map((e) => e.id) } },
      ],
    },
    orderBy: { seq: "asc" },
  });

  const pkg = {
    manifest: {
      packageType: "AUDIT_EVIDENCE_PACKAGE",
      requirement: requirement.reqId,
      title: requirement.title,
      chapter: requirement.chapter.title,
      knockout: requirement.knockout,
      generatedAt: new Date().toISOString(),
      generatedBy: user.email,
      counts: {
        assessments: requirement.assessments.length,
        findings: requirement.findings.length,
        evidence: requirement.evidence.length,
        auditTrailEntries: trail.length,
      },
    },
    requirement: {
      reqId: requirement.reqId,
      article: requirement.article,
      requirementText: requirement.requirementText,
      evidenceSpec: requirement.evidenceSpec,
      bindingness: requirement.bindingness,
      ownerRole: requirement.ownerRole,
    },
    assessments: requirement.assessments.map((a) => ({
      assessedAt: a.assessedAt,
      assessor: a.assessor?.email ?? null,
      maturity: a.maturity,
      isCurrent: a.isCurrent,
      justification: a.justification,
    })),
    findings: requirement.findings.map((f) => ({
      findingId: f.findingId,
      severity: f.severity,
      status: f.status,
      title: f.title,
      capa: f.action ? { actionId: f.action.actionId, status: f.action.status, dueDate: f.action.dueDate } : null,
    })),
    evidence: requirement.evidence.map((e) => ({
      evidenceId: e.evidenceId,
      title: e.title,
      link: e.link,
      validUntil: e.validUntil,
      reviewStatus: e.reviewStatus,
      owner: e.owner?.email ?? null,
    })),
    auditTrail: trail.map((t) => ({
      seq: t.seq,
      timestamp: t.timestamp,
      user: t.userEmail,
      action: t.action,
      entityType: t.entityType,
      field: t.field,
      oldValue: t.oldValue,
      newValue: t.newValue,
      comment: t.comment,
      hash: t.hash,
    })),
  };

  const body = JSON.stringify(pkg, null, 2);
  const checksum = createHash("sha256").update(body, "utf8").digest("hex");

  await audit({
    userId: user.id,
    userEmail: user.email,
    action: "EXPORT",
    entityType: "DoraRequirement",
    entityId: requirement.id,
    comment: `Prüfungspaket ${requirement.reqId} exportiert (SHA-256 ${checksum.slice(0, 12)}…)`,
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pruefungspaket_${requirement.reqId}.json"`,
      "X-Package-Checksum": checksum,
    },
  });
}
