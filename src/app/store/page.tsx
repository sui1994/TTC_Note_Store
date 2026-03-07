"use client";

import Link from "next/link";
import { useStoreCartContext } from "./components/StoreCartContext";
import { useStoreCatalog } from "./use-store-catalog";

const yen = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

export default function StoreTopPage() {
  const { addItem } = useStoreCartContext();
  const { products, isLoading, error } = useStoreCatalog();
  const product = products[0];

  return (
    <div className="rounded-3xl border border-[#f0e7dc] bg-white p-6 shadow-[0_18px_36px_rgba(0,0,0,0.06)] md:p-8">
      <p className="text-sm text-[#4a5565]">Store Top</p>
      <h2 className="mt-2 text-3xl font-semibold text-[#0a0a0a]">商品一覧</h2>
      <p className="mt-3 text-[#364153]">Phase 2: 商品一覧・詳細・カート導線まで実装済みです。</p>

      {isLoading ? <p className="mt-6 text-[#4a5565]">商品を読み込み中です...</p> : null}
      {!isLoading && error ? <p className="mt-6 text-red-600">{error}</p> : null}
      {!isLoading && !error && !product ? <p className="mt-6 text-[#4a5565]">商品がありません。</p> : null}

      {product ? (
        <div className="mt-6 grid gap-4 rounded-2xl border border-[#f3eadf] bg-[#fffaf4] p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <p className="font-medium text-[#0a0a0a]">{product.name}</p>
            <p className="text-sm text-[#4a5565]">{product.description}</p>
            <p className="pt-1 text-sm text-[#0a0a0a]">{yen(product.price)}</p>
          </div>
          <Link
            href={`/store/product/${product.slug}`}
            className="inline-flex justify-center rounded-full bg-[#0a0a0a] px-5 py-2 text-sm text-white hover:opacity-90"
          >
            商品詳細を見る
          </Link>
          <button
            onClick={() => addItem(product.id, 1)}
            className="inline-flex justify-center rounded-full border border-[#e6ddd0] bg-white px-5 py-2 text-sm text-[#364153] hover:bg-[#fff7ed]"
          >
            カートに追加
          </button>
        </div>
      ) : null}
    </div>
  );
}
