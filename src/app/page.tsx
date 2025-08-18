import Book from "./components/Book";
import { getAllBooks } from "@/lib/microcms/client";
import { BookType, Purchase } from "./components/types/types";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import { User } from "./components/types/types";

export const dynamic = "force-dynamic";


export default async function Home() {
  try {

    const session = await getServerSession(nextAuthOptions);
    const user = (session as { user?: User })?.user;

    const allBooks = await getAllBooks();
    const contents = allBooks?.contents || [];

    let purchasedIds: string[] = [];

    if (user && user.id) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/${user.id}`);
        if (response.ok) {
          const purchasesData = await response.json();
          purchasedIds = purchasesData.map((purchase: Purchase) => purchase.bookId);
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
      }
    }
    
    return (
      <>
        <main className="flex flex-wrap justify-center items-center md:mt-20 mt-20">
          <h2 className="text-center w-full font-bold text-3xl mb-2">Book Commerce</h2>
          {contents.length > 0 ? (
            contents.map((book: BookType) => <Book key={book.id} book={book} isPurchased={purchasedIds.includes(book.id)} user={user} />)
          ) : (
            <div className="text-center w-full py-8">
              <p className="text-gray-500">書籍を読み込み中...</p>
            </div>
          )}
        </main>
      </>
    );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {

  }
}
