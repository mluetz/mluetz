"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";
import { TP_STATUS, TP_TRANSITIONS, type TpStatus } from "@/lib/domain/enums";
import { CLAUSE_STATUS, requiredClausesFor } from "@/lib/domain/art30";
import { isValidLei } from "@/lib/domain/lei";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

// ---------------------------------------------------------------
// Drittpartei anlegen
// ---------------------------------------------------------------

const createSchema = z.object({
  name: z.string().min(2).max(200),
  providedService: z.string().min(2).max(2000),
  registeredCountry: z.string().min(2).max(100),
  serviceLocations: z.string().min(2).max(500),
  dataLocations: z.string().min(2).max(500),
  informationTypes: z.string().min(2).max(1000),
  ictServiceCategory: z.string().min(2).max(200),
});

export async function createThirdParty(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let tpDbId = "";
  try {
    const user = await assertPermission("thirdparty:write");
    const parsed = createSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        error:
          "Eingaben unvollständig: " + parsed.error.issues.map((i) => i.path.join(".")).join(", "),
      };
    }
    const d = parsed.data;

    // Dublettenprüfung (Review v3, P2-11): primär über LEI, sekundär über
    // normalisierten Namen + Land — nie über bloße Namensgleichheit.
    const lei = String(formData.get("lei") ?? "").toUpperCase().trim() || null;
    if (lei) {
      if (!isValidLei(lei)) return { error: "LEI ungültig (ISO-17442-Prüfziffer)." };
      const dupLei = await db.thirdParty.findFirst({ where: { lei } });
      if (dupLei) return { error: `Dublette: LEI bereits erfasst als ${dupLei.tpId} (${dupLei.name}).` };
    }
    const normalized = d.name.trim().toLowerCase().replace(/\s+/g, " ");
    const sameCountry = await db.thirdParty.findMany({
      where: { registeredCountry: d.registeredCountry },
      select: { tpId: true, name: true },
    });
    const dupName = sameCountry.find(
      (t) => t.name.trim().toLowerCase().replace(/\s+/g, " ") === normalized,
    );
    if (dupName) {
      return { error: `Mögliche Dublette: ${dupName.tpId} (${dupName.name}) im selben Land.` };
    }

    const count = await db.thirdParty.count();
    const tpId = `TP-${String(count + 1).padStart(3, "0")}`;
    const tp = await db.thirdParty.create({
      data: {
        tpId,
        name: d.name,
        lei,
        providedService: d.providedService,
        registeredCountry: d.registeredCountry,
        serviceLocations: d.serviceLocations,
        dataLocations: d.dataLocations,
        informationTypes: d.informationTypes,
        ictServiceCategory: d.ictServiceCategory,
        status: "SCREENING",
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "ThirdParty",
      entityId: tp.id,
      comment: `Drittpartei ${tpId} (${d.name}) angelegt`,
    });
    tpDbId = tp.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
  revalidatePath("/third-parties");
  redirect(`/third-parties/${tpDbId}`);
}

// ---------------------------------------------------------------
// Statuswechsel (TPRM-Workflow)
// ---------------------------------------------------------------

const statusSchema = z.object({
  thirdPartyId: z.string().min(1),
  newStatus: z.string().min(1),
  comment: z.string().min(3).max(1000),
});

export async function changeTpStatus(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("thirdparty:write");
    const parsed = statusSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success)
      return { error: "Statuswechsel benötigt einen Kommentar (mind. 3 Zeichen)." };
    const d = parsed.data;

    const tp = await db.thirdParty.findUnique({ where: { id: d.thirdPartyId } });
    if (!tp) return { error: "Drittpartei nicht gefunden." };
    const from = tp.status as TpStatus;
    const to = d.newStatus as TpStatus;
    if (!(to in TP_STATUS)) return { error: "Ungültiger Zielstatus." };
    if (!TP_TRANSITIONS[from]?.includes(to)) {
      return { error: `Übergang ${TP_STATUS[from]} → ${TP_STATUS[to]} ist nicht zulässig.` };
    }

    await db.thirdParty.update({ where: { id: d.thirdPartyId }, data: { status: to } });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "STATUS_CHANGE",
      entityType: "ThirdParty",
      entityId: d.thirdPartyId,
      field: "status",
      oldValue: from,
      newValue: to,
      comment: d.comment,
    });
    revalidatePath(`/third-parties/${d.thirdPartyId}`);
    revalidatePath("/third-parties");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Assessment (Kritikalität, Scores, Due Diligence)
// ---------------------------------------------------------------

const assessmentSchema = z.object({
  thirdPartyId: z.string().min(1),
  criticality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  inherentRiskScore: z.coerce.number().int().min(1).max(25),
  residualRiskScore: z.coerce.number().int().min(1).max(25),
  dueDiligenceStatus: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "OVERDUE"]),
  substitutability: z.enum(["NOT_ASSESSED", "EASY", "DIFFICULT", "HARDLY_SUBSTITUTABLE"]),
  nextReviewDate: z.string().min(1),
});

export async function updateTpAssessment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("thirdparty:write");
    const parsed = assessmentSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success)
      return { error: "Assessment unvollständig oder ungültig (Scores 1–25, Datum erforderlich)." };
    const d = parsed.data;

    const tp = await db.thirdParty.findUnique({ where: { id: d.thirdPartyId } });
    if (!tp) return { error: "Drittpartei nicht gefunden." };

    const nextReviewDate = new Date(d.nextReviewDate);
    if (Number.isNaN(nextReviewDate.getTime()))
      return { error: "Ungültiges Datum für das nächste Review." };

    const concentrationRisk = formData.get("concentrationRisk") === "on";
    // Hinweis (Review v3, B-2): Die CIF-Einstufung ist KEIN Assessment-Feld
    // mehr — sie wird ausschließlich über die Relation criticalFunctions
    // gepflegt (setTpCriticalFunctions) und daraus abgeleitet.

    await db.thirdParty.update({
      where: { id: d.thirdPartyId },
      data: {
        criticality: d.criticality,
        inherentRiskScore: d.inherentRiskScore,
        residualRiskScore: d.residualRiskScore,
        dueDiligenceStatus: d.dueDiligenceStatus,
        substitutability: d.substitutability,
        concentrationRisk,
        assessmentDate: new Date(),
        nextReviewDate,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "ASSESS",
      entityType: "ThirdParty",
      entityId: d.thirdPartyId,
      field: "assessment",
      oldValue: `criticality=${tp.criticality}, inherent=${tp.inherentRiskScore ?? "–"}, residual=${tp.residualRiskScore ?? "–"}`,
      newValue:
        `criticality=${d.criticality}, inherent=${d.inherentRiskScore}, residual=${d.residualRiskScore}, ` +
        `dd=${d.dueDiligenceStatus}, subst=${d.substitutability}, konzentration=${concentrationRisk ? "ja" : "nein"}`,
    });
    revalidatePath(`/third-parties/${d.thirdPartyId}`);
    revalidatePath("/third-parties");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// CIF-Verknüpfung (Review v3, P1-02): Pflege der Relation
// ThirdParty <-> CriticalFunction — die einzige Quelle der
// CIF-Einstufung einer Drittpartei. Auditiert mit alt -> neu.
// ---------------------------------------------------------------

const cifLinkSchema = z.object({ thirdPartyId: z.string().min(1) });

export async function setTpCriticalFunctions(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("thirdparty:write");
    const parsed = cifLinkSchema.safeParse({ thirdPartyId: formData.get("thirdPartyId") });
    if (!parsed.success) return { error: "Ungültige Eingaben." };
    const cfIds = formData.getAll("cfIds").map(String).filter(Boolean);

    const tp = await db.thirdParty.findUnique({
      where: { id: parsed.data.thirdPartyId },
      include: { criticalFunctions: { select: { id: true, cfId: true } } },
    });
    if (!tp) return { error: "Drittpartei nicht gefunden." };

    const cfs = await db.criticalFunction.findMany({
      where: { id: { in: cfIds } },
      select: { id: true, cfId: true },
    });
    if (cfs.length !== cfIds.length) return { error: "Unbekannte kritische Funktion." };

    await db.thirdParty.update({
      where: { id: tp.id },
      data: { criticalFunctions: { set: cfs.map((c) => ({ id: c.id })) } },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "ThirdParty",
      entityId: tp.id,
      field: "criticalFunctions",
      oldValue: tp.criticalFunctions.map((c) => c.cfId).join(", ") || "–",
      newValue: cfs.map((c) => c.cfId).join(", ") || "–",
      comment: "CIF-Verknüpfung aktualisiert (abgeleitete Einstufung)",
    });
    revalidatePath(`/third-parties/${tp.id}`);
    revalidatePath("/third-parties");
    revalidatePath("/dora");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Klauselmatrix Art. 30 (Review v3, P1-03): einzeln quittierbare
// Pflichtklauseln je Vertrag; automatisches Finding, wenn ein
// CIF-Vertrag eine Pflichtklausel nicht erfüllt. Auditiert.
// ---------------------------------------------------------------

const clauseMatrixSchema = z.object({ contractId: z.string().min(1) });

export async function saveContractClauses(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("thirdparty:write");
    const parsed = clauseMatrixSchema.safeParse({ contractId: formData.get("contractId") });
    if (!parsed.success) return { error: "Ungültige Eingaben." };

    const contract = await db.contract.findUnique({
      where: { id: parsed.data.contractId },
      include: {
        thirdParty: { include: { _count: { select: { criticalFunctions: true } } } },
        clauses: true,
      },
    });
    if (!contract) return { error: "Vertrag nicht gefunden." };
    const isCif = contract.thirdParty._count.criticalFunctions > 0;

    const changes: string[] = [];
    let missingMandatory = false;
    for (const clause of requiredClausesFor(isCif)) {
      const status = String(formData.get(`clause_${clause.key}_status`) ?? "MISSING");
      if (!CLAUSE_STATUS.includes(status as (typeof CLAUSE_STATUS)[number]))
        return { error: `Unzulässiger Status für ${clause.ref}.` };
      const section = String(formData.get(`clause_${clause.key}_section`) ?? "").trim() || null;
      const comment = String(formData.get(`clause_${clause.key}_comment`) ?? "").trim() || null;
      const existing = contract.clauses.find((c) => c.clauseKey === clause.key);
      if (status === "MISSING") missingMandatory = true;
      if (
        !existing ||
        existing.status !== status ||
        existing.contractSection !== section ||
        existing.comment !== comment
      ) {
        await db.contractClause.upsert({
          where: { contractId_clauseKey: { contractId: contract.id, clauseKey: clause.key } },
          create: {
            contractId: contract.id,
            clauseKey: clause.key,
            status,
            contractSection: section,
            comment,
          },
          update: { status, contractSection: section, comment },
        });
        changes.push(`${clause.key}: ${existing?.status ?? "–"} -> ${status}`);
      }
    }

    if (changes.length > 0) {
      await audit({
        userId: user.id,
        userEmail: user.email,
        action: "UPDATE",
        entityType: "Contract",
        entityId: contract.id,
        field: "art30Clauses",
        oldValue: null,
        newValue: changes.join("; "),
        comment: `Art.-30-Klauselmatrix aktualisiert (${contract.contractRef ?? contract.title})`,
      });
    }

    // Automatisches Finding bei Pflichtklausel-Lücke in CIF-Verträgen.
    if (isCif && missingMandatory) {
      const title = `Art.-30-Pflichtklausel fehlt: ${contract.contractRef ?? contract.title}`;
      const open = await db.doraFinding.findFirst({
        where: { title, status: { not: "CLOSED" } },
      });
      if (!open) {
        const count = await db.doraFinding.count();
        await db.doraFinding.create({
          data: {
            findingId: `FND-2026-${String(count + 1).padStart(4, "0")}`,
            source: "SELF_ASSESSMENT",
            severity: "HIGH",
            title,
            description:
              "Automatisch erzeugt (P1-03): Mindestens eine Pflichtklausel nach Art. 30 ist in einem Vertrag über CIF-stützende IKT-Dienstleistungen als fehlend markiert. Vertrag nachverhandeln oder Klausel nachweisen.",
            createdById: user.id,
          },
        });
      }
    }

    revalidatePath(`/third-parties/${contract.thirdPartyId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Exit-Strategie (Upsert, unique thirdPartyId)
// ---------------------------------------------------------------

const exitSchema = z.object({
  thirdPartyId: z.string().min(1),
  strategySummary: z.string().min(5).max(4000),
  lastTestDate: z.string().optional(),
  testResult: z
    .union([z.enum(["PASSED", "PASSED_WITH_FINDINGS", "FAILED"]), z.literal("")])
    .optional(),
  substituteOptions: z.string().max(4000).optional(),
  status: z.enum(["MISSING", "DRAFT", "APPROVED", "TESTED", "OUTDATED"]),
});

export async function upsertExitStrategy(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("thirdparty:write");
    const parsed = exitSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success)
      return { error: "Exit-Strategie unvollständig (Zusammenfassung mind. 5 Zeichen)." };
    const d = parsed.data;

    const tp = await db.thirdParty.findUnique({ where: { id: d.thirdPartyId } });
    if (!tp) return { error: "Drittpartei nicht gefunden." };

    const exitPlanExists = formData.get("exitPlanExists") === "on";
    let lastTestDate: Date | null = null;
    if (d.lastTestDate) {
      lastTestDate = new Date(d.lastTestDate);
      if (Number.isNaN(lastTestDate.getTime())) return { error: "Ungültiges Testdatum." };
    }
    const testResult = d.testResult ? d.testResult : null;

    const data = {
      strategySummary: d.strategySummary,
      exitPlanExists,
      lastTestDate,
      testResult,
      substituteOptions: d.substituteOptions || null,
      status: d.status,
    };
    await db.exitStrategy.upsert({
      where: { thirdPartyId: d.thirdPartyId },
      create: { thirdPartyId: d.thirdPartyId, ...data },
      update: data,
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "ExitStrategy",
      entityId: d.thirdPartyId,
      field: "exitStrategy",
      newValue: `status=${d.status}, plan=${exitPlanExists ? "ja" : "nein"}, letzterTest=${d.lastTestDate || "–"}`,
      comment: d.strategySummary.slice(0, 200),
    });
    revalidatePath(`/third-parties/${d.thirdPartyId}`);
    revalidatePath("/third-parties");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
