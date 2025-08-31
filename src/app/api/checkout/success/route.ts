import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Stripeクライアントを遅延初期化する関数
function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2025-07-30.basil",
  });
}

export async function POST(request: Request) {
  // 環境変数の確認とStripeクライアントの初期化
  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error("Stripe initialization error:", error);
    return NextResponse.json({ error: "Server configuration error: Missing Stripe API key" }, { status: 500 });
  }

  const { sessionId } = await request.json();

  try {
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is missing" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const bookId = session.metadata?.bookId;

    if (!bookId) {
      return NextResponse.json({ error: "BookId not found in session metadata" }, { status: 400 });
    }

    // 既存の購入記録をチェック
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: session.client_reference_id!,
        bookId: bookId,
      },
    });

    // 既に購入済みの場合
    if (existingPurchase) {
      return NextResponse.json(
        {
          message: "すでに購入済みです",
          bookId: bookId,
        },
        { status: 200 }
      );
    }

    // 新規購入記録を作成
    const purchase = await prisma.purchase.create({
      data: {
        userId: session.client_reference_id!,
        bookId: bookId,
      },
    });

    return NextResponse.json(
      {
        ...purchase,
        bookId: bookId,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Checkout success API error:", err);
    return NextResponse.json(
      {
        error: "購入処理中にエラーが発生しました",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// 他のHTTPメソッドに対するハンドラーを追加
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST instead." }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed. Use POST instead." }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed. Use POST instead." }, { status: 405 });
}
