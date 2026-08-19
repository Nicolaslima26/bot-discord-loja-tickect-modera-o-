import type { FastifyInstance } from "fastify";
import { prisma } from "@discord-saas/database";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", service: "api" };
  });
}
