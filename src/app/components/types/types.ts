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



export type { BookType, Purchase, User };
