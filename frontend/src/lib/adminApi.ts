import { getApiBaseUrl } from "@/lib/api";

const TOKEN_KEY = "admin_token";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
};

export type AdminReturn = {
  id: string;
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  submittedAt: string;
  status: string;
  statusLabel: string;
  reason: string;
  customerNotes: string;
  adminNotes: string;
  policyConfirmed: boolean;
  pickupScheduledFor: string | null;
  reversePickupAt: string | null;
  shiprocketReturnOrderId: string | null;
  shiprocketReturnShipmentId: string | null;
  razorpayRefundId: string | null;
  refundStatus: string | null;
  refundAmountPaise: number | null;
  reviewedAt: string | null;
  customer: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
  };
  product: {
    slug: string;
    name: string;
    metal: string;
    purity: string;
    size?: string | null;
    price: string;
    image: string;
  };
  productImageUrls: string[];
  packagingImageUrls: string[];
  pickupAddress: {
    name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  timeline: {
    id: string;
    status: string;
    label: string;
    note: string | null;
    date: string;
    eventAt: string;
  }[];
};

export type AdminDashboard = {
  counts: {
    totalOrders: number;
    ordersToday: number;
    pendingReturns: number;
    totalProducts: number;
    activeProducts: number;
    totalCustomers: number;
    revenueToday: string;
    revenueTodayPaise: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    total: string;
    placedAt: string;
  }[];
  recentReturns: {
    id: string;
    orderNumber: string;
    status: string;
    submittedAt: string;
  }[];
};

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(new URL(path, getApiBaseUrl()).toString(), {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    clearAdminToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
      window.location.href = "/admin/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `API ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function adminLogin(email: string, password: string) {
  const response = await fetch(
    new URL("/api/admin/auth/login", getApiBaseUrl()).toString(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Invalid email or password");
  }

  const data = (await response.json()) as { admin: AdminUser; token: string };
  setAdminToken(data.token);
  return data.admin;
}

export async function adminLogout() {
  try {
    await adminFetch("/api/admin/auth/logout", { method: "POST" });
  } finally {
    clearAdminToken();
  }
}

export async function fetchAdminMe() {
  const data = await adminFetch<{ admin: AdminUser }>("/api/admin/auth/me");
  return data.admin;
}

export async function fetchAdminDashboard() {
  const data = await adminFetch<{ dashboard: AdminDashboard }>("/api/admin/dashboard");
  return data.dashboard;
}

export async function fetchAdminReturns(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await adminFetch<{ returns: AdminReturn[] }>(`/api/admin/returns${query}`);
  return data.returns;
}

export async function patchAdminReturn(id: string, body: { status: string; note?: string }) {
  const data = await adminFetch<{ return: AdminReturn }>(`/api/admin/returns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return data.return;
}

export async function scheduleReturnPickup(id: string, pickupScheduledFor: string) {
  const data = await adminFetch<{ return: AdminReturn }>(`/api/admin/returns/${id}/pickup`, {
    method: "PATCH",
    body: JSON.stringify({ pickupScheduledFor }),
  });
  return data.return;
}

export async function updateReturnStatus(
  id: string,
  body: { status: string; pickupScheduledFor?: string; note?: string },
) {
  const data = await adminFetch<{ return: AdminReturn }>(`/api/admin/returns/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return data.return;
}

export async function saveAdminReturnNotes(id: string, adminNotes: string) {
  const data = await adminFetch<{ return: AdminReturn }>(`/api/admin/returns/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ adminNotes }),
  });
  return data.return;
}

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  statusCode: string;
  placedOn: string;
  total: string;
  customer: { name: string | null; phone: string };
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  placedOn: string;
  status: string;
  statusCode: string;
  total: string;
  customer: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
  };
  deliveryAddress: {
    name: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  items: {
    slug: string;
    name: string;
    image: string;
    alt: string;
    metal: string;
    purity: string;
    size?: string;
    weight: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }[];
  payment: {
    method: string;
    status: string;
    transactionId: string;
    razorpayPaymentId: string;
    paid: boolean;
  };
  priceBreakdown: {
    goldValue: string;
    makingCharges: string;
    gst: string;
    shipping: string;
    total: string;
  };
  shipping: {
    courier: string;
    trackingNumber: string;
    expectedDelivery: string;
  };
  shiprocketOrderId?: number | null;
  shiprocketShipmentId?: number | null;
  warehousePickup: {
    date: string;
    time: string;
    scheduledAt: string | null;
  };
  shiprocketFulfillmentLog: ShiprocketLogEntry[] | null;
  statusHistory: {
    id: string;
    status: string;
    statusLabel: string;
    label: string;
    note: string | null;
    date: string;
  }[];
};

export async function fetchAdminOrders() {
  const data = await adminFetch<{ orders: AdminOrderListItem[] }>("/api/admin/orders");
  return data.orders;
}

export async function fetchAdminOrderById(orderId: string) {
  const data = await adminFetch<{ order: AdminOrderDetail }>(`/api/admin/orders/${orderId}`);
  return data.order;
}

export type ShiprocketLogEntry = {
  step: string;
  ok: boolean;
  summary: string;
  response?: unknown;
  error?: string;
};

export class AdminOrderStatusError extends Error {
  order?: AdminOrderDetail;
  shiprocketLog?: ShiprocketLogEntry[];
  shiprocketFailed?: boolean;

  constructor(
    message: string,
    extra?: { order?: AdminOrderDetail; shiprocketLog?: ShiprocketLogEntry[] },
  ) {
    super(message);
    this.name = "AdminOrderStatusError";
    this.order = extra?.order;
    this.shiprocketLog = extra?.shiprocketLog;
    this.shiprocketFailed = true;
  }
}

export async function updateAdminOrderStatus(orderId: string, status: string) {
  const token = getAdminToken();
  const response = await fetch(
    new URL(`/api/admin/orders/${orderId}`, getApiBaseUrl()).toString(),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    },
  );

  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    order?: AdminOrderDetail;
    shiprocketLog?: ShiprocketLogEntry[];
    shiprocketFailed?: boolean;
  };

  if (response.status === 422 && body.shiprocketFailed) {
    throw new AdminOrderStatusError(body.error ?? "Shiprocket fulfillment failed", {
      order: body.order,
      shiprocketLog: body.shiprocketLog,
    });
  }

  if (!response.ok) {
    throw new Error(body.error ?? "Failed to update order status");
  }

  return body as {
    order: AdminOrderDetail;
    shiprocketLog?: ShiprocketLogEntry[];
  };
}

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  alt: string;
  price: string;
  sku: string;
  weight: string;
  weightGrams: number;
  metal: string;
  metalCode: string;
  purity: string;
  purityCode: string;
  description: string;
  gallery: string[];
  ringSize?: string;
  makingCharge: { type: "percentage" | "fixed"; value: number };
  makingChargeKind: string;
  makingChargeValue: number;
  gstPercent: number;
  pricePaise: number;
  isActive: boolean;
};

export type AdminProductPayload = {
  slug: string;
  name: string;
  category: string;
  image: string;
  alt: string;
  metal: string;
  purity: string;
  weightGrams: number;
  sku: string;
  ringSize?: string | null;
  description: string;
  gallery?: string[];
  makingChargeKind: string;
  makingChargeValue: number;
  gstPercent: number;
  isActive: boolean;
};

export async function fetchAdminProducts() {
  const data = await adminFetch<{ products: AdminProduct[] }>("/api/admin/products");
  return data.products;
}

export async function fetchAdminProductById(id: string) {
  const data = await adminFetch<{ product: AdminProduct }>(`/api/admin/products/${id}`);
  return data.product;
}

export async function createAdminProduct(payload: AdminProductPayload) {
  const data = await adminFetch<{ product: AdminProduct }>("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.product;
}

export async function updateAdminProduct(id: string, payload: Partial<AdminProductPayload>) {
  const data = await adminFetch<{ product: AdminProduct }>(`/api/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.product;
}

export async function deleteAdminProduct(id: string) {
  const data = await adminFetch<{ product: AdminProduct }>(`/api/admin/products/${id}`, {
    method: "DELETE",
  });
  return data.product;
}

export async function fetchAdminCustomers() {
  const data = await adminFetch<{
    customers: {
      id: string;
      name: string | null;
      phone: string;
      email: string | null;
      orderCount: number;
      addressCount: number;
    }[];
  }>("/api/admin/customers");
  return data.customers;
}
