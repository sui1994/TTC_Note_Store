import { ProductType, ProductWithVariants, VariantType } from "@/app/components/types/types";
import { createClient } from "microcms-js-sdk";

const resolveMicrocmsConfig = () => {
  const serviceDomain =
    process.env.MICROCMS_SERVICE_DOMAIN || process.env.NEXT_PUBLIC_SERVICE_DOMAIN || process.env.SERVICE_DOMAIN;
  const apiKey = process.env.MICROCMS_API_KEY || process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY;

  if (!serviceDomain || !apiKey) {
    return null;
  }

  return { serviceDomain, apiKey };
};

let hasWarnedMissingConfig = false;

const createMicrocmsClient = () => {
  const config = resolveMicrocmsConfig();
  if (!config) {
    if (!hasWarnedMissingConfig) {
      hasWarnedMissingConfig = true;
      console.warn(
        "microCMS config is missing. Set MICROCMS_SERVICE_DOMAIN/MICROCMS_API_KEY (or NEXT_PUBLIC_*, SERVICE_DOMAIN/API_KEY).",
      );
    }
    return null;
  }
  const { serviceDomain, apiKey } = config;
  return createClient({ serviceDomain, apiKey });
};

const PRODUCTS_ENDPOINT_CANDIDATES = [
  process.env.MICROCMS_PRODUCTS_ENDPOINT,
  "products",
  "notebooks",
].filter(Boolean) as string[];

const VARIANTS_ENDPOINT = process.env.MICROCMS_VARIANTS_ENDPOINT || "variants";

const getProductRefId = (productRef: VariantType["product_id"]) => {
  if (typeof productRef === "string") return productRef;
  return productRef?.id;
};

const fetchProductsFromEndpoint = async (endpoint: string) => {
  const client = createMicrocmsClient();
  if (!client) return { contents: [] as ProductType[] };
  return client.getList<ProductType>({
    endpoint,
    queries: {
      filters: "is_active[equals]true",
      limit: 100,
    },
    customRequestInit: {
      cache: "no-store",
    },
  });
};

const fetchVariants = async () => {
  const client = createMicrocmsClient();
  if (!client) return [];
  const variants = await client.getList<VariantType>({
    endpoint: VARIANTS_ENDPOINT,
    queries: {
      filters: "is_active[equals]true",
      orders: "sort_order",
      limit: 1000,
    },
    customRequestInit: {
      cache: "no-store",
    },
  });

  return variants.contents;
};

const fetchProducts = async () => {
  for (const endpoint of PRODUCTS_ENDPOINT_CANDIDATES) {
    try {
      const response = await fetchProductsFromEndpoint(endpoint);
      return response.contents;
    } catch {
      continue;
    }
  }
  return [];
};

// microCMS接続テスト関数
export const testConnection = async () => {
  try {
    const client = createMicrocmsClient();
    if (!client) return false;
    const endpoint = PRODUCTS_ENDPOINT_CANDIDATES[0] || "products";
    const response = await client.getList({
      endpoint,
      queries: { limit: 1 },
    });

    if (process.env.NODE_ENV === "development") {
      console.log("Connection test successful:", response);
    }
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};

export const getAllBooks = async () => {
  try {
    const [products, variants] = await Promise.all([fetchProducts(), fetchVariants()]);
    const variantsByProductId = new Map<string, VariantType[]>();

    for (const variant of variants) {
      const productId = getProductRefId(variant.product_id);
      if (!productId) continue;
      const list = variantsByProductId.get(productId) || [];
      list.push(variant);
      variantsByProductId.set(productId, list);
    }

    const contents: ProductWithVariants[] = products.map((product) => ({
      ...product,
      variants: (variantsByProductId.get(product.id) || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    }));

    return {
      contents,
      totalCount: contents.length,
      offset: 0,
      limit: contents.length,
    };
  } catch (error) {
    console.error("getAllBooks failed:", error);
    return { contents: [], totalCount: 0, offset: 0, limit: 0 };
  }
};

export const getBook = async (contentId: string) => {
  try {
    if (!contentId || contentId === "null" || contentId === "undefined") {
      throw new Error("Invalid content ID");
    }

    const allProducts = await fetchProducts();
    const product = allProducts.find((item) => item.id === contentId);
    if (!product) {
      return null;
    }

    const variants = await fetchVariants();
    const productVariants = variants
      .filter((variant) => getProductRefId(variant.product_id) === contentId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return {
      ...product,
      variants: productVariants,
    } as ProductWithVariants;
  } catch (error) {
    console.error("getBook failed:", error);
    return null;
  }
};
