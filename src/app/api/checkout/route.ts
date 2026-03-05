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
    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedProductId = typeof productId === "string" ? productId.trim() : "";
    const normalizedVariantId = typeof variantId === "string" ? variantId.trim() : "";
    const normalizedUserId = typeof userId === "string" ? userId.trim() : "";
    const normalizedPrice = typeof price === "number" ? price : Number(price);
    const baseUrl = process.env.NEXTAUTH_URL;

    if (!normalizedProductId || !normalizedVariantId || !normalizedUserId) {
      return NextResponse.json({ error: "productId・variantId・userId は必須です" }, { status: 400 });
    }

    if (!normalizedTitle) {
      return NextResponse.json({ error: "title は必須です" }, { status: 400 });
    }

    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      return NextResponse.json({ error: "price は 1 以上の数値を指定してください" }, { status: 400 });
    }

    if (!Number.isInteger(normalizedPrice)) {
      return NextResponse.json({ error: "price は最小通貨単位の整数で指定してください" }, { status: 400 });
    }

    if (!baseUrl) {
      return NextResponse.json({ error: "サーバー設定エラー: NEXTAUTH_URL が未設定です" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata: {
        productId: normalizedProductId,
        variantId: normalizedVariantId,
        // backward compatibility with existing purchase schema
        bookId: normalizedProductId,
      },
      client_reference_id: normalizedUserId,
      line_items: [
        {
          price_data: {
            currency: currency || "jpy",
            product_data: {
              name: normalizedTitle,
            },
            unit_amount: normalizedPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/book/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}`,
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
