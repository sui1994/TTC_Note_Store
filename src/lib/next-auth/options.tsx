import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

export const nextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    session: ({ session, user }: { session: { expires: string; user?: { name?: string | null; email?: string | null; image?: string | null } }; user: { id: string } }) => {
      return {
        ...session,
        user: { ...session.user, id: user.id },
      };
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // 認証後は常にホームページにリダイレクト
      if (url.startsWith("/login")) {
        return baseUrl;
      }
      // 相対URLの場合はbaseUrlと結合
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // 同じオリジンの場合はそのまま
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // それ以外はホームページ
      return baseUrl;
    },
  },
  events: {
    async signOut({ session }: { session?: any }) {
      try {
        // データベースセッション戦略を使用している場合、セッションは自動的に削除される
        // 追加のクリーンアップが必要な場合はここに実装

        if (process.env.NODE_ENV === "development") {
          console.log("User signed out:", session?.user?.email || "Unknown user");
        }

        // 必要に応じて追加のクリーンアップ処理
        // 例: キャッシュのクリア、ログの記録など
      } catch (error) {
        console.error("Error during sign out:", error);
        // サインアウト処理でエラーが発生してもユーザーの操作は継続させる
      }
    },
  },
};
