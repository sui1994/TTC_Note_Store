import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const isDevelopment = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "ヘルスチェック処理中にエラーが発生しました",
        ...(isDevelopment ? { details: error instanceof Error ? error.message : String(error) } : {}),
      },
      { status: 500 }
    );
  }
}
