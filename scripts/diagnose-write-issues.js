/*
  Diagnose common reasons why "writes" may fail in this project.
  - Checks environment variables for NextAuth/Prisma/GitHub/Stripe/Notion
  - Verifies Prisma connectivity with a lightweight query (no mutations)

  Usage:
    node scripts/diagnose-write-issues.js

  Optional env files:
    You can run with dotenv-cli to load a specific env file, e.g.:
      npx dotenv -e .env.local -- node scripts/diagnose-write-issues.js
*/

const { PrismaClient } = require('@prisma/client');

function status(ok, msg) {
  const symbol = ok ? '✓' : '✗';
  console.log(`${symbol} ${msg}`);
}

function warn(msg) {
  console.warn(`! ${msg}`);
}

async function checkEnv() {
  const results = [];

  const requireOne = (keys, label) => {
    const exists = keys.some((k) => !!process.env[k]);
    results.push({ ok: exists, label, detail: exists ? '' : `Missing any of: ${keys.join(', ')}` });
  };

  const requireEnv = (k, label = k) => {
    const ok = !!process.env[k];
    results.push({ ok, label, detail: ok ? '' : `Missing ${k}` });
  };

  requireEnv('DATABASE_URL');
  requireOne(['NEXTAUTH_SECRET', 'AUTH_SECRET'], 'Auth secret (NEXTAUTH_SECRET or AUTH_SECRET)');
  requireEnv('GITHUB_ID');
  requireEnv('GITHUB_SECRET');
  requireEnv('NEXTAUTH_URL');

  // Stripe is only required for checkout flow
  results.push({ ok: !!process.env['STRIPE_SECRET_KEY'], label: 'Stripe (STRIPE_SECRET_KEY)', detail: 'Only required for checkout API' });

  // Notion (only for upload script)
  const notionOk = !!process.env['NOTION_TOKEN'] && (!!process.env['NOTION_PARENT_PAGE_ID'] || !!process.env['NOTION_PARENT_PAGE_URL']);
  results.push({ ok: notionOk, label: 'Notion upload envs (NOTION_TOKEN + PARENT_PAGE)', detail: 'Only required for scripts/upload-to-notion.js' });

  let allOk = true;
  for (const r of results) {
    status(r.ok, r.label + (r.detail ? ` - ${r.detail}` : ''));
    allOk = allOk && (r.ok || /Only required/.test(r.detail || ''));
  }

  return allOk;
}

async function checkPrismaConnection() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    warn('DATABASE_URL is not set; skipping Prisma connectivity test');
    return false;
  }

  // Warn about prisma+postgres URL in non-accelerate environments
  if (dbUrl.startsWith('prisma+postgres://')) {
    warn('DATABASE_URL uses prisma+postgres scheme. Ensure Prisma Data Proxy/Prisma Postgres is configured. For direct connections, use a standard postgres:// URL.');
  }

  const prisma = new PrismaClient();
  try {
    // Lightweight connectivity test
    await prisma.$queryRaw`SELECT 1`;
    status(true, 'Prisma connectivity');
    return true;
  } catch (err) {
    status(false, 'Prisma connectivity failed');
    console.error('Prisma error:', err?.message || err);
    return false;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

(async () => {
  console.log('== Diagnose write issues ==');
  const envOk = await checkEnv();
  const prismaOk = await checkPrismaConnection();

  console.log('\nSummary:');
  status(envOk, 'Environment configuration');
  status(prismaOk, 'Database connectivity');

  if (!envOk) {
    console.log('\nHints:');
    console.log('- Create/update .env.local with required keys (DATABASE_URL, NEXTAUTH_SECRET/AUTH_SECRET, GITHUB_ID/GITHUB_SECRET, NEXTAUTH_URL).');
    console.log('- For Notion upload, set NOTION_TOKEN and either NOTION_PARENT_PAGE_ID or NOTION_PARENT_PAGE_URL.');
  }

  if (!prismaOk) {
    console.log('\nPrisma troubleshooting:');
    console.log('- Verify Prisma schema is migrated: npx prisma migrate dev (or prisma db push)');
    console.log('- Check DATABASE_URL and that the database is reachable.');
    console.log('- If using prisma+postgres scheme, ensure the Prisma Data Proxy/Prisma Postgres is running, or switch to a standard postgres:// URL.');
  }
})();
