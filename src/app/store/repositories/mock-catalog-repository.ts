import { getMockProductById, getMockProductBySlug, mockProducts } from "../mock-products";
import type { StoreCatalogRepository } from "./catalog-repository";

export const mockCatalogRepository: StoreCatalogRepository = {
  async listProducts() {
    return mockProducts;
  },
  async getProductById(id) {
    return getMockProductById(id);
  },
  async getProductBySlug(slug) {
    return getMockProductBySlug(slug);
  },
};
