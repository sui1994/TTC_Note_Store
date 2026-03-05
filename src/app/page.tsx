import Book from "./components/Book";
import { getAllBooks } from "@/lib/microcms/client";
import { BookType } from "./components/types/types";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import { User } from "./components/types/types";
import prisma from "@/lib/prisma";
import { resolvePurchaseParts } from "@/lib/purchase-key";

// Force dynamic rendering since this page uses session/headers
export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const session = await getServerSession(nextAuthOptions);
    const user = (session as { user?: User })?.user;

    const allBooks = await getAllBooks();
    const contents = allBooks?.contents || [];

    const purchasedVariantsByProduct = new Map<string, Set<string>>();

    if (user && user.id) {
      try {
        const purchasesData = await prisma.purchase.findMany({
          where: { userId: user.id },
        });
        for (const purchase of purchasesData) {
          const { productId, variantId } = resolvePurchaseParts(purchase);
          if (!productId || !variantId) continue;
          const variants = purchasedVariantsByProduct.get(productId) || new Set<string>();
          variants.add(variantId);
          purchasedVariantsByProduct.set(productId, variants);
        }
      } catch (error) {
        console.error("購入情報の取得に失敗しました:", error);
      }
    }

    return (
      <>
        <main className="flex flex-wrap justify-center items-center md:mt-20 mt-20">
          <h2 className="text-center w-full font-bold text-3xl mb-2">Notebook Store</h2>
          {contents.length > 0 ? (
            contents.map((book: BookType) => (
              <Book key={book.id} book={book} purchasedVariantIds={Array.from(purchasedVariantsByProduct.get(book.id) || [])} />
            ))
          ) : (
            <div className="text-center w-full py-8">
              <p className="text-gray-500">商品を読み込み中...</p>
            </div>
          )}
        </main>
      </>
    );
  } catch (error) {
    console.error("ホームページでエラーが発生しました:", error);
    return (
      <>
        <main className="flex flex-wrap justify-center items-center md:mt-20 mt-20">
          <h2 className="text-center w-full font-bold text-3xl mb-2">Notebook Store</h2>
          <div className="text-center w-full py-8">
            <p className="text-red-500">エラーが発生しました。管理者に連絡してください。</p>
          </div>
        </main>
      </>
    );
  }
}
