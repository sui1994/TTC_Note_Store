import { defineConfig } from "prisma/config";

const datasourceUrl = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_PRISMA_URL;
const argv = process.argv.join(" ");
const requiresDatasource =
  /\bprisma\s+(db|migrate|studio|introspect)\b/.test(argv) ||
  /\bprisma\s+validate\b/.test(argv);

if (!datasourceUrl && requiresDatasource) {
  throw new Error(
    "Database URL is not set. Define POSTGRES_URL_NON_POOLING or POSTGRES_PRISMA_URL.",
  );
}

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
