import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  throw new Error("POSTGRES_PRISMA_URL is not set");
}

const adapter = new PrismaNeon(neon(connectionString));

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Ensure connection is established
prisma.$connect().catch((error) => {
  console.error("Failed to connect to database:", error);
});

export default prisma;
