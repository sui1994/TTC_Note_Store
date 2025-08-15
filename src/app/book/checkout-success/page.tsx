"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const PurchaseSuccess = () => {
  const [bookId, setBookId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const fetchData = async () => {
      if (sessionId) {
        try {
          // console.log("Fetching purchase data for session:", sessionId);
          // console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/checkout/success`;
          // console.log("Full API URL:", apiUrl);

          const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          });

          // console.log("Response status:", res.status);
          // console.log("Response ok:", res.ok);

          if (!res.ok) {
            const errorText = await res.text();
            console.error("API Error response:", errorText);
            throw new Error(`HTTP error! status: ${res.status}, response: ${errorText}`);
          }

          const data = await res.json();
          // console.log("Purchase success response:", data);
          // console.log("BookId in response:", data.bookId);
          // console.log("BookId type:", typeof data.bookId);

          // APIからbookIdを取得
          if (data.bookId) {
            // console.log("Setting bookId:", data.bookId);
            setBookId(data.bookId);
          } else {
            // console.log("No bookId in response:", data);
            // console.log("Response keys:", Object.keys(data));
            setError("購入情報の取得に失敗しました");
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("購入情報の取得中にエラーが発生しました");
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("セッションIDが見つかりません");
        setIsLoading(false);
      }
    };
    fetchData();
  }, [sessionId]);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center mt-20">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">処理中...</h1>
          <p className="text-center text-gray-600">購入情報を確認しています。</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center mt-20">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center text-red-600 mb-4">エラー</h1>
          <p className="text-center text-gray-600">{error}</p>
          <div className="mt-6 text-center">
            <Link href="/" className="text-indigo-600 hover:text-indigo-800 transition duration-300">
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center mt-20">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">購入ありがとうございます！</h1>
        <p className="text-center text-gray-600">ご購入いただいた内容の詳細は、登録されたメールアドレスに送信されます。</p>
        <div className="mt-6 text-center">
          {bookId ? (
            <Link href={`/book/${bookId}`} className="text-indigo-600 hover:text-indigo-800 transition duration-300">
              購入した記事を読む
            </Link>
          ) : (
            <Link href="/" className="text-indigo-600 hover:text-indigo-800 transition duration-300">
              ホームに戻る
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccess;
