import { ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits, type ChatInputCommandInteraction, type ButtonInteraction } from "discord.js";
import { Module, moduleUnavailableMessage } from "@discord-saas/shared";
import { prisma } from "@discord-saas/database";

const OPEN_TICKET_BUTTON = "tickets:open";
const CLOSE_TICKET_BUTTON = "tickets:close";

async function ticketsEnabled(guildId: string): Promise<boolean> {
  const module = await prisma.guildModule.findUnique({
    where: { guildId_module: { guildId, module: Module.TICKETS } },
    select: { enabled: true },
  });
  return module?.enabled === true;
}

export async function handleTicketsCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId || !interaction.guild) {
    await interaction.reply({ content: "Este comando só pode ser usado em um servidor.", flags: MessageFlags.Ephemeral });
    return;
  }
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === "setup") {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: "Você precisa da permissão de Administrador.", flags: MessageFlags.Ephemeral });
      return;
    }
    const panelChannelInput = interaction.options.getChannel("canal", true);
    const supportRole = interaction.options.getRole("cargo_suporte", true);
    const categoryInput = interaction.options.getChannel("categoria");
    const panelChannel = await interaction.guild.channels.fetch(panelChannelInput.id);
    const category = categoryInput ? await interaction.guild.channels.fetch(categoryInput.id) : null;
    if (!panelChannel || (panelChannel.type !== ChannelType.GuildText && panelChannel.type !== ChannelType.GuildAnnouncement) || (category && category.type !== ChannelType.GuildCategory)) {
      await interaction.reply({ content: "Escolha um canal de texto e, se usada, uma categoria válida.", flags: MessageFlags.Ephemeral });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.ticketConfig.upsert({
        where: { guildId: interaction.guildId! },
        create: { guildId: interaction.guildId!, panelChannelId: panelChannel.id, supportRoleId: supportRole.id, categoryId: category?.id },
        update: { panelChannelId: panelChannel.id, supportRoleId: supportRole.id, categoryId: category?.id },
      });
      // Explicit admin setup is the activation point for this module in the MVP.
      await tx.guildModule.upsert({
        where: { guildId_module: { guildId: interaction.guildId!, module: Module.TICKETS } },
        create: { guildId: interaction.guildId!, module: Module.TICKETS, enabled: true },
        update: { enabled: true },
      });
      await tx.auditLog.create({ data: { guildId: interaction.guildId!, actorId: interaction.user.id, action: "TICKETS_CONFIGURED" } });
    });

    await panelChannel.send({
      embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("Central de Suporte").setDescription("Clique no botão abaixo para abrir um ticket privado.")],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(OPEN_TICKET_BUTTON).setLabel("Abrir ticket").setStyle(ButtonStyle.Primary))],
    });
    await interaction.reply({ content: "Painel criado e módulo de Tickets ativado.", flags: MessageFlags.Ephemeral });
    return;
  }

  await closeCurrentTicket(interaction.guildId, interaction.channelId, interaction.user.id, interaction);
}

export async function handleTicketButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.guildId) return;
  if (interaction.customId === OPEN_TICKET_BUTTON) {
    if (!await ticketsEnabled(interaction.guildId)) {
      await interaction.reply({ content: moduleUnavailableMessage, flags: MessageFlags.Ephemeral });
      return;
    }
    const config = await prisma.ticketConfig.findUnique({ where: { guildId: interaction.guildId } });
    if (!config) {
      await interaction.reply({ content: "O sistema de tickets ainda não foi configurado.", flags: MessageFlags.Ephemeral });
      return;
    }
    const existing = await prisma.ticket.findFirst({ where: { guildId: interaction.guildId, openerId: interaction.user.id, status: "OPEN" } });
    if (existing) {
      await interaction.reply({ content: `Você já possui um ticket aberto: <#${existing.channelId}>.`, flags: MessageFlags.Ephemeral });
      return;
    }
    const ticket = await prisma.$transaction(async (tx) => {
      const last = await tx.ticket.findFirst({ where: { guildId: interaction.guildId! }, orderBy: { sequence: "desc" }, select: { sequence: true } });
      return tx.ticket.create({ data: { guildId: interaction.guildId!, openerId: interaction.user.id, channelId: `pending-${Date.now()}`, sequence: (last?.sequence ?? 0) + 1 } });
    });
    const channel = await interaction.guild!.channels.create({
      name: `ticket-${ticket.sequence}`,
      type: ChannelType.GuildText,
      parent: config.categoryId,
      permissionOverwrites: [
        { id: interaction.guildId, deny: ["ViewChannel"] },
        { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
        { id: config.supportRoleId, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
      ],
    });
    await prisma.ticket.update({ where: { id: ticket.id }, data: { channelId: channel.id } });
    await channel.send({ content: `<@${interaction.user.id}> <@&${config.supportRoleId}>`, embeds: [new EmbedBuilder().setTitle(`Ticket #${ticket.sequence}`).setDescription("Descreva como podemos ajudar.")], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(CLOSE_TICKET_BUTTON).setLabel("Fechar ticket").setStyle(ButtonStyle.Danger))] });
    await interaction.reply({ content: `Ticket criado: <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
    return;
  }
  if (interaction.customId === CLOSE_TICKET_BUTTON) await closeCurrentTicket(interaction.guildId, interaction.channelId, interaction.user.id, interaction);
}

async function closeCurrentTicket(guildId: string, channelId: string | null, actorId: string, interaction: ChatInputCommandInteraction | ButtonInteraction): Promise<void> {
  if (!channelId) return;
  const ticket = await prisma.ticket.findFirst({ where: { guildId, channelId, status: "OPEN" } });
  if (!ticket) {
    await interaction.reply({ content: "Este canal não possui um ticket aberto.", flags: MessageFlags.Ephemeral });
    return;
  }
  await prisma.$transaction([
    prisma.ticket.update({ where: { id: ticket.id }, data: { status: "CLOSED", closedAt: new Date(), closedById: actorId } }),
    prisma.auditLog.create({ data: { guildId, actorId, action: "TICKET_CLOSED", metadata: { ticketId: ticket.id } } }),
  ]);
  await interaction.reply({ content: "Ticket fechado. O canal será removido em breve.", flags: MessageFlags.Ephemeral });
}
