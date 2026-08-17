"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";
import { INCIDENT_STATUS } from "@/lib/domain/enums";
import { computeDeadlines, type ReportType } from "@/lib/domain/incident-deadlines";
import { INCIDENT_TRANSITIONS, type IncidentStatus } from "./deadline-monitor";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

/** datetime-local ("YYYY-MM-DDTHH:mm") in ein Date parsen; null bei ungültiger Eingabe. */
function parseLocalDateTime(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Ist-Abgaben eines Vorfalls als Map für computeDeadlines. */
function submittedMap(
  reports: Array<{ reportType: string; submittedAt: Date | null }>,
): Partial<Record<ReportType, Date>> {
  const map: Partial<Record<ReportType, Date>> = {};
  for (const r of reports) {
    if (r.submittedAt) map[r.reportType as ReportType] = r.submittedAt;
  }
  return map;
}

// ---------------------------------------------------------------
// Vorfall erfassen
// ---------------------------------------------------------------

const incidentSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(4000),
  awarenessAt: z.string().min(1),
  classifiedAt: z.string().optional(),
  classificationNote: z.string().max(2000).optional(),
  criticalFunctionId: z.string().optional(),
  thirdPartyId: z.string().optional(),
});

export async function createIncident(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let incidentDbId = "";
  try {
    const user = await assertPermission("incident:write");
    const parsed = incidentSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return {
        error:
          "Eingaben unvollständig: " + parsed.error.issues.map((i) => i.path.join(".")).join(", "),
      };
    }
    const d = parsed.data;
    const isMajor = formData.get("isMajor") === "on";
    const gdprRelevant = formData.get("gdprRelevant") === "on";
    const nis2Relevant = formData.get("nis2Relevant") === "on";

    const now = new Date();
    const awarenessAt = parseLocalDateTime(d.awarenessAt);
    if (!awarenessAt) return { error: "Kenntniszeitpunkt ist ungültig." };
    if (awarenessAt.getTime() > now.getTime()) {
      return { error: "Der Kenntniszeitpunkt darf nicht in der Zukunft liegen." };
    }

    let classifiedAt: Date | null = null;
    if (isMajor && !d.classifiedAt) {
      return { error: "Bei schwerwiegenden Vorfällen ist der Klassifizierungszeitpunkt Pflicht." };
    }
    if (d.classifiedAt) {
      classifiedAt = parseLocalDateTime(d.classifiedAt);
      if (!classifiedAt) return { error: "Klassifizierungszeitpunkt ist ungültig." };
      if (classifiedAt.getTime() < awarenessAt.getTime()) {
        return { error: "Die Klassifizierung darf nicht vor der Kenntniserlangung liegen." };
      }
    }

    const count = await db.incident.count();
    const incidentId = `INC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const incident = await db.incident.create({
      data: {
        incidentId,
        title: d.title,
        description: d.description,
        awarenessAt,
        classifiedAt,
        isMajor,
        classificationNote: d.classificationNote?.trim() || null,
        gdprRelevant,
        nis2Relevant,
        criticalFunctionId: d.criticalFunctionId || null,
        thirdPartyId: d.thirdPartyId || null,
        createdById: user.id,
        status: "OPEN",
      },
    });

    // Meldefristen deterministisch berechnen und als Reports anlegen (submittedAt = null)
    const deadlines = computeDeadlines(
      { awarenessAt, classifiedAt, isMajor, gdprRelevant, nis2Relevant },
      now,
    );
    if (deadlines.length > 0) {
      await db.incidentReport.createMany({
        data: deadlines.map((dl) => ({
          incidentId: incident.id,
          reportType: dl.reportType,
          dueAt: dl.dueAt,
        })),
      });
    }

    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "Incident",
      entityId: incident.id,
      comment: `Vorfall ${incidentId} angelegt (${deadlines.length} Meldefristen berechnet)`,
    });
    incidentDbId = incident.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
  revalidatePath("/dora/incidents");
  redirect(`/dora/incidents/${incidentDbId}`);
}

// ---------------------------------------------------------------
// Meldung als abgegeben dokumentieren + Folgefristen neu berechnen
// ---------------------------------------------------------------

const submitSchema = z.object({
  reportId: z.string().min(1),
  submittedAt: z.string().optional(),
  reference: z.string().max(500).optional(),
});

/** Folgefristen, deren Anker die tatsächliche Abgabe der Vorgängermeldung ist. */
const FOLLOW_UP_TYPES: readonly ReportType[] = ["DORA_INTERMEDIATE", "DORA_FINAL", "NIS2_FINAL"];

export async function markReportSubmitted(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("incident:write");
    const parsed = submitSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Eingaben ungültig." };
    const d = parsed.data;

    const report = await db.incidentReport.findUnique({
      where: { id: d.reportId },
      include: { incident: true },
    });
    if (!report) return { error: "Meldung nicht gefunden." };
    if (report.submittedAt) return { error: "Diese Meldung ist bereits dokumentiert." };

    let submittedAt = new Date();
    if (d.submittedAt) {
      const p = parseLocalDateTime(d.submittedAt);
      if (!p) return { error: "Abgabezeitpunkt ist ungültig." };
      submittedAt = p;
    }
    if (submittedAt.getTime() < report.incident.awarenessAt.getTime()) {
      return { error: "Die Abgabe darf nicht vor der Kenntniserlangung liegen." };
    }

    await db.incidentReport.update({
      where: { id: report.id },
      data: { submittedAt, reference: d.reference?.trim() || null },
    });

    // Folgefristen NEU berechnen: computeDeadlines mit den Ist-Abgaben,
    // dueAt der noch offenen Folge-Reports aktualisieren.
    const incident = report.incident;
    const reports = await db.incidentReport.findMany({ where: { incidentId: incident.id } });
    const deadlines = computeDeadlines(
      {
        awarenessAt: incident.awarenessAt,
        classifiedAt: incident.classifiedAt,
        isMajor: incident.isMajor,
        gdprRelevant: incident.gdprRelevant,
        nis2Relevant: incident.nis2Relevant,
        submitted: submittedMap(reports),
      },
      new Date(),
    );
    for (const dl of deadlines) {
      if (!FOLLOW_UP_TYPES.includes(dl.reportType)) continue;
      const row = reports.find((r) => r.reportType === dl.reportType);
      if (!row || row.submittedAt) continue;
      if (row.dueAt.getTime() !== dl.dueAt.getTime()) {
        await db.incidentReport.update({ where: { id: row.id }, data: { dueAt: dl.dueAt } });
      }
    }

    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "Incident",
      entityId: incident.id,
      field: report.reportType,
      newValue: submittedAt.toISOString(),
      comment: d.reference?.trim()
        ? `Meldung dokumentiert, Referenz: ${d.reference.trim()}`
        : "Meldung dokumentiert",
    });
    revalidatePath(`/dora/incidents/${incident.id}`);
    revalidatePath("/dora/incidents");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Statuswechsel (Workflow)
// ---------------------------------------------------------------

const statusSchema = z.object({
  incidentId: z.string().min(1),
  newStatus: z.string().min(1),
  comment: z.string().min(3).max(1000),
});

export async function changeIncidentStatus(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("incident:write");
    const parsed = statusSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success)
      return { error: "Statuswechsel benötigt einen Kommentar (mind. 3 Zeichen)." };
    const d = parsed.data;

    const incident = await db.incident.findUnique({
      where: { id: d.incidentId },
      include: { reports: true },
    });
    if (!incident) return { error: "Vorfall nicht gefunden." };
    const from = incident.status as IncidentStatus;
    const to = d.newStatus as IncidentStatus;
    if (!(to in INCIDENT_STATUS)) return { error: "Ungültiger Zielstatus." };
    if (!INCIDENT_TRANSITIONS[from]?.includes(to)) {
      return {
        error: `Übergang ${INCIDENT_STATUS[from]} → ${INCIDENT_STATUS[to]} ist nicht zulässig.`,
      };
    }
    if (to === "CLOSED") {
      const now = Date.now();
      const openOverdue = incident.reports.some((r) => !r.submittedAt && r.dueAt.getTime() < now);
      if (openOverdue) {
        return { error: "Offene überfällige Meldungen müssen zuerst dokumentiert werden." };
      }
    }

    await db.incident.update({ where: { id: incident.id }, data: { status: to } });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "STATUS_CHANGE",
      entityType: "Incident",
      entityId: incident.id,
      field: "status",
      oldValue: from,
      newValue: to,
      comment: d.comment,
    });
    revalidatePath(`/dora/incidents/${incident.id}`);
    revalidatePath("/dora/incidents");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Nachträgliche Klassifizierung
// ---------------------------------------------------------------

const classifySchema = z.object({
  incidentId: z.string().min(1),
  classifiedAt: z.string().min(1),
  classificationNote: z.string().max(2000).optional(),
});

export async function classifyIncident(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("incident:write");
    const parsed = classifySchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Klassifizierungszeitpunkt ist Pflicht." };
    const d = parsed.data;
    const isMajor = formData.get("isMajor") === "on";

    const incident = await db.incident.findUnique({
      where: { id: d.incidentId },
      include: { reports: true },
    });
    if (!incident) return { error: "Vorfall nicht gefunden." };

    const classifiedAt = parseLocalDateTime(d.classifiedAt);
    if (!classifiedAt) return { error: "Klassifizierungszeitpunkt ist ungültig." };
    if (classifiedAt.getTime() < incident.awarenessAt.getTime()) {
      return { error: "Die Klassifizierung darf nicht vor der Kenntniserlangung liegen." };
    }

    await db.incident.update({
      where: { id: incident.id },
      data: {
        classifiedAt,
        isMajor,
        classificationNote: d.classificationNote?.trim() || incident.classificationNote,
      },
    });

    // Neu als schwerwiegend klassifiziert: fehlende DORA-Reports anlegen,
    // offene DORA-Fristen an die Klassifizierung anpassen.
    if (isMajor) {
      const deadlines = computeDeadlines(
        {
          awarenessAt: incident.awarenessAt,
          classifiedAt,
          isMajor: true,
          gdprRelevant: incident.gdprRelevant,
          nis2Relevant: incident.nis2Relevant,
          submitted: submittedMap(incident.reports),
        },
        new Date(),
      );
      for (const dl of deadlines) {
        if (!dl.reportType.startsWith("DORA_")) continue;
        const row = incident.reports.find((r) => r.reportType === dl.reportType);
        if (!row) {
          await db.incidentReport.create({
            data: { incidentId: incident.id, reportType: dl.reportType, dueAt: dl.dueAt },
          });
        } else if (!row.submittedAt && row.dueAt.getTime() !== dl.dueAt.getTime()) {
          await db.incidentReport.update({ where: { id: row.id }, data: { dueAt: dl.dueAt } });
        }
      }
    }

    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "Incident",
      entityId: incident.id,
      field: "classification",
      oldValue: incident.classifiedAt
        ? `${incident.isMajor ? "schwerwiegend" : "nicht schwerwiegend"} (${incident.classifiedAt.toISOString()})`
        : "nicht klassifiziert",
      newValue: `${isMajor ? "schwerwiegend" : "nicht schwerwiegend"} (${classifiedAt.toISOString()})`,
      comment: d.classificationNote?.trim().slice(0, 200) || undefined,
    });
    revalidatePath(`/dora/incidents/${incident.id}`);
    revalidatePath("/dora/incidents");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
