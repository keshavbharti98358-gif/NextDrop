import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, categoriesTable, productsTable } from "@workspace/db";
import {
  GetHomeResponse,
  GetProductParams,
  GetProductResponse,
  ListCategoriesResponse,
  ListProductsQueryParams,
  ListProductsResponse,
} from "@workspace/api-zod";
import { listStoreProducts, mapProduct, productSort } from "../lib/store";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
  const products = await listStoreProducts();
  const result = rows.map((category) => ({
    ...category,
    productCount: products.filter((product) => product.categorySlug === category.slug).length,
  }));
  res.json(ListCategoriesResponse.parse(result));
});

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const query = parsed.data;
  const rows = await db.select({ product: productsTable, category: categoriesTable }).from(productsTable).innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id)).orderBy(productSort(query.sort));
  let items = rows.map(({ product, category }) => mapProduct(product, category));
  const search = query.search?.toLowerCase();
  if (search) items = items.filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(search));
  if (query.category) items = items.filter((product) => product.categorySlug === query.category);
  if (query.featured !== undefined) items = items.filter((product) => product.featured === query.featured);
  if (query.bestSeller !== undefined) items = items.filter((product) => product.bestSeller === query.bestSeller);
  if (query.deal !== undefined) items = items.filter((product) => product.deal === query.deal);
  if (query.minPrice !== undefined) items = items.filter((product) => product.price >= query.minPrice!);
  if (query.maxPrice !== undefined) items = items.filter((product) => product.price <= query.maxPrice!);
  if (query.minRating !== undefined) items = items.filter((product) => product.rating >= query.minRating!);
  if (query.sort === "bestselling") items = items.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || b.reviewCount - a.reviewCount);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 12;
  const total = items.length;
  const result = { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  res.json(ListProductsResponse.parse(result));
});

router.get("/products/:slug", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select({ product: productsTable, category: categoriesTable }).from(productsTable).innerJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id)).where(eq(productsTable.slug, params.data.slug));
  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(GetProductResponse.parse(mapProduct(row.product, row.category)));
});

router.get("/storefront/home", async (_req, res): Promise<void> => {
  const [products, categories] = await Promise.all([listStoreProducts(), db.select().from(categoriesTable).orderBy(categoriesTable.name)]);
  const featuredCategories = categories.map((category) => ({ ...category, productCount: products.filter((product) => product.categorySlug === category.slug).length }));
  const result = {
    featuredCategories,
    trendingProducts: products.filter((product) => product.featured).slice(0, 4),
    bestSellers: products.filter((product) => product.bestSeller).slice(0, 4),
    deals: products.filter((product) => product.deal).slice(0, 4),
    dealEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
  };
  res.json(GetHomeResponse.parse(result));
});

export default router;