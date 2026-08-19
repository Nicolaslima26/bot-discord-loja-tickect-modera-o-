import type { FastifyInstance } from "fastify";
import { prisma } from "@discord-saas/database";
import { Module } from "@discord-saas/shared";
import { z } from "zod";

const paramsSchema = z.object({ guildId: z.string().regex(/^\d{17,20}$/) });

/** Foundation endpoint; OAuth/session authorization is added with the dashboard phase. */
export async function guildRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/guilds/:guildId/modules", async (request, reply) => {
    const parsed = paramsSchema.safeParse(request.params);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid guild ID" });

    const modules = await prisma.guildModule.findMany({
      where: { guildId: parsed.data.guildId },
      select: { module: true, enabled: true },
      orderBy: { module: "asc" },
    });
    return { guildId: parsed.data.guildId, modules };
  });

  app.put("/api/guilds/:guildId/modules/:module", async (request, reply) => {
    const guild = paramsSchema.safeParse(request.params);
    const module = z.nativeEnum(Module).safeParse((request.params as { module?: string }).module);
    const body = z.object({ enabled: z.boolean() }).safeParse(request.body);
    if (!guild.success || !module.success || !body.success) {
      return reply.code(400).send({ error: "Invalid module update" });
    }

    // The composite key makes the mutation tenant-scoped even if a client retries it.
    const result = await prisma.guildModule.upsert({
      where: { guildId_module: { guildId: guild.data.guildId, module: module.data } },
      create: { guildId: guild.data.guildId, module: module.data, enabled: body.data.enabled },
      update: { enabled: body.data.enabled },
    });
    return { module: result.module, enabled: result.enabled };
  });
}
