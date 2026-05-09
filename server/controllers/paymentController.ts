import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "../config/firebase.ts";

let razorpay: Razorpay | null = null;

// Initialize Razorpay only if credentials are available
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Razorpay:", error);
  }
} else {
  console.warn("⚠️ Razorpay credentials missing. Payment features will not work.");
}

export const createOrder = async (req: Request, res: Response) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ 
        error: "Payment service not available", 
        details: "Razorpay not configured" 
      });
    }

    const { amount, currency = "INR" } = req.body;
    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ 
      error: "Failed to create order",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const signature = req.headers["x-razorpay-signature"] as string;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (signature === expectedSignature) {
    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured") {
      const paymentId = payload.payment.entity.id;
      const orderId = payload.payment.entity.order_id;
      const email = payload.payment.entity.email;

      // Update user subscription in Firestore
      // ... logic to find user by email and upgrade tier
      console.log(`✅ Payment captured: ${paymentId} for ${email}`);
    }

    res.status(200).send("ok");
  } else {
    res.status(400).send("invalid signature");
  }
};
