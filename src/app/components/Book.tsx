"use client";

import Image from "next/image";
import React, { memo, useState } from "react";
import { BookType } from "./types/types";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type BookProps = {
  book: BookType;
  user?: any; // オプショナルに変更
  isPurchased: boolean;
};

// eslint-disable-next-line react/display-name
const Book = memo(({ book, isPurchased }: BookProps) => {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // セッションからユーザー情報を取得
  const user = session?.user;

  //stripe checkout
  const startCheckout = async (bookId: number) => {
    console.log("Starting checkout for book:", bookId);
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

    try {
      const requestBody = {
        bookId,
        title: book.title,
        price: book.price,
        userId: user?.id,
      };

      console.log("Request body:", requestBody);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (responseData && responseData.checkout_url) {
        if (responseData.session_id) {
          sessionStorage.setItem("stripeSessionId", responseData.session_id);
        }

        //チェックアウト後のURL遷移先
        console.log("Redirecting to:", responseData.checkout_url);
        window.location.href = responseData.checkout_url;
      } else {
        console.error("Invalid response data:", responseData);
        alert("チェックアウトURLの取得に失敗しました");
      }
    } catch (err) {
      console.error("Error in startCheckout:", err);
      alert("エラーが発生しました。もう一度お試しください。");
    }
  };

  const handlePurchaseClick = () => {
    if (!isPurchased) {
      setShowModal(true);
    } else {
      // ここで既に購入済みであることをユーザーに通知する処理を追加できます。
      // 例: アラートを表示する、またはUI上でメッセージを表示する。
      alert("その商品は購入済みです。");
    }
  };

  const handlePurchaseConfirm = () => {
    console.log("Purchase confirm clicked");
    console.log("User:", user);
    console.log("Book:", book);

    setShowModal(false); // モーダルを閉じる

    if (!user) {
      console.log("No user, redirecting to login");
      router.push("/login");
    } else {
      console.log("User exists, starting checkout");
      //Stripe購入画面へ。購入済みならそのまま本ページへ。
      startCheckout(book.id);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* アニメーションスタイル */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .modal {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      <div className="flex flex-col items-center m-4">
        <a onClick={handlePurchaseClick} className="cursor-pointer shadow-2xl duration-300 hover:translate-y-1 hover:shadow-none">
          <Image
            priority
            src={book.thumbnail.url || "/default_icon.png"} // サムネイルが無い場合はデフォルト画像を表示
            alt={book.title}
            width={450}
            height={350}
            className="rounded-t-md"
          />
          <div className="px-4 py-4 bg-slate-100 rounded-b-md">
            <h2 className="text-lg font-semibold">{book.title}</h2>
            {/* <p className="mt-2 text-lg text-slate-600">この本は○○...</p> */}
            <p className="mt-2 text-md text-slate-700">値段：{book.price}円</p>
          </div>
        </a>
        {showModal && (
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-slate-900 bg-opacity-50 flex justify-center items-center modal">
            <div className="bg-white p-8 rounded-lg">
              <h3 className="text-xl mb-4">本を購入しますか？</h3>
              <button onClick={handlePurchaseConfirm} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4">
                購入する
              </button>
              <button onClick={handleCancel} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
});

export default Book;
