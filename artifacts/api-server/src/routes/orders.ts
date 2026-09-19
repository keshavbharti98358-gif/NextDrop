import { Router, type IRouter } from "express";
import { GetOrderParams, GetOrderResponse } from "@workspace/api-zod";
import { getOrderPayload } from "../lib/store";

const router: IRouter = Router();

router.get("/orders/:orderId", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const order = await getOrderPayload(params.data.orderId);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(GetOrderResponse.parse(order));
});

export default router;