import { nextAuthOptions } from "@/lib/next-auth/options";
import { getServerSession } from "next-auth/next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BookType, AuthenticatedSession, VariantType } from "../components/types/types";
import { getAllBooks } from "@/lib/microcms/client";
import PurchaseDetailBook from "../components/PurchaseDetailBook";
import { prisma } from "@/lib/prisma";
import { resolvePurchaseParts } from "@/lib/purchase-key";

export const dynamic = "force-dynamic";

type PurchasedBookItem = {
  purchaseId: string;
  book: BookType;
  variantLabel?: string;
  variantPrice?: number;
};

async function getPurchasedBooks(userId: string): Promise<PurchasedBookItem[]> {
  try {
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (purchases.length === 0) {
      return [];
    }

    const allBooks = await getAllBooks();
    const productMap = new Map(allBooks.contents.map((book) => [book.id, book]));
    const dedupe = new Set<string>();
    const purchasedItems: PurchasedBookItem[] = [];

    for (const purchase of purchases) {
      const { productId, variantId } = resolvePurchaseParts(purchase);
      if (!productId) continue;

      const book = productMap.get(productId);
      if (!book) continue;

      const dedupeKey = `${purchase.userId}::${productId}::${variantId || ""}`;
      if (dedupe.has(dedupeKey)) continue;
      dedupe.add(dedupeKey);

      // checkoutではmicroCMSコンテンツID(item.id)を保存しているため、照合も同じ識別子に統一する。
      const variant: VariantType | undefined = variantId ? book.variants.find((item) => item.id === variantId) : undefined;

      purchasedItems.push({
        purchaseId: purchase.id,
        book,
        variantLabel: variant?.label,
        variantPrice: variant?.price,
      });
    }

    return purchasedItems;
  } catch (error) {
    console.error("getPurchasedBooksでエラーが発生しました:", error);
    return [];
  }
}

export default async function ProfilePage() {
  try {
    const session = await getServerSession(nextAuthOptions);

    if (!(session as AuthenticatedSession)?.user) {
      redirect("/login");
    }

    const user = (session as AuthenticatedSession).user;

    // ユーザーIDが存在する場合のみ購入履歴を取得
    let purchasedBooks: PurchasedBookItem[] = [];
    if (user.id) {
      purchasedBooks = await getPurchasedBooks(user.id);
    }

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">プロフィール</h1>

        <div className="bg-white shadow-md rounded p-4 mb-6">
          <div className="flex items-center">
            <Image priority src={user.image || "/default_icon.png"} alt="user profile_icon" width={60} height={60} className="rounded-full" />
            <h2 className="text-lg ml-4 font-semibold">お名前：{user.name}</h2>
          </div>
        </div>

        <span className="font-medium text-lg mb-4 mt-4 block">購入した記事を読む</span>

        <div className="flex items-center gap-6 flex-wrap">
          {purchasedBooks.length > 0 ? (
            purchasedBooks.map((item) => (
              <PurchaseDetailBook
                key={item.purchaseId}
                purchaseDetailBook={item.book}
                purchasedVariantLabel={item.variantLabel}
                purchasedVariantPrice={item.variantPrice}
              />
            ))
          ) : (
            <div className="text-gray-500 text-center w-full py-8">
              <p>まだ購入した書籍がありません</p>
              <p className="text-sm mt-2">書籍を購入すると、ここに表示されます</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("ProfilePageでエラーが発生しました:", error);
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">プロフィール</h1>
        <div className="text-red-500">
          <p>エラーが発生しました</p>
          <p className="text-sm">ページを再読み込みしてください</p>
        </div>
      </div>
    );
  }
}
