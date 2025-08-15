import { BookType } from "@/app/components/types/types";
import { createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_SERVICE_DOMAIN!,
  apiKey: process.env.NEXT_PUBLIC_API_KEY!,
});

// microCMS接続テスト関数
export const testConnection = async () => {
  try {
    // console.log("Testing microCMS connection...");
    // console.log("Service Domain:", process.env.NEXT_PUBLIC_SERVICE_DOMAIN);
    // console.log("API Key (first 10 chars):", process.env.NEXT_PUBLIC_API_KEY?.substring(0, 10) + "...");

    const response = await client.getList({
      endpoint: "bookcommerce",
      queries: { limit: 1 },
    });

    console.log("Connection test successful:", response);
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};

export const getAllBooks = async () => {
  try {
    // console.log("Fetching all books from microCMS...");
    // console.log("Service Domain:", process.env.NEXT_PUBLIC_SERVICE_DOMAIN);
    // console.log("API Key exists:", !!process.env.NEXT_PUBLIC_API_KEY);

    const allBooks = await client.getList<BookType>({
      endpoint: "bookcommerce",
    });

    // console.log("getAllBooks response:", allBooks);
    // console.log("Books contents:", allBooks.contents);

    // // 各bookのIDをチェック
    // if (allBooks.contents) {
    //   allBooks.contents.forEach((book, index) => {
    //     console.log(`Book ${index}:`, {
    //       id: book.id,
    //       title: book.title,
    //       idType: typeof book.id,
    //       idIsUndefined: book.id === undefined,
    //       idIsNull: book.id === null,
    //       fullBook: book,
    //     });
    //   });
    // }

    return allBooks;
  } catch (error) {
    console.error("Error fetching all books from microCMS:", error);
    throw error;
  }
};

export const getBook = async (contentId: string) => {
  try {
    // console.log("Fetching book with ID:", contentId);

    if (!contentId || contentId === "null" || contentId === "undefined") {
      throw new Error("Invalid content ID");
    }

    const detailBook = await client.get<BookType>({
      endpoint: "bookcommerce",
      contentId,
    });

    console.log("getBook response:", detailBook);
    return detailBook;
  } catch (error) {
    // console.error("Error fetching book from MicroCMS:", error);
    // console.error("Content ID:", contentId);
    // console.error("Error details:", error);
    throw error;
  }
};
