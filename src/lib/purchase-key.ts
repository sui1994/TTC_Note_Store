type PurchaseKeyParts = {
  productId: string | null;
  variantId: string | null;
};

// productIdとvariantIdを「::」で結合し、後方互換の購入キー文字列を生成する。
export const buildPurchaseKey = (productId: string, variantId: string) => `${productId}::${variantId}`;

// 購入キー文字列を分解し、productIdとvariantIdを取り出す。
export const parsePurchaseKey = (purchaseKey: string | null | undefined): PurchaseKeyParts => {
  if (!purchaseKey) {
    return { productId: null, variantId: null };
  }

  const [productId, variantId] = purchaseKey.split("::");
  return {
    productId: productId || null,
    variantId: variantId || null,
  };
};

export const resolvePurchaseParts = (purchase: {
  productId?: string | null;
  variantId?: string | null;
  bookId?: string | null;
}): PurchaseKeyParts => {
  // 新カラムがあればそれを優先し、なければ旧bookId形式を解析する。
  if (purchase.productId && purchase.variantId) {
    return {
      productId: purchase.productId,
      variantId: purchase.variantId,
    };
  }

  return parsePurchaseKey(purchase.bookId);
};
