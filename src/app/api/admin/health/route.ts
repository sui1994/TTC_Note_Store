import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";

const parseAdminEmails = () => {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const isDevelopment = process.env.NODE_ENV === "development";
    const session = await getServerSession(nextAuthOptions);
    const signedInEmail = session?.user?.email?.toLowerCase();
    const adminEmails = parseAdminEmails();

    if (!session?.user || !signedInEmail) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (adminEmails.length === 0) {
      return NextResponse.json(
        { error: "ADMIN_EMAILS が未設定のため管理者ヘルスチェックを利用できません" },
        { status: 500 },
      );
    }

    if (!adminEmails.includes(signedInEmail)) {
      return NextResponse.json({ error: "このエンドポイントへのアクセス権限がありません" }, { status: 403 });
    }

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

    if (!isDevelopment) {
      if (missingConfig.length > 0) {
        console.warn("[admin/health] missing config:", missingConfig);
      }
      return NextResponse.json({
        status,
        timestamp,
      });
    }

    return NextResponse.json({
      status,
      timestamp,
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
      { status: 500 },
    );
  }
}
