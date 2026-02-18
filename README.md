# TTC_Note_Store

卒業制作向けに、既存の `book-commerce-app-with-shincodecamp` をベースとして引き継ぎ、ノート機能とECストア/LPへ拡張するプロジェクトです。

## ベース

- Source repository: `sui1994/book-commerce-app-with-shincodecamp`
- Target repository: `sui1994/TTC_Note_Store`

## 運用メモ

- `src/lib/stripe.ts` の Stripe クライアントはプロセス内シングルトンです。
- 同一プロセスで `STRIPE_SECRET_KEY` を実行中に変更しても、既存インスタンスが再利用されます。
- Vercel のようなデプロイ単位で再起動される環境では通常問題になりません。
- 長時間稼働サーバーでキー変更を反映する場合は、アプリケーション再起動が必要です。
