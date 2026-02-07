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
        { error: "User ID is required" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Prisma接続テスト
    try {
      await prisma.$connect();
    } catch {
      // Logging removed for production consistency
      return NextResponse.json(
        { error: "Database connection failed" },
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
    return NextResponse.json({ error: "Internal server error", details: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
