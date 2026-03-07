"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useStoreCartContext } from "../../components/StoreCartContext";
import { QuantitySelector } from "../../components/QuantitySelector";
import { useStoreCatalog } from "../../use-store-catalog";

const yen = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

export default function StoreProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { productBySlug, isLoading, error } = useStoreCatalog();
  const product = useMemo(() => productBySlug.get(slug) ?? null, [productBySlug, slug]);
  const { addItem } = useStoreCartContext();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-[#f0e7dc] bg-white p-6 shadow-[0_18px_36px_rgba(0,0,0,0.06)] md:p-8">
        <p className="text-[#4a5565]">商品を読み込み中です...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-[#f0e7dc] bg-white p-6 shadow-[0_18px_36px_rgba(0,0,0,0.06)] md:p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-3xl border border-[#f0e7dc] bg-white p-6 shadow-[0_18px_36px_rgba(0,0,0,0.06)] md:p-8">
        <h2 className="text-2xl font-semibold text-[#0a0a0a]">商品が見つかりません</h2>
        <div className="mt-4">
          <Link href="/store" className="rounded-full border border-[#e6ddd0] px-4 py-2 text-sm text-[#364153] hover:bg-[#fff7ed]">
            商品一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#f0e7dc] bg-white p-6 shadow-[0_18px_36px_rgba(0,0,0,0.06)] md:p-8">
      <p className="text-sm text-[#4a5565]">Product Detail</p>
      <h2 className="mt-2 text-3xl font-semibold text-[#0a0a0a]">{product.name}</h2>
      <p className="mt-2 text-lg text-[#0a0a0a]">{yen(product.price)}</p>
      <p className="mt-3 text-[#364153]">{product.description}</p>
      <p className="mt-1 text-sm text-[#4a5565]">在庫: {product.stock}</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm text-[#4a5565]">数量</span>
        <QuantitySelector value={quantity} max={Math.max(1, product.stock)} onChange={setQuantity} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/store" className="rounded-full border border-[#e6ddd0] px-4 py-2 text-sm text-[#364153] hover:bg-[#fff7ed]">
          商品一覧へ戻る
        </Link>
        <button
          onClick={() => addItem(product.id, quantity)}
          className="rounded-full border border-[#e6ddd0] bg-white px-4 py-2 text-sm text-[#364153] hover:bg-[#fff7ed]"
        >
          カートに追加 ({quantity})
        </button>
        <Link href="/store/cart" className="rounded-full bg-[#0a0a0a] px-4 py-2 text-sm text-white hover:opacity-90">
          カートへ
        </Link>
      </div>
    </div>
  );
}
