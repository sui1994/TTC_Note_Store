"use client";

import Image from "next/image";
import React, { memo, useState } from "react";
import { BookType } from "./types/types";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type BookProps = {
  book: BookType;
  isPurchased: boolean;
};

const Book = memo(({ book, isPurchased }: BookProps) => {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // セッションからユーザー情報を取得
  const user = session?.user as { id: string; name?: string | null; email?: string | null; image?: string | null } | undefined;

  //stripe checkout
  const startCheckout = async (bookId: string) => {
    try {
      const requestBody = {
        bookId: book.id,
        title: book.title,
        price: book.price,
        userId: user?.id,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData && responseData.checkout_url) {
        if (responseData.session_id) {
          sessionStorage.setItem("stripeSessionId", responseData.session_id);
        }

        window.location.href = responseData.checkout_url;
      } else {
        console.error("レスポンスデータが不正です:", responseData);
        alert("チェックアウトURLの取得に失敗しました");
      }
    } catch (err) {
      console.error("Error in startCheckout:", err);
      alert("エラーが発生しました。もう一度お試しください。");
    }
  };

  const handlePurchaseClick = () => {
    if (isPurchased) {
      // 購入済みの場合はアラートを表示
      alert("その商品は購入済みですにゃ。");
    } else {
      setShowModal(true);
    }
  };

  const handlePurchaseConfirm = () => {
    setShowModal(false);

    if (!user) {
      router.push("/login");
    } else {
      startCheckout(book.id);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const handleBookClick = () => {
    // IDが存在しない場合の処理
    if (!book.id || book.id === undefined) {
      console.error("Book ID is missing or undefined");
      alert("ブックIDが見つかりません");
      return;
    }

    // ログイン状態をチェック
    if (!user) {
      // ログアウト状態の場合は購入モーダルを表示
      setShowModal(true);
    } else if (isPurchased) {
      // ログイン済みかつ購入済みの場合は詳細ページに遷移
      router.push(`/book/${book.id}`);
    } else {
      // ログイン済だが未購入の場合は購入モーダルを表示
      setShowModal(true);
    }
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
        <div className="cursor-pointer shadow-2xl duration-300 hover:translate-y-1 hover:shadow-none">
          {/* 画像とタイトル部分は詳細ページへのリンク */}
          <div onClick={handleBookClick}>
            <Image
              priority
              src={book.thumbnail.url || "/default_icon.png"} // サムネイルが無い場合はデフォルト画像を表示
              alt={book.title}
              width={450}
              height={350}
              className="rounded-t-md"
            />
            <div className="px-4 py-4 bg-slate-100">
              <h2 className="text-lg font-semibold">記事のタイトル：{book.title}</h2>
              <p className="mt-2 text-md text-slate-700">値段：{book.price}円</p>
            </div>
          </div>
          {/* 購入ボタン部分 */}
          <div className="px-4 py-2 bg-slate-100 rounded-b-md w-full">
            <button onClick={handlePurchaseClick} className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              {isPurchased ? "購入済み" : "購入する"}
            </button>
          </div>
        </div>
        {showModal && (
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-slate-900 bg-opacity-50 flex justify-center items-center modal z-50">
            <div className="bg-white p-8 rounded-lg max-w-md mx-4">
              <h3 className="text-xl mb-4 font-semibold">{book.title}</h3>
              <p className="text-gray-600 mb-4">価格: {book.price}円</p>
              {!user ? (
                <div>
                  <p className="mb-4">この本を読むにはログインして購入する必要があります。</p>
                  <button onClick={handlePurchaseConfirm} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4">
                    ログインして購入
                  </button>
                </div>
              ) : (
                <div>
                  <p className="mb-4">この本を購入しますか？</p>
                  <button onClick={handlePurchaseConfirm} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4">
                    購入する
                  </button>
                </div>
              )}
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

Book.displayName = "Book";

export default Book;
