type PurchaseKeyParts = {
  productId: string | null;
  variantId: string | null;
};

export const buildPurchaseBookId = (productId: string, variantId: string) => `${productId}::${variantId}`;

export const parsePurchaseBookId = (bookId: string | null | undefined): PurchaseKeyParts => {
  if (!bookId) {
    return { productId: null, variantId: null };
  }

  const [productId, variantId] = bookId.split("::");
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
  if (purchase.productId && purchase.variantId) {
    return {
      productId: purchase.productId,
      variantId: purchase.variantId,
    };
  }

  return parsePurchaseBookId(purchase.bookId);
};
