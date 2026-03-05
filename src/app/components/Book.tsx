"use client";

import Image from "next/image";
import React, { memo, useEffect, useMemo, useState } from "react";
import { BookType, NextAuthUser, VariantType } from "./types/types";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type BookProps = {
  book: BookType;
  purchasedVariantIds: string[];
};

const normalizeShippingCategory = (value: BookType["shipping_category"]): string => {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim().length > 0);
    return typeof first === "string" ? first.trim() : "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
};

const Book = memo(({ book, purchasedVariantIds }: BookProps) => {
  const [showModal, setShowModal] = useState(false);
  const activeVariants = useMemo(
    () => (book.variants || []).filter((variant) => variant.is_active).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [book.variants]
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(activeVariants[0]?.id || "");
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<"standard" | "express">("standard");
  const router = useRouter();
  const { data: session } = useSession();
  const purchasedVariantIdSet = useMemo(() => new Set(purchasedVariantIds), [purchasedVariantIds]);

  // セッションからユーザー情報を取得
  const user = session?.user as NextAuthUser | undefined;
  const apiBaseUrl = "/api";

  //stripe checkout
  const selectedVariant: VariantType | undefined = activeVariants.find((variant) => variant.id === selectedVariantId) || activeVariants[0];
  const isSelectedVariantPurchased = selectedVariant ? purchasedVariantIdSet.has(selectedVariant.id) : false;
  const hasPurchasedAnyVariant = purchasedVariantIds.length > 0;
  const normalizedShippingCategory = normalizeShippingCategory(book.shipping_category);

  useEffect(() => {
    if (activeVariants.length === 0) {
      setSelectedVariantId("");
      return;
    }

    setSelectedVariantId((current) => {
      const exists = activeVariants.some((variant) => variant.id === current);
      return exists ? current : activeVariants[0].id;
    });
  }, [activeVariants]);

  const startCheckout = async () => {
    try {
      if (!selectedVariant) {
        alert("購入可能なバリエーションがありません。");
        return;
      }

      const requestBody = {
        productId: book.id,
        variantId: selectedVariant.id,
        title: `${book.name} - ${selectedVariant.label}`,
        price: selectedVariant.price,
        currency: book.currency || "jpy",
        userId: user?.id,
        shippingMethod: selectedShippingMethod,
        shippingCategory: normalizedShippingCategory,
      };

      const response = await fetch(`${apiBaseUrl}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      let responseData: unknown = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        const errorMessage =
          responseData &&
          typeof responseData === "object" &&
          "error" in responseData &&
          typeof (responseData as { error?: unknown }).error === "string"
            ? (responseData as { error: string }).error
            : `決済APIエラー（status: ${response.status}）`;
        throw new Error(errorMessage);
      }

      if (
        responseData &&
        typeof responseData === "object" &&
        "checkout_url" in responseData &&
        typeof (responseData as { checkout_url?: unknown }).checkout_url === "string"
      ) {
        const successData = responseData as { checkout_url: string; session_id?: string };
        if (successData.session_id) {
          sessionStorage.setItem("stripeSessionId", successData.session_id);
        }

        window.location.href = successData.checkout_url;
      } else {
        console.error("レスポンスデータが不正です:", responseData);
        alert("チェックアウトURLの取得に失敗しました");
      }
    } catch (err) {
      console.error("Error in startCheckout:", err);
      const message = err instanceof Error ? err.message : "エラーが発生しました。もう一度お試しください。";
      alert(message);
    }
  };

  const handlePurchaseClick = () => {
    if (isSelectedVariantPurchased) {
      // 購入済みの場合はアラートを表示
      alert("このバリエーションは購入済みです。");
    } else {
      setShowModal(true);
    }
  };

  const handlePurchaseConfirm = () => {
    setShowModal(false);

    if (!user) {
      router.push("/login");
    } else {
      startCheckout();
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
    } else if (hasPurchasedAnyVariant) {
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
              src={book.image?.url || "/default_icon.png"}
              alt={book.name}
              width={450}
              height={350}
              className="rounded-t-md"
            />
            <div className="px-4 py-4 bg-slate-100">
              <h2 className="text-lg font-semibold">商品名：{book.name}</h2>
              {book.description ? <p className="mt-2 text-sm text-slate-600 line-clamp-2">{book.description}</p> : null}
              <p className="mt-2 text-md text-slate-700">
                価格：
                {selectedVariant ? `${selectedVariant.price}円` : "設定なし"}
              </p>
              {activeVariants.length > 0 ? (
                <div className="mt-2">
                  <label className="text-sm text-slate-700 mr-2" htmlFor={`variant-${book.id}`}>
                    バリエーション
                  </label>
                  <select
                    id={`variant-${book.id}`}
                    value={selectedVariantId}
                    onChange={(event) => setSelectedVariantId(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                  >
                    {activeVariants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.label} ({variant.price}円 / 在庫:{variant.stock})
                        {purchasedVariantIdSet.has(variant.id) ? " ✓購入済み" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="mt-2 text-sm text-red-600">販売中のバリエーションがありません</p>
              )}
            </div>
          </div>
          {/* 購入ボタン部分 */}
          <div className="px-4 py-2 bg-slate-100 rounded-b-md w-full">
            <button
              onClick={handlePurchaseClick}
              disabled={!selectedVariant || selectedVariant.stock <= 0}
              className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
              {isSelectedVariantPurchased ? "このバリエーションは購入済み" : "購入する"}
            </button>
          </div>
        </div>
        {showModal && (
          <div className="fixed top-0 left-0 right-0 bottom-0 bg-slate-900 bg-opacity-50 flex justify-center items-center modal z-50">
            <div className="bg-white p-8 rounded-lg max-w-md mx-4">
              <h3 className="text-xl mb-4 font-semibold">{book.name}</h3>
              <p className="text-gray-600 mb-2">バリエーション: {selectedVariant?.label || "未選択"}</p>
              <p className="text-gray-600 mb-4">価格: {selectedVariant?.price || 0}円</p>
              <div className="mb-4">
                <p className="text-gray-600 mb-2">発送方法</p>
                <select
                  value={selectedShippingMethod}
                  onChange={(event) => setSelectedShippingMethod(event.target.value as "standard" | "express")}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="standard">通常配送</option>
                  <option value="express">お急ぎ配送</option>
                </select>
              </div>
              {!user ? (
                <div>
                  <p className="mb-4">この商品を購入するにはログインが必要です。</p>
                  <button onClick={handlePurchaseConfirm} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4">
                    ログインして購入
                  </button>
                </div>
              ) : (
                <div>
                  <p className="mb-4">この商品を購入しますか？</p>
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
