#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { PrismaNeonHttp } = require("@prisma/adapter-neon");

function getConnectionString() {
  const url = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (!url) {
    throw new Error("POSTGRES_PRISMA_URL or POSTGRES_URL_NON_POOLING is not set.");
  }
  return url;
}

function createClient() {
  const adapter = new PrismaNeonHttp(getConnectionString(), {
    arrayMode: false,
    fullResults: false,
  });
  return new PrismaClient({ adapter });
}

function printUsage() {
  console.log(`Usage:
  node scripts/purchases-debug.js list [limit]
  node scripts/purchases-debug.js delete-all --yes
  node scripts/purchases-debug.js delete-user <userId> --yes
  node scripts/purchases-debug.js delete-id <purchaseId> --yes
`);
}

function getArg(args, index, label) {
  const value = args[index];
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function assertYes(args) {
  if (!args.includes("--yes")) {
    throw new Error("Missing --yes. This command performs deletion.");
  }
}

async function run() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const prisma = createClient();

  try {
    if (cmd === "list") {
      const limitRaw = args[1] || "30";
      const limit = Number.parseInt(limitRaw, 10);
      if (Number.isNaN(limit) || limit <= 0) {
        throw new Error("limit must be a positive integer.");
      }

      const rows = await prisma.purchase.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userId: true,
          productId: true,
          variantId: true,
          status: true,
          createdAt: true,
        },
      });

      if (rows.length === 0) {
        console.log("No purchases found.");
        return;
      }

      console.table(
        rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          productId: r.productId || "",
          variantId: r.variantId || "",
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        })),
      );
      console.log(`Total shown: ${rows.length}`);
      return;
    }

    if (cmd === "delete-all") {
      assertYes(args);
      const result = await prisma.purchase.deleteMany({});
      console.log(`Deleted purchases: ${result.count}`);
      return;
    }

    if (cmd === "delete-user") {
      const userId = getArg(args, 1, "userId");
      assertYes(args);
      const result = await prisma.purchase.deleteMany({ where: { userId } });
      console.log(`Deleted purchases for user ${userId}: ${result.count}`);
      return;
    }

    if (cmd === "delete-id") {
      const id = getArg(args, 1, "purchaseId");
      assertYes(args);
      await prisma.purchase.delete({ where: { id } });
      console.log(`Deleted purchase: ${id}`);
      return;
    }

    printUsage();
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
