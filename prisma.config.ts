import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use non-pooling connection for Prisma CLI commands such as migrate/db push.
    url: env("POSTGRES_URL_NON_POOLING"),
  },
});
