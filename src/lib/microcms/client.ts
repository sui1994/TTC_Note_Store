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
].filter((endpoint): endpoint is string => endpoint !== undefined && endpoint !== null);

const VARIANTS_ENDPOINT = process.env.MICROCMS_VARIANTS_ENDPOINT || "variants";
const LIST_PAGE_LIMIT = Number(process.env.MICROCMS_LIST_LIMIT || 100);
const CONTENT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const FILTER_CHUNK_SIZE = Number(process.env.MICROCMS_FILTER_CHUNK_SIZE || 20);

const getProductRefId = (productRef: VariantType["product_id"]) => {
  if (typeof productRef === "string") return productRef;
  return productRef?.id;
};

const chunkArray = <T>(values: T[], chunkSize: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < values.length; i += chunkSize) {
    chunks.push(values.slice(i, i + chunkSize));
  }
  return chunks;
};

const normalizeProductIds = (productIds: string[]) =>
  Array.from(new Set(productIds.filter((id) => CONTENT_ID_PATTERN.test(id))));

const buildOrEqualsFilter = (field: string, values: string[]) => values.map((value) => `${field}[equals]${value}`).join("[or]");

type FetchListOptions = {
  endpoint: string;
  filters?: string;
  orders?: string;
  limit?: number;
};

const fetchAllContents = async <T>({ endpoint, filters, orders, limit = LIST_PAGE_LIMIT }: FetchListOptions): Promise<T[]> => {
  const client = createMicrocmsClient();
  if (!client) return [];

  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 100;
  const contents: T[] = [];
  let offset = 0;

  while (true) {
    const response = await client.getList<T>({
      endpoint,
      queries: {
        filters,
        orders,
        limit: normalizedLimit,
        offset,
      },
      customRequestInit: {
        cache: "no-store",
      },
    });

    contents.push(...response.contents);
    offset += response.contents.length;

    if (response.contents.length === 0 || offset >= response.totalCount) {
      break;
    }
  }

  return contents;
};

const fetchProductsFromEndpoint = async (endpoint: string) => {
  return fetchAllContents<ProductType>({
    endpoint,
    filters: "is_active[equals]true",
  });
};

const fetchProductsByIdsFromEndpoint = async (endpoint: string, productIds: string[]) => {
  const chunks = chunkArray(productIds, FILTER_CHUNK_SIZE);
  const products: ProductType[] = [];

  for (const ids of chunks) {
    const filters = buildOrEqualsFilter("id", ids);
    const chunkProducts = await fetchAllContents<ProductType>({
      endpoint,
      filters,
    });
    products.push(...chunkProducts);
  }

  return products.filter((product) => product.is_active);
};

const fetchProducts = async () => {
  for (const endpoint of PRODUCTS_ENDPOINT_CANDIDATES) {
    try {
      return await fetchProductsFromEndpoint(endpoint);
    } catch {
      continue;
    }
  }
  return [];
};

const fetchVariants = async (filters = "is_active[equals]true") => {
  return fetchAllContents<VariantType>({
    endpoint: VARIANTS_ENDPOINT,
    filters,
    orders: "sort_order",
  });
};

const fetchVariantsByProductIds = async (productIds: string[]) => {
  const chunks = chunkArray(productIds, FILTER_CHUNK_SIZE);
  const variants: VariantType[] = [];

  for (const ids of chunks) {
    const filters = buildOrEqualsFilter("product_id", ids);
    const chunkVariants = await fetchAllContents<VariantType>({
      endpoint: VARIANTS_ENDPOINT,
      filters,
      orders: "sort_order",
    });
    variants.push(...chunkVariants);
  }

  return variants.filter((variant) => variant.is_active);
};

const fetchProductById = async (contentId: string) => {
  const client = createMicrocmsClient();
  if (!client) return null;

  for (const endpoint of PRODUCTS_ENDPOINT_CANDIDATES) {
    try {
      return await client.get<ProductType>({
        endpoint,
        contentId,
        customRequestInit: {
          cache: "no-store",
        },
      });
    } catch {
      continue;
    }
  }

  return null;
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

export const getBooksByIds = async (productIds: string[]) => {
  try {
    const ids = normalizeProductIds(productIds);
    if (ids.length === 0) return [];

    let products: ProductType[] = [];
    for (const endpoint of PRODUCTS_ENDPOINT_CANDIDATES) {
      try {
        products = await fetchProductsByIdsFromEndpoint(endpoint, ids);
        break;
      } catch {
        continue;
      }
    }
    if (products.length === 0) return [];

    const variants = await fetchVariantsByProductIds(ids);
    const variantsByProductId = new Map<string, VariantType[]>();

    for (const variant of variants) {
      const productId = getProductRefId(variant.product_id);
      if (!productId) continue;
      const list = variantsByProductId.get(productId) || [];
      list.push(variant);
      variantsByProductId.set(productId, list);
    }

    return products.map((product) => ({
      ...product,
      variants: (variantsByProductId.get(product.id) || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    })) as ProductWithVariants[];
  } catch (error) {
    console.error("getBooksByIds failed:", error);
    return [];
  }
};

export const getBook = async (contentId: string) => {
  try {
    if (!contentId || contentId === "null" || contentId === "undefined") {
      throw new Error("Invalid content ID");
    }
    if (!CONTENT_ID_PATTERN.test(contentId)) {
      throw new Error("contentId format is invalid");
    }

    const product = await fetchProductById(contentId);
    if (!product) {
      return null;
    }

    const productVariants = await fetchVariants(`is_active[equals]true[and]product_id[equals]${contentId}`);

    return {
      ...product,
      variants: productVariants.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    } as ProductWithVariants;
  } catch (error) {
    console.error("getBook failed:", error);
    return null;
  }
};
