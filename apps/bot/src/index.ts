import { Client, Events, GatewayIntentBits, MessageFlags, PermissionFlagsBits } from "discord.js";
import { Prisma, prisma } from "@discord-saas/database";
import { Module } from "@discord-saas/shared";
import { env } from "./env.js";
import { handleTicketButton, handleTicketsCommand } from "./tickets.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot connected as ${readyClient.user.tag} (ticket queue enabled)`);
});

client.on(Events.Error, (error) => {
  // Discord REST/gateway failures must be logged instead of terminating the bot process.
  console.error("Discord client error", error);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId.startsWith("tickets:")) await handleTicketButton(interaction);
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "ping") {
    await interaction.reply({ content: `Pong! Gateway: ${client.ws.ping}ms`, flags: MessageFlags.Ephemeral });
    return;
  }
  if (interaction.commandName === "tickets") {
    await handleTicketsCommand(interaction);
    return;
  }
  if (interaction.commandName !== "setup") return;
  if (!interaction.guildId) {
    await interaction.reply({ content: "Este comando só pode ser usado em um servidor.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: "Você precisa da permissão de Administrador.", flags: MessageFlags.Ephemeral });
    return;
  }

  const guildId = interaction.guildId;
  // guildId comes from Discord's signed interaction context. A REST fetch is not
  // required for tenant initialization and can fail when Discord cache/access lags.
  const guildName = interaction.guild?.name ?? guildId;
  // Transaction establishes all tenant-scoped defaults atomically and is safe to retry.
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.guild.upsert({
      where: { id: guildId },
      create: { id: guildId, name: guildName, isConfigured: true },
      update: { name: guildName, isConfigured: true },
    });
    await Promise.all(Object.values(Module).map((module) => tx.guildModule.upsert({
      where: { guildId_module: { guildId, module } },
      create: { guildId, module, enabled: false },
      update: {},
    })));
    await tx.guildMembership.upsert({
      where: { guildId_userId: { guildId, userId: interaction.user.id } },
      create: { guildId, userId: interaction.user.id, role: "OWNER" },
      update: { role: "OWNER" },
    });
    await tx.auditLog.create({ data: { guildId, actorId: interaction.user.id, action: "GUILD_SETUP" } });
  });
  await interaction.reply({ content: "Servidor configurado. Os módulos começam desativados por segurança.", flags: MessageFlags.Ephemeral });
});

await client.login(env.DISCORD_TOKEN);
