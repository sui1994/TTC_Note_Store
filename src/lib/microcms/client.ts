import { BookType } from "@/app/components/types/types";
import { createClient } from "microcms-js-sdk";

const resolveMicrocmsConfig = () => {
  const serviceDomain =
    process.env.MICROCMS_SERVICE_DOMAIN || process.env.NEXT_PUBLIC_SERVICE_DOMAIN || process.env.SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY || process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY;

  if (!serviceDomain || !apiKey) {
    throw new Error(
      "microCMS config is missing. Set MICROCMS_SERVICE_DOMAIN/MICROCMS_API_KEY (or NEXT_PUBLIC_*, SERVICE_DOMAIN/API_KEY).",
    );
  }

  return { serviceDomain, apiKey };
};

const createMicrocmsClient = () => {
  const { serviceDomain, apiKey } = resolveMicrocmsConfig();
  return createClient({ serviceDomain, apiKey });
};

// microCMS接続テスト関数
export const testConnection = async () => {
  try {
    const client = createMicrocmsClient();
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
  try {
    const client = createMicrocmsClient();
    const allBooks = await client.getList<BookType>({
      endpoint: "bookcommerce",
      customRequestInit: {
        cache: "no-store",
      },
    });

    return allBooks;
  } catch (error) {
    throw error;
  }
};

export const getBook = async (contentId: string) => {
  try {
    const client = createMicrocmsClient();
    if (!contentId || contentId === "null" || contentId === "undefined") {
      throw new Error("Invalid content ID");
    }

    const detailBook = await client.get<BookType>({
      endpoint: "bookcommerce",
      contentId,
      customRequestInit: {
        cache: "no-store",
      },
    });

    return detailBook;
  } catch (error) {
    throw error;
  }
};
