import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import { getStripeClient } from "@/lib/stripe";

const supportedCurrencies = new Set(["jpy"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.error("リクエストボディのJSONパースに失敗しました:", error);
    return NextResponse.json({ error: "不正なリクエストボディです（JSONの解析に失敗しました）" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "不正なリクエストボディです（オブジェクト形式で送信してください）" }, { status: 400 });
  }

  const { title, price, productId, variantId, currency, userId } = body as {
    title?: unknown;
    price?: unknown;
    productId?: unknown;
    variantId?: unknown;
    currency?: unknown;
    userId?: unknown;
  };

  // 環境変数の確認とStripeクライアントの初期化
  let stripe: ReturnType<typeof getStripeClient>;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error("Stripe initialization error:", error);
    return NextResponse.json({ error: "Server configuration error: Missing Stripe API key" }, { status: 500 });
  }

  try {
    const authSession = await getServerSession(nextAuthOptions);
    const sessionUserId = authSession?.user?.id;
    if (!sessionUserId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedProductId = typeof productId === "string" ? productId.trim() : "";
    const normalizedVariantId = typeof variantId === "string" ? variantId.trim() : "";
    const requestUserId = typeof userId === "string" ? userId.trim() : "";
    const normalizedPrice = typeof price === "number" ? price : Number(price);
    const normalizedCurrency =
      typeof currency === "string" && currency.trim().length > 0 ? currency.trim().toLowerCase() : "jpy";
    const baseUrl = process.env.NEXTAUTH_URL?.trim();
    const normalizedBaseUrl = baseUrl?.replace(/\/+$/, "");

    if (requestUserId && requestUserId !== sessionUserId) {
      return NextResponse.json({ error: "リクエストの userId がセッションと一致しません" }, { status: 403 });
    }

    if (!normalizedProductId || !normalizedVariantId) {
      return NextResponse.json({ error: "productId・variantId は必須です" }, { status: 400 });
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

    if (!supportedCurrencies.has(normalizedCurrency)) {
      return NextResponse.json({ error: "currency はサポート対象の値を指定してください（現在は jpy のみ）" }, { status: 400 });
    }

    if (!normalizedBaseUrl) {
      return NextResponse.json({ error: "サーバー設定エラー: NEXTAUTH_URL が未設定です" }, { status: 500 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata: {
        productId: normalizedProductId,
        variantId: normalizedVariantId,
        // Stripe metadata 上の後方互換キー。bookId は従来どおり productId を保持する。
        bookId: normalizedProductId,
      },
      client_reference_id: sessionUserId,
      line_items: [
        {
          price_data: {
            currency: normalizedCurrency,
            product_data: {
              name: normalizedTitle,
            },
            unit_amount: normalizedPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${normalizedBaseUrl}/book/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: normalizedBaseUrl,
    });
    return NextResponse.json({
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id,
    });
  } catch (err: unknown) {
    console.error("Stripe checkout error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
