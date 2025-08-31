import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
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
