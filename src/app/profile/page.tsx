import { nextAuthOptions } from "@/lib/next-auth/options";
import { getServerSession } from "next-auth/next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BookType, AuthenticatedSession } from "../components/types/types";
import { getAllBooks } from "@/lib/microcms/client";
import PurchaseDetailBook from "../components/PurchaseDetailBook";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getPurchasedBooks(userId: string): Promise<BookType[]> {
  try {
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: userId,
      },
    });

    if (purchases.length === 0) {
      return [];
    }

    const purchasedProductIds = Array.from(new Set(purchases.map((purchase) => purchase.bookId.split("::")[0])));
    const allBooks = await getAllBooks();
    const productMap = new Map(allBooks.contents.map((book) => [book.id, book]));

    return purchasedProductIds
      .map((productId) => productMap.get(productId))
      .filter((book): book is BookType => Boolean(book));
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
    let purchasedBooks: BookType[] = [];
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
            purchasedBooks.map((book: BookType) => <PurchaseDetailBook key={book.id} purchaseDetailBook={book} />)
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
