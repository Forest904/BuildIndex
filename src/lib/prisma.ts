import { PrismaClient } from "@prisma/client";

// Provide a sane default for local dev to avoid missing env errors.
const databaseUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
