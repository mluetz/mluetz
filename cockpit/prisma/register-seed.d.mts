import type { PrismaClient } from "@prisma/client";

export function seedRegisterMapping(
  db: PrismaClient,
  options?: { log?: (message: string) => void },
): Promise<void>;
