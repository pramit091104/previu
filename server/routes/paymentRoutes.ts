import { Router } from "express";
import { createOrder, handleWebhook } from "../controllers/paymentController.ts";
import { idempotency } from "../middleware/idempotency.ts";

const router = Router();

router.post("/order", idempotency, createOrder);
router.post("/webhook", handleWebhook);

export default router;
