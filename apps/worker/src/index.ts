import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { z } from "zod";
import { APP_QUEUE, type AppJobName } from "@discord-saas/shared";

const env = z.object({ REDIS_URL: z.string().url() }).parse(process.env);
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const queue = new Queue<Record<string, never>, unknown, AppJobName>(APP_QUEUE, { connection });

/** Queue infrastructure is created now so later deliveries/webhooks run out-of-band. */
const worker = new Worker<Record<string, never>, unknown, AppJobName>(APP_QUEUE, async (job) => {
  if (job.name === "health-check") return { processedAt: new Date().toISOString() };
  throw new Error(`Unsupported job: ${job.name}`);
}, { connection });

worker.on("completed", (job) => console.log(`Completed ${job.name}:${job.id}`));
worker.on("failed", (job, error) => console.error(`Failed ${job?.name}:${job?.id}`, error));
await queue.add("health-check", {}, { repeat: { every: 60_000 }, jobId: "health-check" });

const shutdown = async () => {
  await worker.close();
  await queue.close();
  await connection.quit();
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
