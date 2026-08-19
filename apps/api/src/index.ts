import Fastify from "fastify";
import helmet from "@fastify/helmet";
import { env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { guildRoutes } from "./routes/guilds.js";

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" } });
await app.register(helmet);
await app.register(healthRoutes);
await app.register(guildRoutes);

const close = async () => app.close();
process.once("SIGINT", close);
process.once("SIGTERM", close);

await app.listen({ host: env.API_HOST, port: env.API_PORT });
