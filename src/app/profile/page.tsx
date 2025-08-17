import { nextAuthOptions } from "@/lib/next-auth/options";
import { getServerSession } from "next-auth/next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BookType } from "../components/types/types";
import { Purchase } from "@prisma/client";
import { getBook } from "@/lib/microcms/client";
import PurchaseDetailBook from "../components/PurchaseDetailBook";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering since this page uses session/headers
export const dynamic = "force-dynamic";

async function getPurchasedBooks(userId: string): Promise<BookType[]> {
  try {
    console.log("Fetching purchases for user:", userId);

    // Server ComponentでPrismaを直接使用
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: userId,
      },
    });

    console.log("Purchases found:", purchases.length);
    console.log("Purchases data:", purchases);

    if (purchases.length === 0) {
      console.log("No purchases found for user");
      return [];
    }

    // 各購入に対して書籍詳細を取得
    const booksPromises = purchases.map(async (purchase: Purchase) => {
      try {
        console.log("Fetching book:", purchase.bookId);
        const book = await getBook(purchase.bookId);
        return book;
      } catch (error) {
        console.error(`Failed to fetch book ${purchase.bookId}:`, error);
        return null;
      }
    });

    const books = await Promise.all(booksPromises);

    // nullを除外して有効な書籍のみを返す
    const validBooks = books.filter((book): book is BookType => book !== null);
    console.log("Valid books found:", validBooks.length);

    return validBooks;
  } catch (error) {
    console.error("Error in getPurchasedBooks:", error);
    return [];
  }
}

export default async function ProfilePage() {
  try {
    const session = await getServerSession(nextAuthOptions);

    if (!(session as { user?: { id: string; name?: string | null; email?: string | null; image?: string | null } })?.user) {
      redirect("/login");
    }

    const user = (session as { user: { id: string; name?: string | null; email?: string | null; image?: string | null } }).user;
    console.log("User ID:", user.id);

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
    console.error("Error in ProfilePage:", error);
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
