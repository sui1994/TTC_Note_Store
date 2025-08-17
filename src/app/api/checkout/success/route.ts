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
  console.log("POST request received at /api/checkout/success");

  // 環境変数の確認とStripeクライアントの初期化
  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error("Stripe initialization error:", error);
    return NextResponse.json({ error: "Server configuration error: Missing Stripe API key" }, { status: 500 });
  }

  const { sessionId } = await request.json();
  console.log("Received sessionId:", sessionId);

  try {
    // console.log("Retrieving Stripe session:", sessionId);

    if (!sessionId) {
      throw new Error("Session ID is missing");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // // console.log("Stripe session retrieved successfully");
    // // console.log("Stripe session details:", {
    //   id: session.id,
    //   client_reference_id: session.client_reference_id,
    //   metadata: session.metadata,
    //   payment_status: session.payment_status,
    // });

    const bookId = session.metadata?.bookId;
    // console.log("BookId from metadata:", bookId);

    if (!bookId) {
      throw new Error("BookId not found in session metadata");
    }

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: session.client_reference_id!,
        bookId: bookId,
      },
    });

    // console.log("Existing purchase check:", existingPurchase);

    if (!existingPurchase) {
      // console.log("Creating new purchase record");
      const purchase = await prisma.purchase.create({
        data: {
          userId: session.client_reference_id!,
          bookId: bookId,
        },
      });
      // console.log("Purchase created:", purchase);

      const response = {
        ...purchase,
        bookId: bookId,
      };
      // console.log("Returning response:", response);
      return NextResponse.json(response);
    } else {
      // console.log("Purchase already exists");
      const response = {
        message: "すでに購入済みにゃ",
        bookId: bookId,
      };
      // console.log("Returning response:", response);
      return NextResponse.json(response);
    }
  } catch (err) {
    console.error("Checkout success API error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
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
