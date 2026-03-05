import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { buildPurchaseKey } from "@/lib/purchase-key";

type StripePurchaseData = {
  userId: string;
  productId: string;
  variantId: string;
  purchaseKey: string;
};

export function extractPurchaseDataFromSession(session: Stripe.Checkout.Session): StripePurchaseData {
  const productId = session.metadata?.productId || session.metadata?.bookId;
  const variantId = session.metadata?.variantId;
  const userId = session.client_reference_id;

  if (!productId) {
    throw new Error("セッションメタデータに productId が見つかりません");
  }

  if (!variantId) {
    throw new Error("セッションメタデータに variantId が見つかりません");
  }

  if (!userId) {
    throw new Error("チェックアウトセッションに userId(client_reference_id) がありません");
  }

  return {
    userId,
    productId,
    variantId,
    purchaseKey: buildPurchaseKey(productId, variantId),
  };
}

export async function persistPaidPurchaseFromSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") {
    throw new Error(`チェックアウトセッションの支払いが未完了です。payment_status=${session.payment_status ?? "unknown"}`);
  }

  const { userId, productId, variantId, purchaseKey } = extractPurchaseDataFromSession(session);

  try {
    return await prisma.purchase.create({
      data: {
        userId,
        bookId: purchaseKey,
        productId,
        variantId,
        stripeSessionId: session.id,
        status: "PAID",
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        OR: [{ stripeSessionId: session.id }, { userId, productId, variantId }, { userId, bookId: purchaseKey }],
      },
    });

    if (!existingPurchase) {
      throw error;
    }

    return prisma.purchase.update({
      where: { id: existingPurchase.id },
      data: {
        status: "PAID",
        stripeSessionId: existingPurchase.stripeSessionId || session.id,
        bookId: existingPurchase.bookId || purchaseKey,
        productId: existingPurchase.productId || productId,
        variantId: existingPurchase.variantId || variantId,
      },
    });
  }
}
