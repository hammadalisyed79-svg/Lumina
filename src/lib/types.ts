export type Product = {
  id: number;
  shopifyId: string;
  handle: string;
  title: string;
  fullTitle: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  compareAt: number | null;
  currency: string;
  image: string | null;
  images: string[];
  available: boolean;
  vendor: string;
  featured: boolean;
};
