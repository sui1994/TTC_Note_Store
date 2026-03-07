"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useStoreCartContext } from "../components/StoreCartContext";

export default function StoreThanksPage() {
  const searchParams = useSearchParams();
  const checkoutMode = searchParams.get("checkout");
  const { clearCart } = useStoreCartContext();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="rounded-3xl border border-[#f0e7dc] bg-white p-6 text-center shadow-[0_18px_36px_rgba(0,0,0,0.06)] md:p-10">
      <p className="text-sm text-[#4a5565]">Thanks</p>
      <h2 className="mt-2 text-3xl font-semibold text-[#0a0a0a]">ご購入ありがとうございます</h2>
      <p className="mt-3 text-[#364153]">あなたの毎日に、やさしい時間が増えますように。</p>
      {checkoutMode === "dummy" ? <p className="mt-2 text-xs text-[#6a7282]">※ ダミー決済フローで遷移しました</p> : null}

      <div className="mt-6">
        <Link href="/store" className="inline-flex rounded-full bg-[#0a0a0a] px-6 py-2 text-sm text-white hover:opacity-90">
          商品一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
