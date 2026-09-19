import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, cartsTable, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { CreateOrderBody, CreateOrderResponse, GetCheckoutQuoteBody, GetCheckoutQuoteResponse } from "@workspace/api-zod";
import { getCartPayload, getOrderPayload, getSessionId } from "../lib/store";

const router: IRouter = Router();
const money = (value: number) => Number(value.toFixed(2));

function quoteFromCart(cart: Awaited<ReturnType<typeof getCartPayload>>, shippingMethod: "standard" | "express", coupon: string | null) {
  const shipping = cart.subtotal === 0 ? 0 : shippingMethod === "express" ? 18.95 : cart.subtotal >= 75 ? 0 : 8.95;
  const discount = coupon?.toUpperCase() === "NEXORA10" ? money(cart.subtotal * 0.1) : 0;
  const tax = money((cart.subtotal - discount) * 0.08);
  return { subtotal: cart.subtotal, shipping, discount, tax, total: money(cart.subtotal + shipping + tax - discount), couponApplied: discount ? "NEXORA10" : null };
}

router.post("/checkout/quote", async (req, res): Promise<void> => {
  const parsed = GetCheckoutQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const sessionId = getSessionId(req, res);
  const result = quoteFromCart(await getCartPayload(sessionId), parsed.data.shippingMethod, parsed.data.coupon ?? null);
  res.json(GetCheckoutQuoteResponse.parse(result));
});

router.post("/checkout/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const sessionId = getSessionId(req, res);
  const cart = await getCartPayload(sessionId);
  if (cart.items.length === 0) {
    res.status(400).json({ error: "Your cart is empty" });
    return;
  }
  const quote = quoteFromCart(cart, parsed.data.shippingMethod, parsed.data.coupon ?? null);
  const orderId = `NX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const address = [parsed.data.address, parsed.data.apartment, parsed.data.city, parsed.data.state, parsed.data.country, parsed.data.postalCode].filter(Boolean).join(", ");
  const estimatedDelivery = parsed.data.shippingMethod === "express" ? "Arrives in 2–4 business days" : "Arrives in 5–8 business days";
  await db.transaction(async (tx) => {
    await tx.insert(ordersTable).values({
      id: orderId,
      status: "confirmed",
      shippingStatus: "Preparing",
      total: String(quote.total),
      customerName: parsed.data.fullName,
      customerEmail: parsed.data.email,
      paymentStatus: parsed.data.paymentMethod === "cod" ? "pending" : "paid",
      shippingAddress: address,
      estimatedDelivery,
    });
    for (const item of cart.items) {
      await tx.insert(orderItemsTable).values({ id: `item_${crypto.randomUUID()}`, orderId, productId: item.product.id, quantity: item.quantity, lineTotal: String(item.lineTotal) });
      await tx.update(productsTable).set({ stock: sql`${productsTable.stock} - ${item.quantity}` }).where(eq(productsTable.id, item.product.id));
    }
    await tx.delete(cartsTable).where(eq(cartsTable.sessionId, sessionId));
  });
  const order = await getOrderPayload(orderId);
  res.status(201).json(CreateOrderResponse.parse(order));
});

export default router;