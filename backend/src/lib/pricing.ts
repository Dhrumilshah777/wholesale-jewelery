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

export const goldRatePerGram: Record<GoldPurity, number> = {
  "14kt": 5_450,
  "18kt": 2,
  "22kt": 20,
};

export const DEFAULT_GST_PERCENT = 3;

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
    makingChargeDisplay = `${formatPercent(input.makingCharge.value)}%`;
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

function formatPercent(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function purityFromDb(purity: string): GoldPurity {
  const map: Record<string, GoldPurity> = {
    KT_14: "14kt",
    KT_18: "18kt",
    KT_22: "22kt",
  };
  return map[purity] ?? "18kt";
}
