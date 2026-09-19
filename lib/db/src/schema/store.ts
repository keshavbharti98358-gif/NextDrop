import { boolean, integer, jsonb, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoriesTable = pgTable("nexora_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  image: text("image").notNull(),
});

export const productsTable = pgTable("nexora_products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  categoryId: text("category_id").notNull().references(() => categoriesTable.id),
  images: text("images").array().notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }).notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull().default("4.5"),
  reviewCount: integer("review_count").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  bestSeller: boolean("best_seller").notNull().default(false),
  deal: boolean("deal").notNull().default(false),
  badge: text("badge"),
  colors: text("colors").array().notNull().default([]),
  sizes: text("sizes").array().notNull().default([]),
  specifications: jsonb("specifications").$type<Array<{ label: string; value: string }>>().notNull().default([]),
  shipping: text("shipping").notNull(),
  returnPolicy: text("return_policy").notNull(),
  supplierId: text("supplier_id").notNull().default("mock-supplier"),
  supplierProductId: text("supplier_product_id").notNull(),
  supplierCost: numeric("supplier_cost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartsTable = pgTable("nexora_carts", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  productId: text("product_id").notNull().references(() => productsTable.id),
  quantity: integer("quantity").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ordersTable = pgTable("nexora_orders", {
  id: text("id").primaryKey(),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("confirmed"),
  shippingStatus: text("shipping_status").notNull().default("Preparing"),
  trackingNumber: text("tracking_number"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  paymentStatus: text("payment_status").notNull().default("paid"),
  shippingAddress: text("shipping_address").notNull(),
  estimatedDelivery: text("estimated_delivery").notNull(),
});

export const orderItemsTable = pgTable("nexora_order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => ordersTable.id),
  productId: text("product_id").notNull().references(() => productsTable.id),
  quantity: integer("quantity").notNull(),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable);
export const insertProductSchema = createInsertSchema(productsTable);
export type Category = typeof categoriesTable.$inferSelect;
export type Product = typeof productsTable.$inferSelect;
export type CartRow = typeof cartsTable.$inferSelect;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;