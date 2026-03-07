import type { StoreCatalogRepository } from "./catalog-repository";
import { mockCatalogRepository } from "./mock-catalog-repository";
import { microcmsCatalogRepository } from "./microcms-catalog-repository";

export const getStoreCatalogRepository = (): StoreCatalogRepository => {
  const provider = process.env.STORE_CATALOG_PROVIDER?.toLowerCase();
  if (provider === "microcms") {
    return microcmsCatalogRepository;
  }
  return mockCatalogRepository;
};
