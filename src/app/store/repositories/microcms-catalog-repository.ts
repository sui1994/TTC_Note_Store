import { getAllBooks } from "@/lib/microcms/client";
import type { ProductWithVariants } from "@/app/components/types/types";
import type { StoreProduct } from "../types";
import type { StoreCatalogRepository } from "./catalog-repository";

const toStoreProduct = (product: ProductWithVariants): StoreProduct => {
  const activeVariants = (product.variants || []).filter((variant) => variant.is_active);
  const sortedVariants = activeVariants.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const primaryVariant = sortedVariants[0];

  return {
    id: product.id,
    slug: (product as ProductWithVariants & { slug?: string }).slug || product.id,
    name: product.name,
    description: product.description || "",
    price: primaryVariant?.price ?? 0,
    images: [product.image?.url || "/default_icon.png"],
    stock: sortedVariants.reduce((sum, variant) => sum + Math.max(0, variant.stock || 0), 0),
  };
};

export const microcmsCatalogRepository: StoreCatalogRepository = {
  async listProducts() {
    const data = await getAllBooks();
    return (data.contents || [])
      .filter((product) => product.is_active)
      .map((product) => toStoreProduct(product as ProductWithVariants))
      .filter((product) => product.price > 0);
  },
  async getProductById(id) {
    const data = await getAllBooks();
    const products = (data.contents || [])
      .filter((product) => product.is_active)
      .map((product) => toStoreProduct(product as ProductWithVariants))
      .filter((product) => product.price > 0);
    return products.find((product) => product.id === id) ?? null;
  },
  async getProductBySlug(slug) {
    const data = await getAllBooks();
    const products = (data.contents || [])
      .filter((product) => product.is_active)
      .map((product) => toStoreProduct(product as ProductWithVariants))
      .filter((product) => product.price > 0);
    return products.find((product) => product.slug === slug) ?? null;
  },
};
