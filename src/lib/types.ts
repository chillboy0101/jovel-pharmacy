export type Product = {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  originalPrice: number | null;
  description: string;
  dosage: string | null;
  rating: number;
  reviews: number;
  stock: number;
  badge: string | null;
  emoji: string;
  imageUrl: string | null;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
};
