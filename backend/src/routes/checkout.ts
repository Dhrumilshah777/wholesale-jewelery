import { Router } from "express";
import { requireCustomer, type CustomerRequest } from "../middleware/requireCustomer.js";
import { listSavedAddressesForUser } from "../services/addresses.js";
import { parseCheckoutAddressPayload } from "../services/checkoutAddresses.js";
import {
  createRazorpayCheckout,
  verifyRazorpayCheckoutAndPlaceOrder,
} from "../services/razorpayCheckout.js";

export const checkoutRouter = Router();

checkoutRouter.get("/addresses", requireCustomer, async (req: CustomerRequest, res) => {
  try {
    const addresses = await listSavedAddressesForUser(req.customer!.userId);
    res.json({ addresses });
  } catch (error) {
    console.error("GET /api/checkout/addresses failed:", error);
    res.status(500).json({ error: "Failed to load addresses" });
  }
});

checkoutRouter.post("/razorpay/create-order", requireCustomer, async (req: CustomerRequest, res) => {
  const payload = parseCheckoutAddressPayload(req.body);

  if (!payload) {
    res.status(400).json({ error: "Delivery address or addressId is required" });
    return;
  }

  try {
    const result = await createRazorpayCheckout(req.customer!.userId, payload);

    if ("error" in result) {
      if (result.error === "CART_EMPTY") {
        res.status(400).json({ error: "Your bag is empty" });
        return;
      }
      if (result.error === "PRODUCT_UNAVAILABLE") {
        res.status(400).json({ error: "A product in your bag is no longer available" });
        return;
      }
      if (result.error === "ADDRESS_NOT_FOUND") {
        res.status(400).json({ error: "Saved address not found" });
        return;
      }
      if (result.error === "INVALID_ADDRESS") {
        res.status(400).json({
          error: "message" in result ? result.message : "Invalid address",
        });
        return;
      }
    }

    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "RAZORPAY_NOT_CONFIGURED") {
      res.status(503).json({ error: "Payment service is not configured" });
      return;
    }
    console.error("POST /api/checkout/razorpay/create-order failed:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to start payment",
    });
  }
});

checkoutRouter.post("/razorpay/verify", requireCustomer, async (req: CustomerRequest, res) => {
  const razorpayOrderId = req.body?.razorpay_order_id;
  const razorpayPaymentId = req.body?.razorpay_payment_id;
  const razorpaySignature = req.body?.razorpay_signature;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400).json({ error: "Payment verification data is required" });
    return;
  }

  try {
    const result = await verifyRazorpayCheckoutAndPlaceOrder(req.customer!.userId, {
      razorpayOrderId: String(razorpayOrderId),
      razorpayPaymentId: String(razorpayPaymentId),
      razorpaySignature: String(razorpaySignature),
    });

    if ("error" in result && result.error) {
      const messages: Record<string, string> = {
        PAYMENT_VERIFICATION_FAILED: "Payment verification failed",
        CHECKOUT_SESSION_NOT_FOUND: "Checkout session not found",
        CHECKOUT_SESSION_EXPIRED: "Checkout session expired. Please try again.",
        PAYMENT_AMOUNT_MISMATCH: "Payment amount mismatch",
        CART_EMPTY: "Your bag is empty",
        PRODUCT_UNAVAILABLE: "A product is no longer available",
      };
      res.status(400).json({
        error: messages[result.error] ?? "Could not complete order",
      });
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("POST /api/checkout/razorpay/verify failed:", error);
    res.status(500).json({ error: "Failed to complete order" });
  }
});
