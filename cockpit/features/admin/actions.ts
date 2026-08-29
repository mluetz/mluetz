"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { assertPermission } from "@/lib/authz";
import { SETTING_KEYS, getMitigationCap, getRiskThresholds } from "@/lib/settings";

export interface ActionResult {
  error?: string;
  ok?: boolean;
}

// ---------------------------------------------------------------
// Risikomethodik: Schwellwerte & Mitigation Cap
// ---------------------------------------------------------------

const thresholdsSchema = z.object({
  lowMax: z.coerce.number().int().min(1).max(25),
  mediumMax: z.coerce.number().int().min(1).max(25),
  highMax: z.coerce.number().int().min(1).max(25),
  mitigationCap: z.coerce.number().min(0).max(1),
});

const SETTING_DESCRIPTIONS: Record<string, string> = {
  [SETTING_KEYS.lowMax]: "Obergrenze Risikoklasse LOW (Score 1–25)",
  [SETTING_KEYS.mediumMax]: "Obergrenze Risikoklasse MEDIUM (Score 1–25)",
  [SETTING_KEYS.highMax]: "Obergrenze Risikoklasse HIGH (Score 1–25; darüber CRITICAL)",
  [SETTING_KEYS.mitigationCap]: "Maximal anrechenbare Risikominderung (0–1, Restrisiko-Prinzip)",
};

/**
 * Methodikänderung (Review v3, P1-06): Vier-Augen-Prinzip.
 * updateThresholds legt nur noch einen ANTRAG (MethodologyVersion,
 * PENDING_APPROVAL) an; wirksam werden die Werte erst mit der Freigabe
 * durch eine ANDERE Person mit "risk:review" (approveMethodology).
 */
export async function updateThresholds(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("admin");
    const parsed = thresholdsSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Ungültige Eingaben (Schwellwerte 1–25, Cap 0–1)." };
    const d = parsed.data;
    if (!(d.lowMax < d.mediumMax && d.mediumMax < d.highMax)) {
      return { error: "Reihenfolge verletzt: Low-Max < Medium-Max < High-Max erforderlich." };
    }
    const rationale = String(formData.get("rationale") ?? "").trim();
    if (rationale.length < 10) {
      return { error: "Begründung der Methodikänderung erforderlich (mind. 10 Zeichen)." };
    }

    const pending = await db.methodologyVersion.findFirst({
      where: { status: "PENDING_APPROVAL" },
    });
    if (pending) return { error: "Es liegt bereits ein offener Methodikantrag vor." };

    const last = await db.methodologyVersion.findFirst({ orderBy: { version: "desc" } });
    const mv = await db.methodologyVersion.create({
      data: {
        version: (last?.version ?? 0) + 1,
        lowMax: d.lowMax,
        mediumMax: d.mediumMax,
        highMax: d.highMax,
        mitigationCap: d.mitigationCap,
        rationale,
        requestedById: user.id,
      },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "SETTING_CHANGE",
      entityType: "MethodologyVersion",
      entityId: mv.id,
      field: "status",
      newValue: "PENDING_APPROVAL",
      comment: `Methodikantrag v${mv.version}: low<=${d.lowMax}, medium<=${d.mediumMax}, high<=${d.highMax}, cap=${d.mitigationCap} — ${rationale}`,
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

const mvDecisionSchema = z.object({ versionId: z.string().min(1) });

export async function approveMethodology(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("risk:review");
    const parsed = mvDecisionSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Ungültige Eingaben." };
    const mv = await db.methodologyVersion.findUnique({ where: { id: parsed.data.versionId } });
    if (!mv || mv.status !== "PENDING_APPROVAL") return { error: "Kein offener Antrag." };
    if (mv.requestedById === user.id) {
      return { error: "Vier-Augen-Prinzip: Antragsteller darf nicht selbst freigeben." };
    }

    const now = new Date();
    await db.methodologyVersion.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "SUPERSEDED", validTo: now },
    });
    await db.methodologyVersion.update({
      where: { id: mv.id },
      data: { status: "ACTIVE", approvedById: user.id, approvedAt: now, validFrom: now },
    });
    // Live-Werte ausschließlich bei Freigabe schreiben.
    const values: Array<[string, string]> = [
      [SETTING_KEYS.lowMax, String(mv.lowMax)],
      [SETTING_KEYS.mediumMax, String(mv.mediumMax)],
      [SETTING_KEYS.highMax, String(mv.highMax)],
      [SETTING_KEYS.mitigationCap, String(mv.mitigationCap)],
    ];
    for (const [key, value] of values) {
      await db.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value, description: SETTING_DESCRIPTIONS[key] ?? key },
      });
    }
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "APPROVE",
      entityType: "MethodologyVersion",
      entityId: mv.id,
      field: "status",
      oldValue: "PENDING_APPROVAL",
      newValue: "ACTIVE",
      comment: `Methodikversion v${mv.version} freigegeben (Vier-Augen; Antrag: ${mv.requestedById})`,
    });
    revalidatePath("/admin");
    revalidatePath("/risks");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

export async function rejectMethodology(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("risk:review");
    const parsed = mvDecisionSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Ungültige Eingaben." };
    const mv = await db.methodologyVersion.findUnique({ where: { id: parsed.data.versionId } });
    if (!mv || mv.status !== "PENDING_APPROVAL") return { error: "Kein offener Antrag." };
    if (mv.requestedById === user.id) {
      return { error: "Vier-Augen-Prinzip: Antragsteller darf nicht selbst entscheiden." };
    }
    await db.methodologyVersion.update({
      where: { id: mv.id },
      data: { status: "REJECTED", approvedById: user.id, approvedAt: new Date() },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "REJECT",
      entityType: "MethodologyVersion",
      entityId: mv.id,
      field: "status",
      oldValue: "PENDING_APPROVAL",
      newValue: "REJECTED",
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Benutzer aktiv / inaktiv
// ---------------------------------------------------------------

const activeSchema = z.object({
  userId: z.string().min(1),
  active: z.enum(["true", "false"]),
});

export async function setUserActive(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("admin");
    const parsed = activeSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Ungültige Eingaben." };
    const d = parsed.data;
    const active = d.active === "true";

    if (d.userId === user.id && !active) {
      return { error: "Der eigene Account kann nicht selbst deaktiviert werden." };
    }
    const target = await db.user.findUnique({ where: { id: d.userId } });
    if (!target) return { error: "Benutzer nicht gefunden." };

    await db.user.update({ where: { id: d.userId }, data: { active } });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "ROLE_CHANGE",
      entityType: "User",
      entityId: d.userId,
      field: "active",
      oldValue: String(target.active),
      newValue: String(active),
      comment: `Benutzer ${target.email} ${active ? "aktiviert" : "deaktiviert"}`,
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// MFA zurücksetzen (nur Admin; Neueinrichtung wird beim nächsten
// Login erzwungen; Vorgang wird auditiert — Review v3, S-02)
// ---------------------------------------------------------------

const mfaResetSchema = z.object({ userId: z.string().min(1) });

export async function resetUserMfa(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("admin");
    const parsed = mfaResetSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Ungültige Eingaben." };
    const target = await db.user.findUnique({ where: { id: parsed.data.userId } });
    if (!target) return { error: "Benutzer nicht gefunden." };

    await db.mfaRecoveryCode.deleteMany({ where: { userId: target.id } });
    await db.user.update({
      where: { id: target.id },
      data: { mfaSecret: null, mfaEnabledAt: null },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "MFA_RESET",
      entityType: "User",
      entityId: target.id,
      comment: `MFA für ${target.email} zurückgesetzt; Neueinrichtung beim nächsten Login`,
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Rollen zuweisen
// ---------------------------------------------------------------

export async function setUserRoles(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertPermission("admin");
    const userId = String(formData.get("userId") ?? "");
    if (!userId) return { error: "Benutzer fehlt." };
    const target = await db.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!target) return { error: "Benutzer nicht gefunden." };

    const allRoles = await db.role.findMany();
    const validKeys = new Set(allRoles.map((r) => r.key));
    const requested = formData
      .getAll("roles")
      .map(String)
      .filter((k) => validKeys.has(k));

    const oldKeys = target.roles.map((r) => r.role.key).sort();
    const newKeys = [...new Set(requested)].sort();

    if (userId === user.id && oldKeys.includes("ADMIN") && !newKeys.includes("ADMIN")) {
      return { error: "Die eigene ADMIN-Rolle kann nicht entfernt werden." };
    }

    const roleIds = allRoles.filter((r) => newKeys.includes(r.key)).map((r) => r.id);
    await db.$transaction([
      db.userRole.deleteMany({ where: { userId } }),
      db.userRole.createMany({ data: roleIds.map((roleId) => ({ userId, roleId })) }),
    ]);
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "ROLE_CHANGE",
      entityType: "User",
      entityId: userId,
      field: "roles",
      oldValue: oldKeys.join(", ") || "–",
      newValue: newKeys.join(", ") || "–",
      comment: `Rollen von ${target.email} geändert`,
    });
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}

// ---------------------------------------------------------------
// Risikoappetit je Kategorie
// ---------------------------------------------------------------

const appetiteSchema = z.object({
  categoryId: z.string().min(1),
  appetiteThreshold: z.coerce.number().int().min(1).max(25),
});

export async function updateCategoryAppetite(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await assertPermission("admin");
    const parsed = appetiteSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Risikoappetit muss zwischen 1 und 25 liegen." };
    const d = parsed.data;
    const category = await db.riskCategory.findUnique({ where: { id: d.categoryId } });
    if (!category) return { error: "Risikokategorie nicht gefunden." };

    await db.riskCategory.update({
      where: { id: d.categoryId },
      data: { appetiteThreshold: d.appetiteThreshold },
    });
    await audit({
      userId: user.id,
      userEmail: user.email,
      action: "SETTING_CHANGE",
      entityType: "RiskCategory",
      entityId: d.categoryId,
      field: "appetiteThreshold",
      oldValue: String(category.appetiteThreshold),
      newValue: String(d.appetiteThreshold),
      comment: `Risikoappetit der Kategorie ${category.name} geändert`,
    });
    revalidatePath("/admin");
    revalidatePath("/risks");
    revalidatePath("/overview");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unbekannter Fehler." };
  }
}
