export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
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
