import crypto from "node:crypto";

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_NOT_CONFIGURED");
  }
  return { keyId, keySecret };
}

function getAuthHeader(): string {
  const { keyId, keySecret } = getRazorpayCredentials();
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export function getRazorpayKeyId(): string {
  return getRazorpayCredentials().keyId;
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse> {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
  });

  const data = (await res.json()) as RazorpayOrderResponse & {
    error?: { description?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.description ?? "Failed to create Razorpay order");
  }

  return data;
}

export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrderResponse> {
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: getAuthHeader() },
  });

  const data = (await res.json()) as RazorpayOrderResponse & {
    error?: { description?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.description ?? "Failed to fetch Razorpay order");
  }

  return data;
}

export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean {
  const { keySecret } = getRazorpayCredentials();
  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");
  return expected === razorpaySignature;
}

export function verifyRazorpayWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

export type RazorpayRefundResponse = {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  status: string;
  notes?: Record<string, string>;
};

export async function createRazorpayRefund(input: {
  paymentId: string;
  amountPaise: number;
  notes?: Record<string, string>;
}): Promise<RazorpayRefundResponse> {
  const res = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(input.paymentId)}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amountPaise,
        notes: input.notes,
      }),
    },
  );

  const data = (await res.json()) as RazorpayRefundResponse & {
    error?: { description?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.description ?? "Failed to create Razorpay refund");
  }

  return data;
}
