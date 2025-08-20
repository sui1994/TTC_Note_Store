import { BookType } from "@/app/components/types/types";
import { createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_SERVICE_DOMAIN!,
  apiKey: process.env.NEXT_PUBLIC_API_KEY!,
});

export const getAllBooks = async () => {
  const allBooks = await client.getList<BookType>({
    endpoint: "bookcommerce",
    customRequestInit: {
      next: {
        revalidate: 3600, // 1時間のキャッシュ
      },
    },
  });

  return allBooks;
};

export const getBook = async (contentId: string) => {
  const detailBook = await client.get<BookType>({
    endpoint: "bookcommerce",
    contentId: contentId,
    customRequestInit: {
      cache: "no-store",
    },
  });
  return detailBook;
};
