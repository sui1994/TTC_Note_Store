type ProductType = {
  id: string;
  name: string;
  description?: string;
  shipping_category?: string | string[];
  sku: string;
  is_active: boolean;
  stripe_tax_code?: string;
  currency?: string;
  image?: {
    url: string;
  };
  createdAt: string;
  updatedAt: string;
};

type VariantType = {
  id: string;
  product_id: string | { id: string };
  variant_id: string;
  label: string;
  price: number;
  stock: number;
  weight?: number;
  is_active: boolean;
  sort_order?: number;
  createdAt: string;
  updatedAt: string;
};

type ProductWithVariants = ProductType & {
  variants: VariantType[];
};

// 既存コンポーネント互換用
type BookType = ProductWithVariants;

type Purchase = {
  id: string;
  userId: string;
  bookId?: string | null;
  productId?: string | null;
  variantId?: string | null;
  stripeSessionId?: string | null;
  status?: "PENDING" | "PAID" | "CANCELED";
  createdAt: string;
};

type User = {
  id: string;
  name?: string | null | undefined;
  email?: string | null | undefined;
  image?: string | null | undefined;
};

// NextAuth関連の型定義
type NextAuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type NextAuthSession = {
  expires: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

type AuthenticatedSession = {
  expires: string;
  user: NextAuthUser;
};

type SessionCallbackParams = {
  session: NextAuthSession;
  user: { id: string };
};

type RedirectCallbackParams = {
  url: string;
  baseUrl: string;
};

export type {
  ProductType,
  VariantType,
  ProductWithVariants,
  BookType,
  Purchase,
  User,
  NextAuthUser,
  NextAuthSession,
  AuthenticatedSession,
  SessionCallbackParams,
  RedirectCallbackParams,
};
