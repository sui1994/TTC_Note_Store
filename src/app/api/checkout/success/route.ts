import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Stripeクライアントを遅延初期化する関数
function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("環境変数 STRIPE_SECRET_KEY が設定されていません");
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


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return NextResponse.json({ error: "サーバー設定エラー: Stripe APIキーが見つかりません" }, { status: 500 });
  }

  const { sessionId } = await request.json();

  try {

    if (!sessionId) {
      throw new Error("セッションIDが見つかりません");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);


    const bookId = session.metadata?.bookId;

    if (!bookId) {
      throw new Error("セッションのメタデータに書籍IDが見つかりません");
    }

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: session.client_reference_id!,
        bookId: bookId,
      },
    });


    if (!existingPurchase) {
      const purchase = await prisma.purchase.create({
        data: {
          userId: session.client_reference_id!,
          bookId: bookId,
        },
      });

      const response = {
        ...purchase,
        bookId: bookId,
      };
      return NextResponse.json(response);
    } else {
      const response = {
        message: "すでに購入済みにゃ",
        bookId: bookId,
      };
      return NextResponse.json(response);
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: "サーバー内部エラー",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

