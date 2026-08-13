import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Health-Endpunkt ohne Authentifizierung (Monitoring/Load Balancer).
 * Prüft neben der Prozess-Erreichbarkeit auch die DB-Verbindung.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.appSetting.count();
    return NextResponse.json({ status: "ok", time: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { status: "degraded", time: new Date().toISOString() },
      { status: 503 },
    );
  }
}
