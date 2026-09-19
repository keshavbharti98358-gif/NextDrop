import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, cartsTable } from "@workspace/db";
import { AddCartItemBody, AddCartItemResponse, GetCartResponse, RemoveCartItemParams, RemoveCartItemResponse, UpdateCartItemBody, UpdateCartItemParams, UpdateCartItemResponse } from "@workspace/api-zod";
import { findProductById, getCartPayload, getSessionId } from "../lib/store";

const router: IRouter = Router();

router.get("/cart", async (req, res): Promise<void> => {
  const sessionId = getSessionId(req, res);
  res.json(GetCartResponse.parse(await getCartPayload(sessionId)));
});

router.post("/cart/items", async (req, res): Promise<void> => {
  const parsed = AddCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const product = await findProductById(parsed.data.productId);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  if (parsed.data.quantity > product.stock) {
    res.status(400).json({ error: "Requested quantity exceeds available stock" });
    return;
  }
  const sessionId = getSessionId(req, res);
  const [existing] = await db.select().from(cartsTable).where(and(eq(cartsTable.sessionId, sessionId), eq(cartsTable.productId, product.id)));
  if (existing) {
    await db.update(cartsTable).set({ quantity: Math.min(product.stock, existing.quantity + parsed.data.quantity), updatedAt: new Date() }).where(eq(cartsTable.id, existing.id));
  } else {
    await db.insert(cartsTable).values({ id: `cart_${crypto.randomUUID()}`, sessionId, productId: product.id, quantity: parsed.data.quantity });
  }
  res.json(AddCartItemResponse.parse(await getCartPayload(sessionId)));
});

router.patch("/cart/items/:productId", async (req, res): Promise<void> => {
  const params = UpdateCartItemParams.safeParse(req.params);
  const body = UpdateCartItemBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const sessionId = getSessionId(req, res);
  if (body.data.quantity === 0) {
    await db.delete(cartsTable).where(and(eq(cartsTable.sessionId, sessionId), eq(cartsTable.productId, params.data.productId)));
  } else {
    await db.update(cartsTable).set({ quantity: body.data.quantity, updatedAt: new Date() }).where(and(eq(cartsTable.sessionId, sessionId), eq(cartsTable.productId, params.data.productId)));
  }
  res.json(UpdateCartItemResponse.parse(await getCartPayload(sessionId)));
});

router.delete("/cart/items/:productId", async (req, res): Promise<void> => {
  const params = RemoveCartItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const sessionId = getSessionId(req, res);
  await db.delete(cartsTable).where(and(eq(cartsTable.sessionId, sessionId), eq(cartsTable.productId, params.data.productId)));
  res.json(RemoveCartItemResponse.parse(await getCartPayload(sessionId)));
});

export default router;