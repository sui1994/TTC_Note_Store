import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request, response: Response) {
  const { sessionId } = await request.json();

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const existingPurchases = prisma.purchase.findFirst({
      where: {
        userId: session.client_reference_id!,
        bookId: session.metadata?.bookId!,
      },
    });

    if (!existingPurchases) {
      const purchase = await prisma.purchase.create({
        data: {
          userId: session.client_reference_id!,
          bookId: session.metadata?.bookId!,
        },
      });
      return NextResponse.json(purchase);
    } else {
      return NextResponse.json({ message: "すでに購入済みにゃ" });
    }
  } catch (err) {
    return NextResponse.json(err);
  }
}
