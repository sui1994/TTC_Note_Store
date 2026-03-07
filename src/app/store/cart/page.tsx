"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { CartItemRow } from "../components/CartItemRow";
import { OrderSummary } from "../components/OrderSummary";
import { useStoreCartContext } from "../components/StoreCartContext";
import type { StoreProduct } from "../types";
import { useStoreCatalog } from "../use-store-catalog";

const yen = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

export default function StoreCartPage() {
  const router = useRouter();
  const { items, setItemQuantity, removeItem } = useStoreCartContext();
  const { productById, isLoading, error } = useStoreCatalog();
  const lineItems = items
    .map((item) => {
      const product = productById.get(item.productId);
      if (!product) return null;
      return {
        product,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      };
    })
    .filter((item): item is { product: StoreProduct; quantity: number; subtotal: number } => item !== null);
  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = subtotal > 0 ? 500 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <div className="rounded-3xl border border-[#f0e7dc] bg-white p-6 shadow-[0_18px_36px_rgba(0,0,0,0.06)] md:p-8">
        <p className="text-sm text-[#4a5565]">Cart</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#0a0a0a]">カート</h2>
        <p className="mt-3 text-[#364153]">数量変更・削除・合計計算まで実装済みです。</p>
        {isLoading ? <p className="mt-3 text-[#4a5565]">商品情報を読み込み中です...</p> : null}
        {!isLoading && error ? <p className="mt-3 text-red-600">{error}</p> : null}

        {lineItems.length === 0 ? (
          <p className="mt-6 text-[#4a5565]">カートは空です。</p>
        ) : (
          <div className="mt-6 space-y-3">
            {lineItems.map((item) => (
              <CartItemRow
                key={item.product.id}
                product={item.product}
                quantity={item.quantity}
                onChangeQuantity={(nextQty) => setItemQuantity(item.product.id, nextQty)}
                onRemove={() => removeItem(item.product.id)}
              />
            ))}
            <p className="pt-2 text-right text-sm text-[#4a5565]">小計: {yen(subtotal)}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/store" className="rounded-full border border-[#e6ddd0] px-4 py-2 text-sm text-[#364153] hover:bg-[#fff7ed]">
            商品一覧へ戻る
          </Link>
          {lineItems[0] ? (
            <Link
              href={`/store/product/${lineItems[0].product.slug}`}
              className="rounded-full border border-[#e6ddd0] px-4 py-2 text-sm text-[#364153] hover:bg-[#fff7ed]"
            >
              商品詳細へ
            </Link>
          ) : null}
        </div>
      </div>
      <OrderSummary subtotal={subtotal} shipping={shipping} onProceedCheckout={() => router.push("/store/thanks?checkout=dummy")} />
    </div>
  );
}
