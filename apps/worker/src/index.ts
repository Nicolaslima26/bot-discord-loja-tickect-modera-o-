import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { z } from "zod";
import { APP_QUEUE, type AppJobName } from "@discord-saas/shared";
import { Client, GatewayIntentBits } from "discord.js";
import { prisma } from "@discord-saas/database";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const env = z.object({ REDIS_URL: z.string().url() }).parse(process.env);
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const queue = new Queue<Record<string, never>, unknown, AppJobName>(APP_QUEUE, { connection });
const discord = new Client({ intents: [GatewayIntentBits.Guilds] });
const storageRoot = resolve(process.cwd(), "../..", process.env.STORAGE_ROOT ?? "storage");

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

async function createTranscript(guildId: string, ticketId: string, channelId: string): Promise<string | null> {
  const prior = await prisma.ticketTranscript.findUnique({ where: { ticketId }, select: { storageKey: true } });
  if (prior) return prior.storageKey;
  const channel = await discord.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased() || !("messages" in channel)) return null;
  const messages = [] as { author: string; createdAt: Date; content: string }[];
  let before: string | undefined;
  do {
    const page = await channel.messages.fetch({ limit: 100, before });
    messages.push(...page.map((message) => ({ author: message.author.tag, createdAt: message.createdAt, content: message.content })));
    before = page.last()?.id;
    if (page.size < 100) break;
  } while (before);
  messages.reverse();
  const storageKey = `transcripts/${guildId}/ticket-${ticketId}.html`;
  const absolutePath = resolve(storageRoot, storageKey);
  await mkdir(resolve(absolutePath, ".."), { recursive: true });
  const rows = messages.map((message) => `<article><strong>${escapeHtml(message.author)}</strong><time>${message.createdAt.toISOString()}</time><p>${escapeHtml(message.content || "(sem conteúdo)")}</p></article>`).join("\n");
  await writeFile(absolutePath, `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Transcript ${ticketId}</title><style>body{font:14px system-ui;background:#313338;color:#dbdee1;margin:2rem}article{border-bottom:1px solid #4e5058;padding:10px 0}time{color:#949ba4;font-size:12px;margin-left:8px}p{white-space:pre-wrap}</style><body><h1>Transcript do ticket</h1>${rows}</body></html>`, "utf8");
  await prisma.ticketTranscript.create({ data: { guildId, ticketId, storageKey } });
  return storageKey;
}

async function finalizeClosedTicket(ticket: { id: string; guildId: string; channelId: string; sequence: number }): Promise<void> {
  const storageKey = await createTranscript(ticket.guildId, ticket.id, ticket.channelId);
  const config = await prisma.ticketConfig.findUnique({ where: { guildId: ticket.guildId }, select: { logChannelId: true } });
  if (storageKey && config?.logChannelId) {
    const logChannel = await discord.channels.fetch(config.logChannelId).catch(() => null);
    if (logChannel?.isTextBased() && "send" in logChannel) {
      const transcript = await readFile(resolve(storageRoot, storageKey));
      await logChannel.send({ content: `Transcript do ticket #${ticket.sequence}`, files: [{ attachment: transcript, name: `ticket-${ticket.sequence}.html` }] });
    }
  }
  const channel = await discord.channels.fetch(ticket.channelId).catch(() => null);
  if (channel?.isTextBased() && "delete" in channel) await channel.delete("Ticket fechado");
  await prisma.$transaction([
    prisma.ticket.update({ where: { id: ticket.id }, data: { channelDeletedAt: new Date() } }),
    prisma.auditLog.create({ data: { guildId: ticket.guildId, action: "TICKET_CHANNEL_DELETED", metadata: { ticketId: ticket.id } } }),
  ]);
}

/** Queue infrastructure is created now so later deliveries/webhooks run out-of-band. */
const worker = new Worker<Record<string, never>, unknown, AppJobName>(APP_QUEUE, async (job) => {
  if (job.name === "health-check") return { processedAt: new Date().toISOString() };
  if (job.name === "delete-ticket-channel") {
    const data = job.data as unknown as { guildId: string; channelId: string; ticketId: string };
    const ticket = await prisma.ticket.findFirst({ where: { id: data.ticketId, guildId: data.guildId, channelId: data.channelId, status: "CLOSED" } });
    if (!ticket) return { skipped: true };
    await finalizeClosedTicket(ticket);
    return { deleted: true };
  }
  if (job.name === "ticket-cleanup") {
    const cutoff = new Date(Date.now() - 30_000);
    const tickets = await prisma.ticket.findMany({ where: { status: "CLOSED", closedAt: { lte: cutoff }, channelDeletedAt: null }, select: { id: true, guildId: true, channelId: true, sequence: true } });
    for (const ticket of tickets) await finalizeClosedTicket(ticket);
    return { processed: tickets.length };
  }
  throw new Error(`Unsupported job: ${job.name}`);
}, { connection });

worker.on("active", (job) => console.log(`Processing ${job.name}:${job.id}`));
worker.on("completed", (job) => console.log(`Completed ${job.name}:${job.id}`));
worker.on("failed", (job, error) => console.error(`Failed ${job?.name}:${job?.id}`, error));
worker.on("error", (error) => console.error("Worker queue error", error));
console.log(`Worker listening on queue "${APP_QUEUE}".`);
const discordReady = new Promise<void>((resolve) => discord.once("clientReady", (client) => {
  console.log(`Worker Discord client connected as ${client.user.tag}`);
  resolve();
}));
await discord.login(process.env.DISCORD_TOKEN);
await discordReady;
await queue.add("health-check", {}, { repeat: { every: 60_000 }, jobId: "health-check" });
await queue.add("ticket-cleanup", {}, { repeat: { every: 10_000 }, jobId: "ticket-cleanup" });

const shutdown = async () => {
  await worker.close();
  await queue.close();
  await connection.quit();
  await discord.destroy();
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
