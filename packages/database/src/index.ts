import { PrismaClient } from "@prisma/client";

/** One client per process prevents connection-pool exhaustion during hot reload. */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

export { Prisma, PrismaClient } from "@prisma/client";
