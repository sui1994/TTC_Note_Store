import type { StoreProduct } from "../types";

export type StoreCatalogRepository = {
  listProducts: () => Promise<StoreProduct[]>;
  getProductById: (id: string) => Promise<StoreProduct | null>;
  getProductBySlug: (slug: string) => Promise<StoreProduct | null>;
};
