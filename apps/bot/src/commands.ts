import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Verifica a conexão do bot."),
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Inicializa este servidor no Discord SaaS.")
    .setDefaultMemberPermissions(0n),
  new SlashCommandBuilder()
    .setName("tickets")
    .setDescription("Configura e gerencia o suporte por tickets.")
    .addSubcommand((subcommand) => subcommand
      .setName("setup")
      .setDescription("Cria ou atualiza o painel de tickets.")
      .addChannelOption((option) => option.setName("canal").setDescription("Canal para publicar o painel.").setRequired(true))
      .addRoleOption((option) => option.setName("cargo_suporte").setDescription("Cargo com acesso aos tickets.").setRequired(true))
      .addChannelOption((option) => option.setName("categoria").setDescription("Categoria opcional dos canais de ticket.")))
    .addSubcommand((subcommand) => subcommand
      .setName("fechar")
      .setDescription("Fecha o ticket do canal atual.")),
].map((command) => command.toJSON());
