import { defineConfig } from "prisma/config";

const datasourceUrl = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_PRISMA_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prefer non-pooling URL for migrate/push commands, but fall back to pooled URL
  // so generate/build can still run in environments that only provide pooled DB URL.
  ...(datasourceUrl
    ? {
        datasource: {
          url: datasourceUrl,
        },
      }
    : {}),
});
