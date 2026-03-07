"use client";

import type { StoreProduct } from "../types";
import { QuantitySelector } from "./QuantitySelector";

const yen = (value: number) => `¥${value.toLocaleString("ja-JP")}`;

export function CartItemRow({
  product,
  quantity,
  onChangeQuantity,
  onRemove,
}: {
  product: StoreProduct;
  quantity: number;
  onChangeQuantity: (nextQuantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0e7dc] p-3">
      <div>
        <p className="font-medium text-[#0a0a0a]">{product.name}</p>
        <p className="text-sm text-[#4a5565]">
          {yen(product.price)} x {quantity} = {yen(product.price * quantity)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <QuantitySelector value={quantity} max={Math.max(1, product.stock)} onChange={onChangeQuantity} />
        <button className="rounded-full border border-[#e6ddd0] px-3 py-1 text-xs text-[#364153] hover:bg-[#fff7ed]" onClick={onRemove} type="button">
          削除
        </button>
      </div>
    </article>
  );
}

