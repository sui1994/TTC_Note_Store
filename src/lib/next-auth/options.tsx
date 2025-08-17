import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

// 環境変数のデバッグログ
console.log("NextAuth Environment Check:", {
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL_EXISTS: !!process.env.NEXTAUTH_URL,
  GITHUB_ID_EXISTS: !!process.env.GITHUB_ID,
  GITHUB_SECRET_EXISTS: !!process.env.GITHUB_SECRET,
});

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
    async signOut() {
      // セッション削除時のエラーハンドリング
      try {
        await prisma.$disconnect();
      } catch (error) {
        console.error("Error disconnecting Prisma:", error);
      }
    },
  },
};
