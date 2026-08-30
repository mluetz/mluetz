import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { hasPermission } from "@/lib/authz";
import { getSessionUser } from "@/lib/auth/session";
import { getRiskRows } from "@/features/risks/queries";
import { formatDate, toCsv } from "@/lib/utils";
import {
  COMPLIANCE_STATUS,
  FRAMEWORKS,
  RISK_STATUS,
  TP_STATUS,
  type ComplianceStatus,
  type RiskStatus,
  type TpStatus,
} from "@/lib/domain/enums";

/**
 * CSV-Direktexporte: /api/export?type=risks|actions|controls|third-parties|compliance&format=csv
 * Serverseitige Autorisierung über die Berechtigung "export"; jeder Export
 * wird im Audit Trail protokolliert.
 */

export const dynamic = "force-dynamic";

const EXPORT_TYPES = ["risks", "actions", "controls", "third-parties", "compliance"] as const;
type ExportType = (typeof EXPORT_TYPES)[number];

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !hasPermission(user, "export")) {
    return NextResponse.json({ error: "Keine Berechtigung für Exporte." }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "";
  const format = req.nextUrl.searchParams.get("format") ?? "csv";
  if (!EXPORT_TYPES.includes(type as ExportType)) {
    return NextResponse.json({ error: `Unbekannter Export-Typ: ${type}` }, { status: 400 });
  }
  if (format !== "csv") {
    return NextResponse.json({ error: `Nicht unterstütztes Format: ${format}` }, { status: 400 });
  }

  const csv = await buildCsv(type as ExportType);

  await audit({
    userId: user.id,
    userEmail: user.email,
    action: "EXPORT",
    entityType: type,
    entityId: "bulk",
    comment: format,
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${date}.csv"`,
    },
  });
}

async function buildCsv(type: ExportType): Promise<string> {
  switch (type) {
    case "risks": {
      const rows = await getRiskRows();
      return toCsv(
        [
          "Risiko-ID",
          "Titel",
          "Status",
          "Kategorie",
          "Risk Owner",
          "Inherent Score",
          "Residual Score",
          "Residual-Klasse",
          "Risikoappetit",
          "Über Appetit",
          "Nächstes Review",
          "Offene Maßnahmen",
          "Überfällige Maßnahmen",
          "Strategie",
        ],
        rows.map((r) => [
          r.riskId,
          r.title,
          RISK_STATUS[r.status as RiskStatus] ?? r.status,
          r.category,
          r.ownerName ?? "",
          r.inherentScore ?? "",
          r.residualScore ?? "",
          r.residualClass ?? "",
          r.appetiteThreshold,
          r.aboveAppetite ? "ja" : "nein",
          formatDate(r.nextReviewDate),
          r.openActions,
          r.overdueActions,
          r.treatmentStrategy ?? "",
        ]),
      );
    }
    case "actions": {
      const actions = await db.action.findMany({
        include: { risk: { select: { riskId: true, title: true } }, owner: true },
        orderBy: { actionId: "asc" },
      });
      return toCsv(
        [
          "Maßnahmen-ID",
          "Titel",
          "Risiko",
          "Status",
          "Priorität",
          "Owner",
          "Fälligkeit",
          "Fortschritt %",
          "Eskalationsstufe",
        ],
        actions.map((a) => [
          a.actionId,
          a.title,
          a.risk.riskId,
          a.status,
          a.priority,
          a.owner?.name ?? "",
          formatDate(a.dueDate),
          a.progress,
          a.escalationLevel,
        ]),
      );
    }
    case "controls": {
      const controls = await db.control.findMany({
        include: { owner: true },
        orderBy: { controlId: "asc" },
      });
      return toCsv(
        [
          "Kontroll-ID",
          "Name",
          "Typ",
          "Automatisierung",
          "Frequenz",
          "Owner",
          "Design-Wirksamkeit",
          "Operative Wirksamkeit",
          "Nächster Test",
        ],
        controls.map((c) => [
          c.controlId,
          c.name,
          c.controlType,
          c.automation,
          c.frequency,
          c.owner?.name ?? "",
          c.designEffectiveness,
          c.operatingEffectiveness,
          formatDate(c.nextTestDate),
        ]),
      );
    }
    case "third-parties": {
      const tps = await db.thirdParty.findMany({
        include: { exitStrategy: true },
        orderBy: { tpId: "asc" },
      });
      return toCsv(
        [
          "TP-ID",
          "Name",
          "Status",
          "Kritikalität",
          "Inherent Score",
          "Residual Score",
          "Due-Diligence-Status",
          "Nächstes Review",
          "Konzentrationsrisiko",
          "Exit-Status",
        ],
        tps.map((t) => [
          t.tpId,
          t.name,
          TP_STATUS[t.status as TpStatus] ?? t.status,
          t.criticality,
          t.inherentRiskScore ?? "",
          t.residualRiskScore ?? "",
          t.dueDiligenceStatus,
          formatDate(t.nextReviewDate),
          t.concentrationRisk ? "ja" : "nein",
          t.exitStrategy?.status ?? "MISSING",
        ]),
      );
    }
    case "compliance": {
      const mappings = await db.complianceMapping.findMany({
        include: { requirement: true, owner: true, evidence: true },
        orderBy: { requirement: { refId: "asc" } },
      });
      return toCsv(
        [
          "Ref-ID",
          "Framework",
          "Anforderung",
          "Status",
          "Begründung",
          "Owner",
          "Nachweis",
          "Bewertet am",
          "Nächstes Review",
        ],
        mappings.map((m) => [
          m.requirement.refId,
          FRAMEWORKS[m.requirement.framework as keyof typeof FRAMEWORKS] ?? m.requirement.framework,
          m.requirement.title,
          COMPLIANCE_STATUS[m.status as ComplianceStatus] ?? m.status,
          m.justification,
          m.owner?.name ?? "",
          m.evidence?.evidenceId ?? "",
          formatDate(m.assessedAt),
          formatDate(m.nextReviewDate),
        ]),
      );
    }
  }
}
