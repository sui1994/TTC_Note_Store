import type { StoreProduct } from "./types";

export const mockProducts: StoreProduct[] = [
  {
    id: "hokoro-set",
    slug: "hokoro-set",
    name: "ほころセット",
    price: 3980,
    description: "感情の軌跡を、やさしく書き残す。手帳・シール・ペンの3点セット",
    images: ["/default_icon.png"],
    stock: 24,
  },
];

export const getMockProductById = (id: string) => mockProducts.find((product) => product.id === id) ?? null;
export const getMockProductBySlug = (slug: string) => mockProducts.find((product) => product.slug === slug) ?? null;
