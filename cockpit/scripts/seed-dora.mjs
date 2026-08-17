#!/usr/bin/env node
/**
 * Runtime-Updater: spielt den DORA-Katalog samt Demo-Daten in eine
 * BESTEHENDE Datenbank ein (idempotent). Wird vom Container-Entrypoint
 * nach `prisma db push` aufgerufen, damit Updates auf dem NAS ohne
 * Datenverlust funktionieren. Lokal: `node scripts/seed-dora.mjs`.
 */
import { PrismaClient } from "@prisma/client";
import { seedDora } from "../prisma/dora-seed-core.mjs";

const db = new PrismaClient();
try {
  const result = await seedDora(db, { log: (m) => console.log(`[seed-dora] ${m}`) });
  console.log(result.seeded ? "[seed-dora] DORA-Daten eingespielt." : "[seed-dora] Nichts zu tun.");
} catch (e) {
  console.error("[seed-dora] Fehler:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
