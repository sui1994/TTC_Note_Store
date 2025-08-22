import Book from "./components/Book";
import { getAllBooks } from "@/lib/microcms/client";
import { BookType, Purchase } from "./components/types/types";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/lib/next-auth/options";
import { User } from "./components/types/types";

export default async function Home() {

  const session = await getServerSession(nextAuthOptions);
  const user = session?.user as User;

  const { contents } = await getAllBooks();

  let purchasedIds: string[] = [];

  if (user && user.id) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases/${user.id}`);
      if (response.ok) {
        const purchasesData = await response.json();
        purchasedIds = purchasesData.map((purchase: Purchase) => purchase.bookId);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  }

  return (
    <>
      <main className="flex flex-wrap justify-center items-center md:mt-20 mt-20">
        <h2 className="text-center w-full font-bold text-3xl mb-2">Book Commerce</h2>
        {contents.map((book: BookType) => (
          <Book key={book.id} book={book} user={user} isPurchased={purchasedIds.includes(book.id)} />
        ))}
      </main>
    </>
  );
}