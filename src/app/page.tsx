import Book from "./components/Book";
import { getAllBooks } from "@/lib/microcms/client";
import { BookType } from "./components/types/types";


export default async function Home() {
  const { contents } = await getAllBooks();

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Book Commerce App</h1>
        <p className="mt-3 text-lg">Welcome to the book commerce app!</p>
      </div>

      <div className="flex flex-wrap justify-center">
        {contents.map((book: BookType) => (
          <Book
            key={book.id}
            book={book}
            isPurchased={false}
          />
        ))}
      </div>
    </main>
  );
}
