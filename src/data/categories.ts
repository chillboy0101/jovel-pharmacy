export type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const categories: Category[] = [
  {
    id: "prescription-only-medicine-pom",
    name: "Prescription Only Medicine (PoM)",
    description: "Prescription Only Medicine (PoM)",
    icon: "Sparkles",
  },
  {
    id: "over-the-counter-medicine-otc",
    name: "Over The Counter Medicine (OTC)",
    description: "Over The Counter Medicine (OTC)",
    icon: "Sparkles",
  },
  {
    id: "vitamins-and-supplements",
    name: "Vitamins and Supplements",
    description: "Vitamins and Supplements",
    icon: "Sparkles",
  },
  {
    id: "skin-care",
    name: "Skin Care",
    description: "Skin Care",
    icon: "Sparkles",
  },
  {
    id: "sexual-wellness",
    name: "Sexual Wellness",
    description: "Sexual Wellness",
    icon: "Sparkles",
  },
  {
    id: "personal-care",
    name: "Personal Care",
    description: "Modern hygiene, oral care, and daily comfort.",
    icon: "Heart",
  },
];
