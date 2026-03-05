import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import { prisma } from "@/lib/prisma";

// CORS設定
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONSリクエスト（プリフライト）の処理
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const session = await getServerSession(nextAuthOptions);
    const sessionUserId = session?.user?.id;

    if (!sessionUserId) {
      return NextResponse.json(
        { error: "認証が必要です" },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (userId !== sessionUserId) {
      return NextResponse.json(
        { error: "このリソースへのアクセス権限がありません" },
        {
          status: 403,
          headers: corsHeaders,
        },
      );
    }

    // Prisma接続テスト
    try {
      await prisma.$connect();
    } catch {
      // Logging removed for production consistency
      return NextResponse.json(
        { error: "データベース接続に失敗しました" },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const purchases = await prisma.purchase.findMany({
      where: {
        userId: userId,
      },
    });

    return NextResponse.json(purchases, {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("API: Error in GET /api/purchases/[userId]:", err);
    const isDevelopment = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "サーバー内部でエラーが発生しました",
        ...(isDevelopment ? { details: err instanceof Error ? err.message : String(err) } : {}),
      },
      { status: 500, headers: corsHeaders },
    );
  } finally {
    await prisma.$disconnect();
  }
}
