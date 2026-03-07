import { NextResponse } from "next/server";
import { getStoreCatalogRepository } from "@/app/store/repositories";

export async function GET() {
  try {
    const repository = getStoreCatalogRepository();
    const products = await repository.listProducts();
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("GET /api/store/catalog failed:", error);
    return NextResponse.json({ error: "商品情報の取得に失敗しました" }, { status: 500 });
  }
}

