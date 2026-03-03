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

export const products: Product[] = [
  // Wellness & Vitamins
  {
    id: "vit-d3-5000",
    name: "Vitamin D3 5000 IU",
    brand: "NaturePure",
    category: "wellness",
    price: 18.99,
    description:
      "High-potency Vitamin D3 for bone health, immune support, and mood regulation. 120 softgels.",
    dosage: "1 softgel daily with food",
    rating: 4.8,
    reviews: 342,
    inStock: true,
    badge: "bestseller",
    emoji: "☀️",
  },
  {
    id: "omega-3-fish-oil",
    name: "Omega-3 Fish Oil 1000mg",
    brand: "OceanHealth",
    category: "wellness",
    price: 24.99,
    description:
      "Triple-strength EPA & DHA fish oil for heart, brain, and joint health. 90 softgels.",
    dosage: "1 softgel twice daily",
    rating: 4.7,
    reviews: 218,
    inStock: true,
    emoji: "🐟",
  },
  {
    id: "multivitamin-daily",
    name: "Complete Daily Multivitamin",
    brand: "VitaCore",
    category: "wellness",
    price: 29.99,
    originalPrice: 34.99,
    description:
      "21 essential vitamins and minerals for everyday vitality. 60 tablets.",
    dosage: "1 tablet daily with breakfast",
    rating: 4.6,
    reviews: 156,
    inStock: true,
    badge: "sale",
    emoji: "💊",
  },
  {
    id: "vitamin-c-1000",
    name: "Vitamin C 1000mg + Zinc",
    brand: "NaturePure",
    category: "wellness",
    price: 14.99,
    description:
      "Powerful antioxidant combo for immune defence. 60 effervescent tablets.",
    dosage: "1 tablet dissolved in water daily",
    rating: 4.9,
    reviews: 489,
    inStock: true,
    badge: "bestseller",
    emoji: "🍊",
  },
  // Cold & Flu
  {
    id: "cold-flu-max",
    name: "Cold & Flu Maximum Strength",
    brand: "ReliefPlus",
    category: "cold-flu",
    price: 12.49,
    description:
      "Multi-symptom relief: fever, congestion, cough, and body aches. 24 caplets.",
    dosage: "2 caplets every 6 hours",
    rating: 4.5,
    reviews: 287,
    inStock: true,
    emoji: "🤧",
  },
  {
    id: "throat-lozenges",
    name: "Honey Lemon Throat Lozenges",
    brand: "SootheCare",
    category: "cold-flu",
    price: 7.99,
    description:
      "Natural honey and lemon soothing lozenges with menthol. 30 lozenges.",
    dosage: "1 lozenge every 2 hours as needed",
    rating: 4.4,
    reviews: 132,
    inStock: true,
    emoji: "🍯",
  },
  {
    id: "nasal-spray",
    name: "Saline Nasal Spray",
    brand: "ClearBreeze",
    category: "cold-flu",
    price: 9.99,
    description:
      "Gentle isotonic saline mist for nasal congestion relief. 30ml.",
    rating: 4.6,
    reviews: 201,
    inStock: true,
    badge: "new",
    emoji: "💨",
  },
  {
    id: "cough-syrup",
    name: "Night-Time Cough Syrup",
    brand: "ReliefPlus",
    category: "cold-flu",
    price: 11.99,
    description:
      "Non-drowsy daytime formula with dextromethorphan for dry cough relief. 200ml.",
    dosage: "10ml every 4 hours",
    rating: 4.3,
    reviews: 98,
    inStock: true,
    emoji: "🌙",
  },
  // Pain Relief
  {
    id: "ibuprofen-400",
    name: "Ibuprofen 400mg",
    brand: "PainAway",
    category: "pain-relief",
    price: 8.99,
    description:
      "Fast-acting anti-inflammatory for headaches, muscle pain, and fever. 50 tablets.",
    dosage: "1 tablet every 6-8 hours with food",
    rating: 4.7,
    reviews: 523,
    inStock: true,
    badge: "bestseller",
    emoji: "💪",
  },
  {
    id: "muscle-gel",
    name: "Deep Heat Muscle Gel",
    brand: "FlexiCare",
    category: "pain-relief",
    price: 13.99,
    description:
      "Penetrating menthol and camphor gel for targeted muscle and joint relief. 100g.",
    rating: 4.5,
    reviews: 176,
    inStock: true,
    emoji: "🔥",
  },
  {
    id: "migraine-relief",
    name: "Migraine Relief Tablets",
    brand: "PainAway",
    category: "pain-relief",
    price: 15.49,
    originalPrice: 18.99,
    description:
      "Specialized formula with caffeine and paracetamol for migraine relief. 20 tablets.",
    dosage: "2 tablets at onset, repeat after 4 hours if needed",
    rating: 4.4,
    reviews: 94,
    inStock: true,
    badge: "sale",
    emoji: "🧠",
  },
  {
    id: "back-pain-patches",
    name: "Thermal Back Pain Patches",
    brand: "FlexiCare",
    category: "pain-relief",
    price: 16.99,
    description:
      "Self-heating patches providing up to 12 hours of soothing warmth. 4 patches.",
    rating: 4.6,
    reviews: 145,
    inStock: true,
    badge: "new",
    emoji: "🩹",
  },
  // Skincare
  {
    id: "sunscreen-50",
    name: "SPF 50+ Daily Sunscreen",
    brand: "DermShield",
    category: "skincare",
    price: 22.99,
    description:
      "Lightweight, non-greasy broad-spectrum UV protection. 75ml.",
    rating: 4.8,
    reviews: 312,
    inStock: true,
    badge: "bestseller",
    emoji: "🧴",
  },
  {
    id: "hyaluronic-serum",
    name: "Hyaluronic Acid Serum",
    brand: "GlowLab",
    category: "skincare",
    price: 27.99,
    description:
      "Intense hydration serum with triple-weight hyaluronic acid. 30ml.",
    rating: 4.9,
    reviews: 256,
    inStock: true,
    emoji: "💧",
  },
  {
    id: "moisturizer-daily",
    name: "Ceramide Barrier Moisturizer",
    brand: "DermShield",
    category: "skincare",
    price: 19.99,
    originalPrice: 24.99,
    description:
      "Repairs and strengthens the skin barrier with ceramides and niacinamide. 50ml.",
    rating: 4.7,
    reviews: 189,
    inStock: true,
    badge: "sale",
    emoji: "✨",
  },
  {
    id: "lip-balm",
    name: "Medicated Lip Repair Balm",
    brand: "GlowLab",
    category: "skincare",
    price: 6.99,
    description:
      "SPF 15 lip balm with shea butter and vitamin E for cracked lips. 10g.",
    rating: 4.5,
    reviews: 420,
    inStock: true,
    emoji: "👄",
  },
  // Personal Care
  {
    id: "electric-toothbrush",
    name: "Sonic Electric Toothbrush",
    brand: "BrightSmile",
    category: "personal-care",
    price: 49.99,
    description:
      "40,000 vibrations/min with 3 modes and 2-min smart timer. USB-C charging.",
    rating: 4.7,
    reviews: 178,
    inStock: true,
    badge: "new",
    emoji: "🪥",
  },
  {
    id: "hand-sanitizer",
    name: "Aloe Vera Hand Sanitizer",
    brand: "PureCare",
    category: "personal-care",
    price: 5.99,
    description:
      "70% alcohol gel with aloe vera and vitamin E. Gentle on skin. 250ml.",
    rating: 4.4,
    reviews: 345,
    inStock: true,
    emoji: "🧼",
  },
  {
    id: "dental-floss",
    name: "Expanding Mint Dental Floss",
    brand: "BrightSmile",
    category: "personal-care",
    price: 4.49,
    description:
      "Expands between teeth for thorough cleaning. Fresh mint flavour. 50m.",
    rating: 4.3,
    reviews: 87,
    inStock: true,
    emoji: "🦷",
  },
  {
    id: "deodorant-natural",
    name: "Natural Crystal Deodorant",
    brand: "PureCare",
    category: "personal-care",
    price: 11.49,
    description:
      "Aluminium-free, fragrance-free mineral deodorant. Lasts up to 24 hours. 75g.",
    rating: 4.2,
    reviews: 63,
    inStock: true,
    emoji: "🌿",
  },
  // Health Devices
  {
    id: "blood-pressure",
    name: "Digital Blood Pressure Monitor",
    brand: "VitalTech",
    category: "devices",
    price: 59.99,
    description:
      "Clinically validated upper-arm monitor with irregular heartbeat detection and 120-reading memory.",
    rating: 4.8,
    reviews: 234,
    inStock: true,
    badge: "bestseller",
    emoji: "🩺",
  },
  {
    id: "thermometer-ir",
    name: "Infrared Forehead Thermometer",
    brand: "VitalTech",
    category: "devices",
    price: 34.99,
    description:
      "Contactless 1-second reading with colour-coded fever alert. Stores 50 readings.",
    rating: 4.6,
    reviews: 189,
    inStock: true,
    emoji: "🌡️",
  },
  {
    id: "pulse-oximeter",
    name: "Fingertip Pulse Oximeter",
    brand: "VitalTech",
    category: "devices",
    price: 29.99,
    originalPrice: 39.99,
    description:
      "Measures SpO2 and pulse rate with OLED display. Lanyard and batteries included.",
    rating: 4.7,
    reviews: 312,
    inStock: true,
    badge: "sale",
    emoji: "❤️",
  },
  {
    id: "glucose-monitor",
    name: "Blood Glucose Monitoring Kit",
    brand: "VitalTech",
    category: "devices",
    price: 44.99,
    description:
      "Complete starter kit with meter, 50 test strips, lancets, and carrying case.",
    rating: 4.5,
    reviews: 156,
    inStock: true,
    emoji: "🩸",
  },
];
