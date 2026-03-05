import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  // 環境変数の確認とStripeクライアントの初期化
  let stripe: ReturnType<typeof getStripeClient>;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error("Stripe initialization error:", error);
    return NextResponse.json({ error: "Server configuration error: Missing Stripe API key" }, { status: 500 });
  }

  const { title, price, productId, variantId, currency, userId } = await request.json();

  try {
    if (!productId || !variantId || !userId) {
      return NextResponse.json({ error: "productId, variantId and userId are required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata: {
        productId,
        variantId,
        // backward compatibility with existing purchase schema
        bookId: productId,
      },
      client_reference_id: userId,
      line_items: [
        {
          price_data: {
            currency: currency || "jpy",
            product_data: {
              name: title,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/book/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}`,
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
