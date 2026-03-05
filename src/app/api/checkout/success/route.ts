import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { extractPurchaseDataFromSession, persistPaidPurchaseFromSession } from "@/lib/stripe-purchase";

export async function POST(request: Request) {
  // 環境変数の確認とStripeクライアントの初期化
  let stripe: Stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error("Stripe initialization error:", error);
    return NextResponse.json({ error: "サーバー設定エラー: Stripe APIキーが未設定です" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.error("checkout success: リクエストボディのJSONパースに失敗しました:", error);
    return NextResponse.json({ error: "不正なリクエストボディです（JSONの解析に失敗しました）" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "不正なリクエストボディです（オブジェクト形式で送信してください）" }, { status: 400 });
  }

  const { sessionId } = body as { sessionId?: unknown };

  try {
    const normalizedSessionId = typeof sessionId === "string" ? sessionId.trim() : "";

    if (!normalizedSessionId) {
      return NextResponse.json({ error: "セッションIDが見つかりません" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(normalizedSessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          checkoutStatus: "pending",
          message: "支払い処理を確認中です",
          payment_status: session.payment_status,
        },
        { status: 202 },
      );
    }

    await persistPaidPurchaseFromSession(session);
    const { productId, variantId, purchaseKey } = extractPurchaseDataFromSession(session);

    return NextResponse.json(
      {
        checkoutStatus: "completed",
        bookId: purchaseKey,
        productId,
        variantId,
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
  return NextResponse.json({ error: "このメソッドは許可されていません。POSTを使用してください。" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "このメソッドは許可されていません。POSTを使用してください。" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "このメソッドは許可されていません。POSTを使用してください。" }, { status: 405 });
}
