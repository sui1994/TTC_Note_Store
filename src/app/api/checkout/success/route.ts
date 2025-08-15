import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request, response: Response) {
  const { sessionId } = await request.json();

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
