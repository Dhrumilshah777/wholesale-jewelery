export type GoldPurity = "14kt" | "18kt" | "22kt";

export type MakingChargeType = "percentage" | "fixed";

export type ProductMakingCharge = {
  type: MakingChargeType;
  value: number;
};

export type PriceBreakup = {
  netWeightGrams: number;
  pricePerGram: number;
  purity: GoldPurity;
  goldValue: number;
  makingCharge: number;
  makingChargeDisplay: string;
  subtotal: number;
  gst: number;
  gstPercent: number;
  total: number;
};

/** Gold rate per gram (₹) by purity */
export const goldRatePerGram: Record<GoldPurity, number> = {
  "14kt": 5_450,
  "18kt": 2,
  "22kt": 20,
};

export const DEFAULT_GST_PERCENT = 3;

export function parseNetWeightGrams(weight: string): number {
  const grams = parseFloat(weight.replace(/[^\d.]/g, ""));
  return Number.isFinite(grams) ? grams : 0;
}

export function calculatePriceBreakup(input: {
  netWeightGrams: number;
  purity: GoldPurity;
  makingCharge: ProductMakingCharge;
  gstPercent?: number;
  pricePerGram?: number;
}): PriceBreakup {
  const pricePerGram = input.pricePerGram ?? goldRatePerGram[input.purity];
  const gstPercent = input.gstPercent ?? DEFAULT_GST_PERCENT;

  const goldValue = input.netWeightGrams * pricePerGram;

  let makingCharge: number;
  let makingChargeDisplay: string;

  if (input.makingCharge.type === "percentage") {
    makingCharge = goldValue * (input.makingCharge.value / 100);
    const pct =
      Math.round(input.makingCharge.value * 1000) / 1000;
    makingChargeDisplay = `${pct}%`;
  } else {
    makingCharge = input.makingCharge.value;
    makingChargeDisplay = formatINR(input.makingCharge.value);
  }

  const subtotal = goldValue + makingCharge;
  const gst = subtotal * (gstPercent / 100);
  const total = subtotal + gst;

  return {
    netWeightGrams: input.netWeightGrams,
    pricePerGram,
    purity: input.purity,
    goldValue,
    makingCharge,
    makingChargeDisplay,
    subtotal,
    gst,
    gstPercent,
    total,
  };
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatPurityLabel(purity: GoldPurity): string {
  return `${purity.toUpperCase()} Gold`;
}

export function formatRatePerGram(pricePerGram: number): string {
  return `${formatINR(pricePerGram)}/g`;
}
