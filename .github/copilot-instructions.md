# Copilot Instructions

## 言語設定

- **コメントとドキュメント**: 日本語を使用してください
- **変数名と関数名**: 英語を使用してください
- **コミットメッセージ**: 日本語を使用してください

## コーディング規約

- TypeScript を使用する
- Next.js App Router の規約に従う
- Tailwind CSS を使用する
- コンポーネントは関数型で作成する

## コメント規約

```typescript
// 良い例：日本語コメント
const fetchBooks = async () => {
  // 書籍データを取得する
  const response = await fetch("/api/books");
  return response.json();
};

// 悪い例：英語コメント
const fetchBooks = async () => {
  // Fetch book data
  const response = await fetch("/api/books");
  return response.json();
};
```

## コミットメッセージ規約

```
feat: 新機能を追加
fix: バグを修正
docs: ドキュメントを更新
style: コードフォーマットを修正
refactor: リファクタリング
test: テストを追加・修正
chore: その他の変更
```

## PR・Issue 規約

- タイトルと説明は日本語で記述する
- 技術的な詳細も日本語で説明する
- コードブロック内のコメントも日本語を使用する

## ファイル構成

```
src/
  app/
    components/     # 再利用可能なコンポーネント
    (pages)/       # ページコンポーネント
  lib/             # ユーティリティ関数
  types/           # TypeScript型定義
```

## 推奨事項

- エラーメッセージは日本語で表示する
- ユーザー向けのテキストは日本語を使用する
- ログメッセージも日本語で記録する
- API のレスポンスメッセージも日本語を含める
