/** Features are persisted as data, so plans can be configured without code deploys. */
export enum Module {
  STORE = "STORE",
  TICKETS = "TICKETS",
  MODERATION = "MODERATION",
}

export const moduleLabels: Record<Module, string> = {
  [Module.STORE]: "Loja",
  [Module.TICKETS]: "Tickets",
  [Module.MODERATION]: "AutoModeração",
};

export const moduleUnavailableMessage =
  "Este módulo não está habilitado no seu plano ou servidor.";

export type AppJobName = "health-check" | "delete-ticket-channel" | "ticket-cleanup";
export const APP_QUEUE = "discord-saas";
