import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Verifica a conexão do bot."),
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Inicializa este servidor no Discord SaaS.")
    .setDefaultMemberPermissions(0n),
].map((command) => command.toJSON());
