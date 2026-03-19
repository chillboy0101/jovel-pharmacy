export type Product = {
  id: string;
  name: string;
  category: string;
  originalPrice?: number;
  description: string;
  dosage?: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  badge?: "bestseller" | "new" | "sale";
  emoji: string;
};

export const products: Product[] = [];
