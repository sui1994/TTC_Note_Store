import { NextResponse } from "next/server";
import Stripe from "stripe";

// 環境変数の存在確認とエラーハンドリング
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(request: Request) {
  // 環境変数の再確認
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is not defined");
    return NextResponse.json({ error: "Server configuration error: Missing Stripe API key" }, { status: 500 });
  }

  const { title, price, bookId, userId } = await request.json();

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata: {
        bookId: bookId,
      },
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: title,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:3000/book/checkout-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:3000",
    });
    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (err: unknown) {
    console.error("Stripe checkout error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
