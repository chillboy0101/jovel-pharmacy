export type Product = {
  id: string;
  name: string;
  categoryId: string;
  originalPrice: number | null;
  discountPercent: number;
  costPrice: number;
  description: string;
  dosage: string | null;
  rating: number;
  reviews: number;
  stock: number;
  badge: string | null;
  emoji: string;
  imageUrl: string | null;
  expiryDate: string | null;
  sourceSlug?: string | null;
  sourceUrl?: string | null;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
};
