"use client";

import { useEffect, useMemo, useState } from "react";
import type { StoreProduct } from "./types";

export function useStoreCatalog() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/store/catalog", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`catalog api error: ${res.status}`);
        }
        const data = (await res.json()) as { products?: unknown };
        const result = Array.isArray(data.products) ? (data.products as StoreProduct[]) : [];
        if (!cancelled) {
          setProducts(result);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setError("商品情報の取得に失敗しました");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const productBySlug = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products]);

  return {
    products,
    productById,
    productBySlug,
    isLoading,
    error,
  };
}
