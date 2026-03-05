import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import LineProvider from "next-auth/providers/line";
import { prisma } from "@/lib/prisma";
import { SessionCallbackParams, RedirectCallbackParams } from "@/app/components/types/types";

let hasWarnedAuthConfig = false;

const getProviderBuildResult = () => {
  const missingProviders: string[] = [];
  const githubProvider =
    process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? GithubProvider({
          clientId: process.env.GITHUB_ID,
          clientSecret: process.env.GITHUB_SECRET,
        })
      : null;
  if (!githubProvider) {
    missingProviders.push("GitHub(GITHUB_ID/GITHUB_SECRET)");
  }

  const googleProvider =
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
      : null;
  if (!googleProvider) {
    missingProviders.push("Google(GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET)");
  }

  const lineProvider =
    process.env.LINE_CLIENT_ID && process.env.LINE_CLIENT_SECRET
      ? LineProvider({
          clientId: process.env.LINE_CLIENT_ID,
          clientSecret: process.env.LINE_CLIENT_SECRET,
        })
      : null;
  if (!lineProvider) {
    missingProviders.push("LINE(LINE_CLIENT_ID/LINE_CLIENT_SECRET)");
  }

  const providers = [githubProvider, googleProvider, lineProvider].filter((provider) => provider !== null);

  if (!hasWarnedAuthConfig && missingProviders.length > 0) {
    hasWarnedAuthConfig = true;
    console.warn(`OAuth provider の設定不足を検知: ${missingProviders.join(", ")}`);
  }

  return { providers, missingProviders };
};

export const assertOAuthProvidersConfigured = () => {
  const { providers, missingProviders } = getProviderBuildResult();

  if (providers.length > 0) {
    return;
  }

  throw new Error(
    `OAuth provider が1つも設定されていません。少なくとも1つの provider 環境変数を設定してください。未設定: ${missingProviders.join(", ")}`,
  );
};

export const nextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: getProviderBuildResult().providers,
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
