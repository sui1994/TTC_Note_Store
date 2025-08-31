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

    if (process.env.NODE_ENV === "development") {
      console.log("Connection test successful:", response);
    }
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};

export const getAllBooks = async () => {
  return client.getList<BookType>({
    endpoint: "bookcommerce",
  });
};

export const getBook = async (contentId: string) => {
  if (!contentId || contentId === "null" || contentId === "undefined") {
    throw new Error("Invalid content ID");
  }

  return client.get<BookType>({
    endpoint: "bookcommerce",
    contentId,
  });
};
