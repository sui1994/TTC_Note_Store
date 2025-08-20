import { getBook } from "@/lib/microcms/client";
import Image from "next/image";
import React from "react";

// ビルド時エラーを回避するため、動的レンダリングを強制
export const dynamic = "force-dynamic";

const DetailBook = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  if (!id) {
    return <div>書籍IDが見つかりません</div>;
  }

  try {
    const book = await getBook(id);

    if (!book) {
      return <div>書籍が見つかりません</div>;
    }

    return (
      <div className="container mx-auto p-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <Image className="w-full h-80 object-cover object-center" src={book.thumbnail.url} alt={book.title} width={700} height={700} />
          <div className="p-4">
            <h2 className="text-2xl font-bold">{book.title}</h2>
            <div className="text-gray-700 mt-2" dangerouslySetInnerHTML={{ __html: book.content }} />

            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">公開日: {new Date(book.createdAt).toLocaleString()}</span>
              <span className="text-sm text-gray-500">最終更新: {new Date(book.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-red-800">書籍の詳細を読み込めませんでした。</h2>
          <p className="text-red-600 mt-2">設定を確認してもう一度お試しください。</p>
        </div>
      </div>
    );
  }
};

export default DetailBook;
