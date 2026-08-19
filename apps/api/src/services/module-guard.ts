import { prisma } from "@discord-saas/database";
import { Module, moduleUnavailableMessage } from "@discord-saas/shared";

export class ModuleUnavailableError extends Error {
  constructor() {
    super(moduleUnavailableMessage);
  }
}

/**
 * The only module authorization entry point. Every lookup includes guildId,
 * preventing tenant data or entitlement decisions from crossing guild boundaries.
 */
export class ModuleGuard {
  async require(guildId: string, module: Module): Promise<void> {
    const record = await prisma.guildModule.findUnique({
      where: { guildId_module: { guildId, module } },
      select: { enabled: true },
    });

    if (!record?.enabled) throw new ModuleUnavailableError();
  }
}

export const moduleGuard = new ModuleGuard();
