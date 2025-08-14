import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

export const nextAuthOptions: NextAuthOptions = {
  debug: false,
  logger: {
    error: () => {}, // エラーログを無視
    warn: () => {}, // 警告ログを無視
    debug: () => {}, // デバッグログを無視
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    session: ({ session, user }) => {
      return {
        ...session,
        user: { ...session.user, id: user.id },
      };
    },
  },
};
