import { NextResponse } from "next/server";

export async function GET() {
  try {
    const envCheck = {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET_OR_AUTH_SECRET: !!(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET),
      OAUTH_PROVIDER_CONFIGURED: !!(
        (process.env.GITHUB_ID && process.env.GITHUB_SECRET) ||
        (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
        (process.env.LINE_CLIENT_ID && process.env.LINE_CLIENT_SECRET)
      ),
      NEXT_PUBLIC_API_URL: !!process.env.NEXT_PUBLIC_API_URL,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      MICROCMS_SERVICE_DOMAIN_OR_NEXT_PUBLIC_OR_SERVICE_DOMAIN: !!(
        process.env.MICROCMS_SERVICE_DOMAIN || process.env.NEXT_PUBLIC_SERVICE_DOMAIN || process.env.SERVICE_DOMAIN
      ),
      MICROCMS_API_KEY_OR_NEXT_PUBLIC_OR_API_KEY: !!(
        process.env.MICROCMS_API_KEY || process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY
      ),
    };

    const providerConfig = {
      github: {
        clientId: !!process.env.GITHUB_ID,
        clientSecret: !!process.env.GITHUB_SECRET,
      },
      google: {
        clientId: !!process.env.GOOGLE_CLIENT_ID,
        clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      },
      line: {
        clientId: !!process.env.LINE_CLIENT_ID,
        clientSecret: !!process.env.LINE_CLIENT_SECRET,
      },
    };

    const missingConfig = Object.entries(envCheck)
      .filter(([, exists]) => !exists)
      .map(([name]) => name);

    const status = missingConfig.length === 0 ? "ok" : "degraded";

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envCheck,
      providerConfig,
      missingConfig,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}
