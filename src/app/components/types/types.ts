type BookType = {
  id: string;
  title: string;
  price: number;
  thumbnail: {
    url: string;
  };
  author: {
    id: number;
    name: string;
    description: string;
    profile_icon: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
};

type Purchase = {
  id: string;
  userId: string;
  bookId: string;
  createdAt: string;
};

type User = {
  id: string;
  name?: string | null | undefined;
  email?: string | null | undefined;
  image?: string | null | undefined;
};

// NextAuth関連の型定義
type NextAuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type NextAuthSession = {
  expires: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

type AuthenticatedSession = {
  expires: string;
  user: NextAuthUser;
};

type SessionCallbackParams = {
  session: NextAuthSession;
  user: { id: string };
};

type RedirectCallbackParams = {
  url: string;
  baseUrl: string;
};

export type { BookType, Purchase, User, NextAuthUser, NextAuthSession, AuthenticatedSession, SessionCallbackParams, RedirectCallbackParams };
