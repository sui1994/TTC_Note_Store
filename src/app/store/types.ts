export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  stock: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
};
