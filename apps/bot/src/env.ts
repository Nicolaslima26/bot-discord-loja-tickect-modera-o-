import { z } from "zod";

const schema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_APPLICATION_ID: z.string().regex(/^\d{17,20}$/),
  DISCORD_GUILD_ID: z.string().regex(/^\d{17,20}$/).optional(),
});
export const env = schema.parse(process.env);
