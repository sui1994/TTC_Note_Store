"use client";

import Book from "./components/Book";

const books = [
  {
    id: 1,
    title: "Book 1",
    thumbnail: "/thumbnails/discord-clone-udemy.png",
    price: 2980,
    author: {
      id: 1,
      name: "Author Name",
      description: "Author 1 description",
      profile_icon: "https://source.unsplash.com/random/2",
    },
    content: "Content 1",
    created_at: new Date().toString(),
    updated_at: new Date().toString(),
  },
  {
    id: 2,
    title: "Book 2",
    thumbnail: "/thumbnails/notion-udemy.png",
    price: 1980,
    author: {
      id: 2,
      name: "Author Name",
      description: "Author 2 description",
      profile_icon: "https://source.unsplash.com/random/3",
    },
    content: "Content 2",
    created_at: new Date().toString(),
    updated_at: new Date().toString(),
  },
  {
    id: 3,
    title: "Book 3",
    thumbnail: "/thumbnails/openai-chatapplication-udemy.png",
    price: 4980,
    author: {
      id: 3,
      name: "Author Name",
      description: "Author 3 description",
      profile_icon: "https://source.unsplash.com/random/4",
    },
    content: "Content 3",
    created_at: new Date().toString(),
    updated_at: new Date().toString(),
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Book Commerce App</h1>
        <p className="mt-3 text-lg">Welcome to the book commerce app!</p>
      </div>

      <div className="flex flex-wrap justify-center">
        {books.map((book) => (
          <Book key={book.id} book={book} />
        ))}
      </div>
    </main>
  );
}
