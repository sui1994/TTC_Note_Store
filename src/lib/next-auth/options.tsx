import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import { SessionCallbackParams, RedirectCallbackParams } from "@/app/components/types/types";

export const nextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database" as const,
    maxAge: 30 * 24 * 60 * 60, // 30日間
    updateAge: 24 * 60 * 60, // 24時間
  },
  callbacks: {
    session: ({ session, user }: SessionCallbackParams) => {
      return {
        ...session,
        user: { ...session.user, id: user.id },
      };
    },
    async redirect({ url, baseUrl }: RedirectCallbackParams) {
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
    async signOut() {
      // セッション削除時のエラーハンドリング
      try {
        await prisma.$disconnect();
      } catch (error) {
        console.error("Prismaの切断中にエラーが発生しました:", error);
      }
    },
  },
};
