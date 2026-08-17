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

    const current = await getRiskThresholds();
    const currentCap = await getMitigationCap();
    const changes: Array<{ key: string; oldValue: string; newValue: string }> = [
      { key: SETTING_KEYS.lowMax, oldValue: String(current.lowMax), newValue: String(d.lowMax) },
      {
        key: SETTING_KEYS.mediumMax,
        oldValue: String(current.mediumMax),
        newValue: String(d.mediumMax),
      },
      { key: SETTING_KEYS.highMax, oldValue: String(current.highMax), newValue: String(d.highMax) },
      {
        key: SETTING_KEYS.mitigationCap,
        oldValue: String(currentCap),
        newValue: String(d.mitigationCap),
      },
    ];

    for (const c of changes) {
      await db.appSetting.upsert({
        where: { key: c.key },
        update: { value: c.newValue },
        create: {
          key: c.key,
          value: c.newValue,
          description: SETTING_DESCRIPTIONS[c.key] ?? c.key,
        },
      });
      if (c.oldValue !== c.newValue) {
        await audit({
          userId: user.id,
          userEmail: user.email,
          action: "SETTING_CHANGE",
          entityType: "AppSetting",
          entityId: c.key,
          field: c.key,
          oldValue: c.oldValue,
          newValue: c.newValue,
        });
      }
    }
    revalidatePath("/admin");
    revalidatePath("/risks");
    revalidatePath("/overview");
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
