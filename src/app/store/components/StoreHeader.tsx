"use client";

import Link from "next/link";
import { useStoreCartContext } from "./StoreCartContext";

export function StoreHeader() {
  const { itemCount } = useStoreCartContext();

  return (
    <header className="rounded-2xl border border-[#f0e7dc] bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[#0a0a0a]">ほころ Store</h1>
        <nav className="flex items-center gap-2 text-sm">
          <Link className="rounded-full px-3 py-1 text-[#364153] hover:bg-[#fff7ed]" href="/store">
            商品一覧
          </Link>
          <Link className="rounded-full px-3 py-1 text-[#364153] hover:bg-[#fff7ed]" href="/store/cart">
            カート ({itemCount})
          </Link>
          <Link className="rounded-full px-3 py-1 text-[#364153] hover:bg-[#fff7ed]" href="/">
            LPへ戻る
          </Link>
        </nav>
      </div>
    </header>
  );
}

