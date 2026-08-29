import { NextRequest, NextResponse } from "next/server";
import { runDeadlineScan } from "@/lib/notifications/deadline-scan";

/**
 * Fristen-Scan-Endpunkt (Review v3, P1-07). Aufruf stündlich, z. B. per
 * Synology-Aufgabenplaner:
 *   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/deadlines
 * CRON_SECRET in der .env setzen; ohne gültiges Secret wird abgelehnt.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  const result = await runDeadlineScan();
  return NextResponse.json({ ok: true, ...result });
}
