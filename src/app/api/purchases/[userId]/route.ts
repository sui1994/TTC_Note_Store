import { NextResponse } from "next/server";
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


    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Prisma接続テスト
    try {
      await prisma.$connect();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_connectError) {
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
    return NextResponse.json({ error: "サーバー内部エラー", details: err instanceof Error ? err.message : "不明なエラー" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
