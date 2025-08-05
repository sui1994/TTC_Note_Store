# Next.js Book Commerce App

## 概要

Udemy コース「しんコードキャンプ」で学習する Next.js を使用した書籍 EC サイトです。

## 技術スタック

- Next.js
- React
- TypeScript
- Tailwind CSS
- Prisma (データベース)

## 機能

- 書籍一覧表示
- 書籍詳細表示
- ショッピングカート
- ユーザー認証
- 決済機能

## セットアップ

### 前提条件

- Node.js 18.0 以上
- npm または yarn

### インストール

```bash
npm install
# または
yarn install
```

### 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認してください。

## プロジェクト構成

```
next-udemy-book-commerce-app-with-shincodecamp/
├── components/          # Reactコンポーネント
├── pages/              # Next.jsページ
├── public/             # 静的ファイル
├── styles/             # スタイルファイル
├── IMG/                # 画像アセット
└── README.md           # このファイル
```

## 学習内容

- Next.js の基本概念
- React コンポーネントの作成
- TypeScript の使用
- データベース連携
- 認証システムの実装

## ブランチ情報

- `feature/add-header-component-and-integrate-into-layout`: ヘッダーコンポーネント追加
