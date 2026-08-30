import "server-only";
import { db } from "@/lib/db";
import {
  DEFAULT_MITIGATION_CAP,
  DEFAULT_THRESHOLDS,
  type RiskThresholds,
} from "@/lib/domain/risk-calc";

/** Konfigurierbare Parameter der Risikomethodik (Kap. 5.3). */

export const SETTING_KEYS = {
  lowMax: "risk.threshold.low.max",
  mediumMax: "risk.threshold.medium.max",
  highMax: "risk.threshold.high.max",
  mitigationCap: "risk.mitigation.cap",
} as const;

export async function getRiskThresholds(): Promise<RiskThresholds> {
  const rows = await db.appSetting.findMany({
    where: { key: { in: [SETTING_KEYS.lowMax, SETTING_KEYS.mediumMax, SETTING_KEYS.highMax] } },
  });
  const map = new Map(rows.map((r) => [r.key, Number(r.value)]));
  return {
    lowMax: map.get(SETTING_KEYS.lowMax) ?? DEFAULT_THRESHOLDS.lowMax,
    mediumMax: map.get(SETTING_KEYS.mediumMax) ?? DEFAULT_THRESHOLDS.mediumMax,
    highMax: map.get(SETTING_KEYS.highMax) ?? DEFAULT_THRESHOLDS.highMax,
  };
}

export async function getMitigationCap(): Promise<number> {
  const row = await db.appSetting.findUnique({ where: { key: SETTING_KEYS.mitigationCap } });
  const v = row ? Number(row.value) : NaN;
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : DEFAULT_MITIGATION_CAP;
}
