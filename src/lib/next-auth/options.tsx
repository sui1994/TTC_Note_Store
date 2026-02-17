import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Provider } from "next-auth/providers/index";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import LineProvider from "next-auth/providers/line";
import { prisma } from "@/lib/prisma";
import { SessionCallbackParams, RedirectCallbackParams } from "@/app/components/types/types";

let hasWarnedAuthConfig = false;

const buildProviders = (): Provider[] => {
  const providers: Provider[] = [];
  const missingProviders: string[] = [];

  if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push(
      GithubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      }),
    );
  } else {
    missingProviders.push("GitHub(GITHUB_ID/GITHUB_SECRET)");
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  } else {
    missingProviders.push("Google(GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET)");
  }

  if (process.env.LINE_CLIENT_ID && process.env.LINE_CLIENT_SECRET) {
    providers.push(
      LineProvider({
        clientId: process.env.LINE_CLIENT_ID,
        clientSecret: process.env.LINE_CLIENT_SECRET,
      }),
    );
  } else {
    missingProviders.push("LINE(LINE_CLIENT_ID/LINE_CLIENT_SECRET)");
  }

  if (!hasWarnedAuthConfig && missingProviders.length > 0) {
    hasWarnedAuthConfig = true;
    console.warn(`OAuth provider config is missing for: ${missingProviders.join(", ")}`);
  }

  return providers;
};

export const nextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: buildProviders(),
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
