import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { persistPaidPurchaseFromSession } from "@/lib/stripe-purchase";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "stripe-signature ヘッダーまたは STRIPE_WEBHOOK_SECRET が不足しています" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook署名の検証に失敗しました:", error);
    return NextResponse.json({ error: "Webhook署名が不正です" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      await persistPaidPurchaseFromSession(session);
    }
  } catch (error) {
    console.error("Stripe webhook処理に失敗しました:", error);
    return NextResponse.json({ error: "Webhookの処理に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
