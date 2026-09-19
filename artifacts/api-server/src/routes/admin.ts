import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, orderItemsTable, ordersTable, productsTable, categoriesTable } from "@workspace/db";
import { GetAdminSummaryResponse } from "@workspace/api-zod";
import { getOrderPayload, mapProduct } from "../lib/store";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/admin/summary", requireAuth, async (_req, res): Promise<void> => {
  const [orders, orderItems, products] = await Promise.all([
    db.select().from(ordersTable).orderBy(desc(ordersTable.date)),
    db.select({ item: orderItemsTable, product: productsTable, category: categoriesTable }).from(orderItemsTable).innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id)).innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id)),
    db.select().from(productsTable),
  ]);
  const revenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
  const customerCount = new Set(orders.map((order) => order.customerEmail)).size;
  const byProduct = new Map<string, { name: string; units: number; revenue: number }>();
  for (const { item, product } of orderItems) {
    const current = byProduct.get(product.id) ?? { name: product.name, units: 0, revenue: 0 };
    current.units += item.quantity;
    current.revenue += Number(item.lineTotal);
    byProduct.set(product.id, current);
  }
  const recentOrders = await Promise.all(orders.slice(0, 5).map((order) => getOrderPayload(order.id)));
  const result = {
    totalSales: revenue,
    orders: orders.length,
    customers: customerCount,
    revenue,
    averageOrderValue: orders.length ? revenue / orders.length : 0,
    bestSellingProducts: Array.from(byProduct.values()).sort((a, b) => b.units - a.units).slice(0, 5),
    recentOrders: recentOrders.filter(Boolean),
  };
  res.json(GetAdminSummaryResponse.parse(result));
});

export default router;