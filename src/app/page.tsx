import Book from "./components/Book";
import { getAllBooks } from "@/lib/microcms/client";
import { BookType, Purchase } from "./components/types/types";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import { User } from "./components/types/types";

// Force dynamic rendering since this page uses session/headers
export const dynamic = "force-dynamic";

//https://zenn.dev/arsaga/articles/3f5bce7c904ebe#%E3%83%90%E3%83%BC%E3%82%B8%E3%83%A7%E3%83%B3%E6%83%85%E5%A0%B1
// 疑似データ
// const books = [
//   {
//     id: 1,
//     title: "Book 1",
//     thumbnail: "/thumbnails/discord-clone-udemy.png",
//     author: {
//       id: 1,
//       name: "Author 1",
//       description: "Author 1 description",
//       profile_icon: "https://source.unsplash.com/random/2",
//     },
//     content: "Content 1",
//     created_at: new Date().toString(),
//     updated_at: new Date().toString(),
//   },
//   {
//     id: 2,
//     title: "Book 2",
//     thumbnail: "/thumbnails/notion-udemy.png",
//     author: {
//       id: 2,
//       name: "Author 2",
//       description: "Author 2 description",
//       profile_icon: "https://source.unsplash.com/random/3",
//     },
//     content: "Content 2",
//     created_at: new Date().toString(),
//     updated_at: new Date().toString(),
//   },
//   {
//     id: 3,
//     title: "Book 3",
//     thumbnail: "/thumbnails/openai-chatapplication-udem.png",
//     author: {
//       id: 3,
//       name: "Author 3",
//       description: "Author 3 description",
//       profile_icon: "https://source.unsplash.com/random/4",
//     },
//     content: "Content 3",
//     created_at: new Date().toString(),
//     updated_at: new Date().toString(),
//   },
//   // 他の本のデータ...
// ];
export default async function Home() {
  try {
    // const [books, setBooks] = useState<BookType[]>([]);
    // const [purchasedBookIds, setPurchasedBookIds] = useState<number[]>([]);

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
      } catch (error) {
        console.error("Error fetching purchases:", error);
      }
    }
    // const { data: session } = useSession();
    // const user: any = session?.user;

    // useEffect(() => {
    //   const fetchBooksAndPurchases = async () => {
    //     try {
    //       // 書籍データの取得
    //       const booksData = await getAllBooks();
    //       setBooks(booksData.contents);

    //       // ユーザーの購入履歴の取得
    //       if (user && user.id) {
    //         const response = await fetch(
    //           `${process.env.NEXT_PUBLIC_API_URL}/purchases/${user.id}`
    //         );
    //         const purchasesData = await response.json();
    //         const purchasedIds = purchasesData.map(
    //           (purchase: Purchase) => purchase.bookId
    //         );
    //         setPurchasedBookIds(purchasedIds);
    //       }
    //     } catch (error) {
    //       console.error("Error fetching data:", error);
    //     }
    //   };

    //   fetchBooksAndPurchases();
    // }, [user]);

    return (
      <>
        <main className="flex flex-wrap justify-center items-center md:mt-20 mt-20">
          <h2 className="text-center w-full font-bold text-3xl mb-2">Book Commerce</h2>
          {contents.length > 0 ? (
            contents.map((book: BookType) => <Book key={book.id} book={book} isPurchased={purchasedIds.includes(book.id)} />)
          ) : (
            <div className="text-center w-full py-8">
              <p className="text-gray-500">書籍を読み込み中...</p>
            </div>
          )}
        </main>
      </>
    );
  } catch (error) {
    console.error("Error in Home page:", error);
    return (
      <>
        <main className="flex flex-wrap justify-center items-center md:mt-20 mt-20">
          <h2 className="text-center w-full font-bold text-3xl mb-2">Book Commerce</h2>
          <div className="text-center w-full py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-red-800 mb-2">エラーが発生しました</h3>
              <p className="text-red-600">アプリケーションの設定に問題があります。管理者にお問い合わせください。</p>
            </div>
          </div>
        </main>
      </>
    );
  }
}
