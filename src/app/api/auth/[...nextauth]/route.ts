import NextAuth from "next-auth/next";
import { assertOAuthProvidersConfigured, nextAuthOptions } from "@/lib/next-auth/options";

type NextAuthHandler = ReturnType<typeof NextAuth>;

const getNextAuthHandler = (): NextAuthHandler => {
  assertOAuthProvidersConfigured();
  return NextAuth(nextAuthOptions);
};

export const GET = (...args: Parameters<NextAuthHandler>) => getNextAuthHandler()(...args);
export const POST = (...args: Parameters<NextAuthHandler>) => getNextAuthHandler()(...args);
