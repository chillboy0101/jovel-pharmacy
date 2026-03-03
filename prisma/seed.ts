import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Admin user ---
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@jovelpharmacy.com" },
    update: {},
    create: {
      email: "admin@jovelpharmacy.com",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✓ Admin user seeded (admin@jovelpharmacy.com / admin123)");

  // --- Categories ---
  const categories = [
    { id: "wellness", name: "Wellness & Vitamins", description: "Daily essentials for energy, immunity, and balance.", icon: "Sparkles" },
    { id: "cold-flu", name: "Cold & Flu", description: "Relief you can trust when you need it most.", icon: "ShieldPlus" },
    { id: "pain-relief", name: "Pain Relief", description: "Fast-acting solutions for aches and inflammation.", icon: "Activity" },
    { id: "skincare", name: "Skincare", description: "Dermatologist-inspired care for healthy skin.", icon: "Droplet" },
    { id: "personal-care", name: "Personal Care", description: "Modern hygiene, oral care, and daily comfort.", icon: "Heart" },
    { id: "devices", name: "Health Devices", description: "Premium tools for monitoring and peace of mind.", icon: "Stethoscope" },
  ];

  function computeDiscountPercent(price: number, originalPrice?: number | null) {
    if (!originalPrice || originalPrice <= 0) return 0;
    if (!price || price <= 0) return 0;
    const pct = ((originalPrice - price) / originalPrice) * 100;
    if (!Number.isFinite(pct) || pct <= 0) return 0;
    return Math.round(pct);
  }

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, description: cat.description, icon: cat.icon },
      create: cat,
    });
  }
  console.log(`✓ ${categories.length} categories seeded`);

  // --- Products ---
  const products = [
    // Wellness & Vitamins
    { id: "vit-d3-5000", name: "Vitamin D3 5000 IU", brand: "NaturePure", categoryId: "wellness", price: 18.99, description: "High-potency Vitamin D3 for bone health, immune support, and mood regulation. 120 softgels.", dosage: "1 softgel daily with food", rating: 4.8, reviews: 342, stock: 150, badge: "bestseller", emoji: "☀️" },
    { id: "omega-3-fish-oil", name: "Omega-3 Fish Oil 1000mg", brand: "OceanHealth", categoryId: "wellness", price: 24.99, description: "Triple-strength EPA & DHA fish oil for heart, brain, and joint health. 90 softgels.", dosage: "1 softgel twice daily", rating: 4.7, reviews: 218, stock: 80, emoji: "🐟" },
    { id: "multivitamin-daily", name: "Complete Daily Multivitamin", brand: "VitaCore", categoryId: "wellness", price: 29.99, originalPrice: 34.99, description: "21 essential vitamins and minerals for everyday vitality. 60 tablets.", dosage: "1 tablet daily with breakfast", rating: 4.6, reviews: 156, stock: 120, badge: "sale", emoji: "💊" },
    { id: "vitamin-c-1000", name: "Vitamin C 1000mg + Zinc", brand: "NaturePure", categoryId: "wellness", price: 14.99, description: "Powerful antioxidant combo for immune defence. 60 effervescent tablets.", dosage: "1 tablet dissolved in water daily", rating: 4.9, reviews: 489, stock: 200, badge: "bestseller", emoji: "🍊" },
    // Cold & Flu
    { id: "cold-flu-max", name: "Cold & Flu Maximum Strength", brand: "ReliefPlus", categoryId: "cold-flu", price: 12.49, description: "Multi-symptom relief: fever, congestion, cough, and body aches. 24 caplets.", dosage: "2 caplets every 6 hours", rating: 4.5, reviews: 287, stock: 100, emoji: "🤧" },
    { id: "throat-lozenges", name: "Honey Lemon Throat Lozenges", brand: "SootheCare", categoryId: "cold-flu", price: 7.99, description: "Natural honey and lemon soothing lozenges with menthol. 30 lozenges.", dosage: "1 lozenge every 2 hours as needed", rating: 4.4, reviews: 132, stock: 90, emoji: "🍯" },
    { id: "nasal-spray", name: "Saline Nasal Spray", brand: "ClearBreeze", categoryId: "cold-flu", price: 9.99, description: "Gentle isotonic saline mist for nasal congestion relief. 30ml.", rating: 4.6, reviews: 201, stock: 75, badge: "new", emoji: "💨" },
    { id: "cough-syrup", name: "Night-Time Cough Syrup", brand: "ReliefPlus", categoryId: "cold-flu", price: 11.99, description: "Non-drowsy daytime formula with dextromethorphan for dry cough relief. 200ml.", dosage: "10ml every 4 hours", rating: 4.3, reviews: 98, stock: 60, emoji: "🌙" },
    // Pain Relief
    { id: "ibuprofen-400", name: "Ibuprofen 400mg", brand: "PainAway", categoryId: "pain-relief", price: 8.99, description: "Fast-acting anti-inflammatory for headaches, muscle pain, and fever. 50 tablets.", dosage: "1 tablet every 6-8 hours with food", rating: 4.7, reviews: 523, stock: 180, badge: "bestseller", emoji: "💪" },
    { id: "muscle-gel", name: "Deep Heat Muscle Gel", brand: "FlexiCare", categoryId: "pain-relief", price: 13.99, description: "Penetrating menthol and camphor gel for targeted muscle and joint relief. 100g.", rating: 4.5, reviews: 176, stock: 65, emoji: "🔥" },
    { id: "migraine-relief", name: "Migraine Relief Tablets", brand: "PainAway", categoryId: "pain-relief", price: 15.49, originalPrice: 18.99, description: "Specialized formula with caffeine and paracetamol for migraine relief. 20 tablets.", dosage: "2 tablets at onset, repeat after 4 hours if needed", rating: 4.4, reviews: 94, stock: 55, badge: "sale", emoji: "🧠" },
    { id: "back-pain-patches", name: "Thermal Back Pain Patches", brand: "FlexiCare", categoryId: "pain-relief", price: 16.99, description: "Self-heating patches providing up to 12 hours of soothing warmth. 4 patches.", rating: 4.6, reviews: 145, stock: 70, badge: "new", emoji: "🩹" },
    // Skincare
    { id: "sunscreen-50", name: "SPF 50+ Daily Sunscreen", brand: "DermShield", categoryId: "skincare", price: 22.99, description: "Lightweight, non-greasy broad-spectrum UV protection. 75ml.", rating: 4.8, reviews: 312, stock: 130, badge: "bestseller", emoji: "🧴" },
    { id: "hyaluronic-serum", name: "Hyaluronic Acid Serum", brand: "GlowLab", categoryId: "skincare", price: 27.99, description: "Intense hydration serum with triple-weight hyaluronic acid. 30ml.", rating: 4.9, reviews: 256, stock: 85, emoji: "💧" },
    { id: "moisturizer-daily", name: "Ceramide Barrier Moisturizer", brand: "DermShield", categoryId: "skincare", price: 19.99, originalPrice: 24.99, description: "Repairs and strengthens the skin barrier with ceramides and niacinamide. 50ml.", rating: 4.7, reviews: 189, stock: 95, badge: "sale", emoji: "✨" },
    { id: "lip-balm", name: "Medicated Lip Repair Balm", brand: "GlowLab", categoryId: "skincare", price: 6.99, description: "SPF 15 lip balm with shea butter and vitamin E for cracked lips. 10g.", rating: 4.5, reviews: 420, stock: 160, emoji: "👄" },
    // Personal Care
    { id: "electric-toothbrush", name: "Sonic Electric Toothbrush", brand: "BrightSmile", categoryId: "personal-care", price: 49.99, description: "40,000 vibrations/min with 3 modes and 2-min smart timer. USB-C charging.", rating: 4.7, reviews: 178, stock: 40, badge: "new", emoji: "🪥" },
    { id: "hand-sanitizer", name: "Aloe Vera Hand Sanitizer", brand: "PureCare", categoryId: "personal-care", price: 5.99, description: "70% alcohol gel with aloe vera and vitamin E. Gentle on skin. 250ml.", rating: 4.4, reviews: 345, stock: 200, emoji: "🧼" },
    { id: "dental-floss", name: "Expanding Mint Dental Floss", brand: "BrightSmile", categoryId: "personal-care", price: 4.49, description: "Expands between teeth for thorough cleaning. Fresh mint flavour. 50m.", rating: 4.3, reviews: 87, stock: 110, emoji: "🦷" },
    { id: "deodorant-natural", name: "Natural Crystal Deodorant", brand: "PureCare", categoryId: "personal-care", price: 11.49, description: "Aluminium-free, fragrance-free mineral deodorant. Lasts up to 24 hours. 75g.", rating: 4.2, reviews: 63, stock: 50, emoji: "🌿" },
    // Health Devices
    { id: "blood-pressure", name: "Digital Blood Pressure Monitor", brand: "VitalTech", categoryId: "devices", price: 59.99, description: "Clinically validated upper-arm monitor with irregular heartbeat detection and 120-reading memory.", rating: 4.8, reviews: 234, stock: 35, badge: "bestseller", emoji: "🩺" },
    { id: "thermometer-ir", name: "Infrared Forehead Thermometer", brand: "VitalTech", categoryId: "devices", price: 34.99, description: "Contactless 1-second reading with colour-coded fever alert. Stores 50 readings.", rating: 4.6, reviews: 189, stock: 45, emoji: "🌡️" },
    { id: "pulse-oximeter", name: "Fingertip Pulse Oximeter", brand: "VitalTech", categoryId: "devices", price: 29.99, originalPrice: 39.99, description: "Measures SpO2 and pulse rate with OLED display. Lanyard and batteries included.", rating: 4.7, reviews: 312, stock: 55, badge: "sale", emoji: "❤️" },
    { id: "glucose-monitor", name: "Blood Glucose Monitoring Kit", brand: "VitalTech", categoryId: "devices", price: 44.99, description: "Complete starter kit with meter, 50 test strips, lancets, and carrying case.", rating: 4.5, reviews: 156, stock: 30, emoji: "🩸" },
  ];

  for (const product of products) {
    const discountPercent = computeDiscountPercent(product.price, product.originalPrice);
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        brand: product.brand,
        categoryId: product.categoryId,
        price: product.price,
        originalPrice: product.originalPrice ?? null,
        discountPercent,
        description: product.description,
        dosage: product.dosage ?? null,
        rating: product.rating,
        reviews: product.reviews,
        stock: product.stock,
        badge: product.badge ?? null,
        emoji: product.emoji,
      },
      create: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        categoryId: product.categoryId,
        price: product.price,
        originalPrice: product.originalPrice ?? null,
        discountPercent,
        description: product.description,
        dosage: product.dosage ?? null,
        rating: product.rating,
        reviews: product.reviews,
        stock: product.stock,
        badge: product.badge ?? null,
        emoji: product.emoji,
      },
    });
  }
  console.log(`✓ ${products.length} products seeded`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
