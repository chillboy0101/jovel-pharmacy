export type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export const categories: Category[] = [
  {
    id: "wellness",
    name: "Wellness & Vitamins",
    description: "Daily essentials for energy, immunity, and balance.",
    icon: "Sparkles",
  },
  {
    id: "cold-flu",
    name: "Cold & Flu",
    description: "Relief you can trust when you need it most.",
    icon: "ShieldPlus",
  },
  {
    id: "pain-relief",
    name: "Pain Relief",
    description: "Fast-acting solutions for aches and inflammation.",
    icon: "Activity",
  },
  {
    id: "skincare",
    name: "Skincare",
    description: "Dermatologist-inspired care for healthy skin.",
    icon: "Droplet",
  },
  {
    id: "personal-care",
    name: "Personal Care",
    description: "Modern hygiene, oral care, and daily comfort.",
    icon: "Heart",
  },
  {
    id: "devices",
    name: "Health Devices",
    description: "Premium tools for monitoring and peace of mind.",
    icon: "Stethoscope",
  },
];
