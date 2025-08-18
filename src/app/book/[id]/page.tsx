import { getBook } from "@/lib/microcms/client";
import Image from "next/image";
import React from "react";

// Force dynamic rendering to avoid build-time errors
export const dynamic = "force-dynamic";

const DetailBook = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  if (!id) {
    return <div>Book ID not found</div>;
  }

  try {
    const book = await getBook(id);

    if (!book) {
      return <div>Book not found</div>;
    }

    return (
      <div className="container mx-auto p-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <Image className="w-full h-80 object-cover object-center" src={book.thumbnail.url} alt={book.title} width={700} height={700} />
          <div className="p-4">
            <h2 className="text-2xl font-bold">{book.title}</h2>
            <div className="text-gray-700 mt-2" dangerouslySetInnerHTML={{ __html: book.content }} />

            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">公開日: {new Date(book.createdAt).toLocaleString()}</span>
              <span className="text-sm text-gray-500">最終更新: {new Date(book.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-red-800">Error Loading Book</h2>
          <p className="text-red-600 mt-2">Unable to load book details. Please check your configuration and try again.</p>
        </div>
      </div>
    );
  }
};

export default DetailBook;
