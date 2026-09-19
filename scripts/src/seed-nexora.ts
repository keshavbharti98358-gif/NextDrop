import { db, categoriesTable, productsTable } from "@workspace/db";

const categories = [
  { id: "cat-tech", name: "Tech & Gadgets", slug: "tech-gadgets", description: "Smart tools for a more capable everyday.", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85" },
  { id: "cat-home", name: "Home & Kitchen", slug: "home-kitchen", description: "Quiet upgrades for the spaces you live in.", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85" },
  { id: "cat-fitness", name: "Fitness", slug: "fitness", description: "Move better, wherever you are.", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85" },
];

const products = [
  { id: "p-cube", slug: "smart-cube", name: "OrbitCharge 3-in-1 Charging Cube", description: "A compact charging station that keeps your desk calm and your devices ready.", categoryId: "cat-tech", images: ["https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=85"], price: "49", originalPrice: "69", rating: "4.8", reviewCount: 128, stock: 42, featured: true, bestSeller: true, deal: true, badge: "Best seller", colors: ["Cloud", "Graphite"], sizes: [], specifications: [], shipping: "Free shipping over $75 · Dispatches in 24 hours", returnPolicy: "30-day easy returns", supplierProductId: "supplier-orbit-cube", supplierCost: "18.5" },
  { id: "p-lamp", slug: "halo-table-lamp", name: "Halo Ambient Table Lamp", description: "Soft, adjustable light for late work sessions, slow mornings, and everything between.", categoryId: "cat-home", images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85"], price: "39", originalPrice: "58", rating: "4.7", reviewCount: 94, stock: 28, featured: true, bestSeller: false, deal: true, badge: "New drop", colors: ["Sand", "Ink"], sizes: [], specifications: [], shipping: "Free shipping over $75 · Dispatches in 24 hours", returnPolicy: "30-day easy returns", supplierProductId: "supplier-halo-lamp", supplierCost: "15" },
  { id: "p-massager", slug: "pulse-mini-massager", name: "Pulse Mini Massage Gun", description: "Targeted relief in a pocket-size form, with four speeds and almost no noise.", categoryId: "cat-fitness", images: ["https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=85"], price: "59", originalPrice: "89", rating: "4.9", reviewCount: 212, stock: 17, featured: false, bestSeller: true, deal: true, badge: "20% off", colors: ["Black", "Stone"], sizes: [], specifications: [], shipping: "Free shipping · Dispatches in 24 hours", returnPolicy: "30-day easy returns", supplierProductId: "supplier-pulse-mini", supplierCost: "24" },
];

await db.insert(categoriesTable).values(categories).onConflictDoNothing();
await db.insert(productsTable).values(products).onConflictDoNothing();
process.stdout.write(`Seeded ${categories.length} categories and ${products.length} products.\n`);