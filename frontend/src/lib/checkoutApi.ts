import type { AccountOrder } from "@/data/accountOrders";
import { customerFetch } from "@/lib/customerFetch";

export type CheckoutAddress = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  label?: string;
  saveAddress?: boolean;
};

export type SavedCheckoutAddress = {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
};

export async function fetchCheckoutAddresses() {
  const data = await customerFetch<{ addresses: SavedCheckoutAddress[] }>(
    "/api/checkout/addresses",
  );
  return data.addresses;
}

type RazorpayCreateOrderResponse = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
};

type VerifyResponse = { order: AccountOrder };

export async function createRazorpayCheckoutOrder(
  payload: { address: CheckoutAddress } | { addressId: string },
) {
  return customerFetch<RazorpayCreateOrderResponse>("/api/checkout/razorpay/create-order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyRazorpayPayment(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const data = await customerFetch<VerifyResponse>("/api/checkout/razorpay/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.order;
}
