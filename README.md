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

## 購入データのデバッグ運用

`prisma studio` が環境制約で起動しない場合でも、CLIで購入データを確認/削除できます。

- 一覧確認: `npm run purchase:list -- 30`
- 全削除: `npm run purchase:clear`
- ユーザー単位削除: `npm run purchase:clear:user -- <userId> --yes`
- 1件削除: `npm run purchase:clear:id -- <purchaseId> --yes`

削除系コマンドは誤操作防止のため `--yes` が必須です。
