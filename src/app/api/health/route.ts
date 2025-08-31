import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 環境変数のチェック
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      GITHUB_ID: !!process.env.GITHUB_ID,
      GITHUB_SECRET: !!process.env.GITHUB_SECRET,
      NEXT_PUBLIC_SERVICE_DOMAIN: !!process.env.NEXT_PUBLIC_SERVICE_DOMAIN,
      NEXT_PUBLIC_API_KEY: !!process.env.NEXT_PUBLIC_API_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    };

    const missingVars = Object.entries(envCheck)
      .filter(([, exists]) => !exists)
      .map(([name]) => name);

    const status = missingVars.length === 0 ? "正常" : "異常";

    return NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envCheck,
      missingVars,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "エラー",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}
