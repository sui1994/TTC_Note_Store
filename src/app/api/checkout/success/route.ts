import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request, response: Response) {
  const { sessionId } = await request.json();

  try {
    

    if (!sessionId) {
      throw new Error("Session ID is missing");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    
    

    const bookId = session.metadata?.bookId;
    

    if (!bookId) {
      throw new Error("BookId not found in session metadata");
    }

    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: session.client_reference_id!,
        bookId: bookId,
      },
    });

    

    if (!existingPurchase) {
      
      const purchase = await prisma.purchase.create({
        data: {
          userId: session.client_reference_id!,
          bookId: bookId,
        },
      });
      

      const response = {
        ...purchase,
        bookId: bookId,
      };
      
      return NextResponse.json(response);
    } else {
      
      const response = {
        message: "すでに購入済みにゃ",
        bookId: bookId,
      };
      
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