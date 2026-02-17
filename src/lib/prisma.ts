import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import type { HTTPQueryOptions } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
let prismaClient: PrismaClient | undefined;

const neonHttpOptions: HTTPQueryOptions<false, false> = {
  arrayMode: false,
  fullResults: false,
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error("POSTGRES_PRISMA_URL is not set");
  }

  return new PrismaClient({
    adapter: new PrismaNeonHttp(connectionString, neonHttpOptions),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export function getPrismaClient(): PrismaClient {
  if (prismaClient) {
    return prismaClient;
  }

  if (globalForPrisma.prisma) {
    prismaClient = globalForPrisma.prisma;
    return globalForPrisma.prisma;
  }

  prismaClient = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
  }

  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client as object, prop, receiver);

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});

export default prisma;
