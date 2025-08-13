type BookType = {
  id: number;
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

export type { BookType };