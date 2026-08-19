import { REST, Routes } from "discord.js";
import { env } from "./env.js";
import { commands } from "./commands.js";

const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
const route = env.DISCORD_GUILD_ID
  ? Routes.applicationGuildCommands(env.DISCORD_APPLICATION_ID, env.DISCORD_GUILD_ID)
  : Routes.applicationCommands(env.DISCORD_APPLICATION_ID);
await rest.put(route, { body: commands });
console.log(`Registered ${commands.length} slash commands.`);
