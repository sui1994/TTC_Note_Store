import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type Stripe from "stripe";
import { nextAuthOptions } from "@/lib/next-auth/options";
import { getStripeClient } from "@/lib/stripe";
import { getBook } from "@/lib/microcms/client";

const supportedCurrencies = new Set(["jpy"]);
const supportedShippingMethods = new Set(["standard", "express"]);
const allowedShippingCountries: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] = ["JP"];

type ShippingRule = {
  label: string;
  amount: number;
};

const shippingRulesByCategory: Record<string, Record<"standard" | "express", ShippingRule>> = {
  "メール便": {
    standard: { label: "メール便", amount: 250 },
    express: { label: "メール便（速達）", amount: 450 },
  },
  "通常発送": {
    standard: { label: "通常発送", amount: 600 },
    express: { label: "通常発送（お急ぎ）", amount: 900 },
  },
  default: {
    standard: { label: "標準配送", amount: 500 },
    express: { label: "お急ぎ配送", amount: 900 },
  },
};

const normalizeShippingCategory = (value: unknown): string => {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim().length > 0);
    return typeof first === "string" ? first.trim() : "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
};

const resolveShippingRule = (shippingCategory: string, shippingMethod: "standard" | "express"): ShippingRule => {
  const categoryRules = shippingRulesByCategory[shippingCategory] || shippingRulesByCategory.default;
  return categoryRules[shippingMethod];
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.error("リクエストボディのJSONパースに失敗しました:", error);
    return NextResponse.json({ error: "不正なリクエストボディです（JSONの解析に失敗しました）" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "不正なリクエストボディです（オブジェクト形式で送信してください）" }, { status: 400 });
  }

  const { title, price, productId, variantId, currency, userId, shippingMethod, shippingCategory } = body as {
    title?: unknown;
    price?: unknown;
    productId?: unknown;
    variantId?: unknown;
    currency?: unknown;
    userId?: unknown;
    shippingMethod?: unknown;
    shippingCategory?: unknown;
  };

  // 環境変数の確認とStripeクライアントの初期化
  let stripe: ReturnType<typeof getStripeClient>;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error("Stripe initialization error:", error);
    return NextResponse.json({ error: "サーバー設定エラー: Stripe APIキーが未設定です" }, { status: 500 });
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
    const requestedShippingMethod = typeof shippingMethod === "string" ? shippingMethod.trim().toLowerCase() : "";
    const fallbackShippingCategory = normalizeShippingCategory(shippingCategory);
    let normalizedPrice: number;
    if (typeof price === "number") {
      normalizedPrice = price;
    } else if (typeof price === "string") {
      const trimmedPrice = price.trim();
      if (!/^[0-9]+$/.test(trimmedPrice)) {
        return NextResponse.json({ error: "price は数値または数字のみの文字列で指定してください" }, { status: 400 });
      }
      normalizedPrice = Number(trimmedPrice);
    } else {
      return NextResponse.json({ error: "price は数値または数字のみの文字列で指定してください" }, { status: 400 });
    }
    const hasCurrencyField = Object.prototype.hasOwnProperty.call(body as Record<string, unknown>, "currency");
    let normalizedCurrency: string;
    if (hasCurrencyField) {
      if (typeof currency !== "string" || currency.trim().length === 0) {
        return NextResponse.json({ error: "currency は非空の文字列で指定してください" }, { status: 400 });
      }
      normalizedCurrency = currency.trim().toLowerCase();
    } else {
      normalizedCurrency = "jpy";
    }
    const requestOrigin = new URL(request.url).origin;
    const normalizedBaseUrl = requestOrigin.trim().replace(/\/+$/, "");

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

    if (!Number.isSafeInteger(normalizedPrice)) {
      return NextResponse.json({ error: "price は安全な範囲の整数（最小通貨単位）で指定してください" }, { status: 400 });
    }

    if (!supportedCurrencies.has(normalizedCurrency)) {
      const supportedCurrenciesLabel = Array.from(supportedCurrencies).join(" / ");
      return NextResponse.json(
        { error: `currency はサポート対象の値を指定してください（現在は ${supportedCurrenciesLabel} のみ）` },
        { status: 400 },
      );
    }

    if (!normalizedBaseUrl) {
      return NextResponse.json({ error: "サーバー設定エラー: ベースURLの解決に失敗しました" }, { status: 500 });
    }

    if (!supportedShippingMethods.has(requestedShippingMethod)) {
      return NextResponse.json({ error: "shippingMethod は standard / express のいずれかを指定してください" }, { status: 400 });
    }

    let resolvedShippingCategory = fallbackShippingCategory;
    try {
      const product = await getBook(normalizedProductId);
      resolvedShippingCategory = normalizeShippingCategory(product?.shipping_category) || fallbackShippingCategory;
    } catch (error) {
      console.warn("Shipping category resolution failed. Fallback to request value.", error);
    }

    const shippingRule = resolveShippingRule(resolvedShippingCategory, requestedShippingMethod as "standard" | "express");

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata: {
        productId: normalizedProductId,
        variantId: normalizedVariantId,
        shippingMethod: requestedShippingMethod,
        shippingCategory: resolvedShippingCategory || "default",
        // Stripe metadata 上では、metadata.productId が存在しない場合のフォールバックとして
        // bookId にも同じ productId を保存しておく（古いセッション向けの後方互換用途）。
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
      shipping_address_collection: {
        allowed_countries: allowedShippingCountries,
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingRule.amount,
              currency: normalizedCurrency,
            },
            display_name: shippingRule.label,
          },
        },
      ],
      success_url: `${normalizedBaseUrl}/book/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: normalizedBaseUrl,
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "決済ページURLの生成に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id,
    });
  } catch (err: unknown) {
    console.error("Stripe checkout error:", err);
    const isDevelopment = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "決済処理中にエラーが発生しました",
        ...(isDevelopment ? { details: err instanceof Error ? err.message : String(err) } : {}),
      },
      { status: 500 },
    );
  }
}
