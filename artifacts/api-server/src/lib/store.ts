import type { Request, Response } from "express";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db, categoriesTable, productsTable, cartsTable, orderItemsTable, ordersTable } from "@workspace/db";

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  categorySlug: string;
  images: string[];
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  stock: number;
  featured: boolean;
  bestSeller: boolean;
  deal: boolean;
  badge: string | null;
  colors: string[];
  sizes: string[];
  specifications: Array<{ label: string; value: string }>;
  shipping: string;
  returnPolicy: string;
};

const money = (value: string | number) => Number(Number(value).toFixed(2));

export function mapProduct(row: typeof productsTable.$inferSelect, category: typeof categoriesTable.$inferSelect): StoreProduct {
  const originalPrice = money(row.originalPrice);
  const price = money(row.price);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: category.name,
    categorySlug: category.slug,
    images: row.images,
    price,
    originalPrice,
    discountPercent: Math.round(((originalPrice - price) / originalPrice) * 100),
    rating: money(row.rating),
    reviewCount: row.reviewCount,
    stock: row.stock,
    featured: row.featured,
    bestSeller: row.bestSeller,
    deal: row.deal,
    badge: row.badge,
    colors: row.colors,
    sizes: row.sizes,
    specifications: row.specifications,
    shipping: row.shipping,
    returnPolicy: row.returnPolicy,
  };
}

export async function listStoreProducts() {
  const rows = await db
    .select({ product: productsTable, category: categoriesTable })
    .from(productsTable)
    .innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));
  return rows.map(({ product, category }) => mapProduct(product, category));
}

export async function getStoreProduct(slug: string) {
  const [row] = await db
    .select({ product: productsTable, category: categoriesTable })
    .from(productsTable)
    .innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.slug, slug));
  return row ? mapProduct(row.product, row.category) : undefined;
}

export function getSessionId(req: Request, res: Response) {
  const existing = req.cookies?.nexora_session;
  if (existing) return existing as string;
  const sessionId = `session_${crypto.randomUUID()}`;
  res.cookie("nexora_session", sessionId, { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 30 });
  return sessionId;
}

export async function getCartPayload(sessionId: string) {
  const rows = await db
    .select({ cart: cartsTable, product: productsTable, category: categoriesTable })
    .from(cartsTable)
    .innerJoin(productsTable, eq(cartsTable.productId, productsTable.id))
    .innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(cartsTable.sessionId, sessionId))
    .orderBy(asc(cartsTable.updatedAt));
  const items = rows.map(({ cart, product, category }) => {
    const mapped = mapProduct(product, category);
    return { product: mapped, quantity: cart.quantity, lineTotal: money(mapped.price * cart.quantity) };
  });
  const subtotal = money(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const shipping = subtotal === 0 || subtotal >= 75 ? 0 : 8.95;
  const tax = money(subtotal * 0.08);
  return { items, subtotal, shipping, tax, total: money(subtotal + shipping + tax), itemCount: items.reduce((sum, item) => sum + item.quantity, 0) };
}

export async function findProductById(id: string) {
  const [row] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  return row;
}

export async function getOrderPayload(orderId: string) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return undefined;
  const items = await db
    .select({ item: orderItemsTable, product: productsTable, category: categoriesTable })
    .from(orderItemsTable)
    .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(orderItemsTable.orderId, orderId));
  return {
    id: order.id,
    date: order.date,
    status: order.status,
    shippingStatus: order.shippingStatus,
    trackingNumber: order.trackingNumber,
    items: items.map(({ item, product, category }) => ({ product: mapProduct(product, category), quantity: item.quantity, lineTotal: money(item.lineTotal) })),
    total: money(order.total),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    paymentStatus: order.paymentStatus,
    shippingAddress: order.shippingAddress,
    estimatedDelivery: order.estimatedDelivery,
  };
}

export const productFilter = (search?: string, category?: string) => {
  if (!search && !category) return undefined;
  const filters = [];
  if (search) filters.push(or(ilike(productsTable.name, `%${search}%`), ilike(productsTable.description, `%${search}%`)));
  if (category) filters.push(eq(categoriesTable.slug, category));
  return and(...filters);
};

export const productSort = (sort?: string) => {
  if (sort === "price_asc") return asc(productsTable.price);
  if (sort === "price_desc") return desc(productsTable.price);
  if (sort === "rating") return desc(productsTable.rating);
  if (sort === "newest") return desc(productsTable.createdAt);
  return desc(productsTable.featured);
};