import type { PrismaClient } from "@prisma/client";

export function seedDora(
  db: PrismaClient,
  opts?: { assessorEmail?: string; creatorEmail?: string; log?: (msg: string) => void },
): Promise<{ seeded: boolean }>;
