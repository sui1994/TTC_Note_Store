import { BookType } from "@/app/components/types/types";
import { createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_SERVICE_DOMAIN!,
  apiKey: process.env.NEXT_PUBLIC_API_KEY!,
});

// microCMS接続テスト関数
export const testConnection = async () => {
  try {
    
    
    

    const response = await client.getList({
      endpoint: "bookcommerce",
      queries: { limit: 1 },
    });

    
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};

export const getAllBooks = async () => {
  try {
    
    
    

    const allBooks = await client.getList<BookType>({
      endpoint: "bookcommerce",
    });


    return allBooks;
  } catch (error) {
    console.error("Error fetching all books from microCMS:", error);
    throw error;
  }
};

export const getBook = async (contentId: string) => {
  try {
    
    if (!contentId || contentId === "null" || contentId === "undefined") {
      throw new Error("Invalid content ID");
    }

    const detailBook = await client.get<BookType>({
      endpoint: "bookcommerce",
      contentId,
    });

    
    return detailBook;
  } catch (error) {
    
    
    
    throw error;
  }
};