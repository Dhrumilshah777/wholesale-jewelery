import type {
  GoldPurity,
  MakingChargeKind,
  MetalType,
  Product,
} from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { mapProductToDto } from "../lib/productMapper.js";
import {
  calculateProductPricePaise,
  makingChargeFromDb,
  metalToDb,
  purityFromDb,
  purityToDb,
} from "../lib/pricing.js";

export type AdminProductInput = {
  slug: string;
  name: string;
  category: string;
  image: string;
  alt: string;
  metal: MetalType | string;
  purity: GoldPurity | string;
  weightGrams: string | number;
  sku: string;
  ringSize?: string | null;
  description: string;
  gallery?: string[];
  makingChargeKind?: MakingChargeKind | string;
  makingChargeValue?: number | string;
  gstPercent?: number;
  isActive?: boolean;
};

function parseMakingChargeKind(kind?: string): MakingChargeKind {
  return kind === "FIXED" || kind === "fixed" ? "FIXED" : "PERCENTAGE";
}

function buildProductData(input: AdminProductInput) {
  const metal = typeof input.metal === "string" && !input.metal.includes("_")
    ? metalToDb(input.metal)
    : (input.metal as MetalType);
  const purity =
    typeof input.purity === "string" && input.purity.startsWith("KT_")
      ? (input.purity as GoldPurity)
      : purityToDb(String(input.purity));
  const weightGrams = Number(input.weightGrams).toFixed(2);
  const makingChargeKind = parseMakingChargeKind(input.makingChargeKind);
  const makingChargeValue = Number(input.makingChargeValue ?? 0.1);
  const gstPercent = input.gstPercent ?? 3;
  const gallery =
    input.gallery && input.gallery.length > 0
      ? input.gallery
      : [input.image];

  const pricePaise = calculateProductPricePaise({
    weightGrams: { toString: () => weightGrams },
    purity,
    makingChargeKind,
    makingChargeValue: { toString: () => String(makingChargeValue) },
    gstPercent,
  });

  return {
    slug: input.slug.trim(),
    name: input.name.trim(),
    category: input.category.trim(),
    image: input.image.trim(),
    alt: input.alt.trim(),
    metal,
    purity,
    weightGrams,
    sku: input.sku.trim(),
    ringSize: input.ringSize?.trim() || null,
    description: input.description.trim(),
    gallery,
    makingChargeKind,
    makingChargeValue,
    gstPercent,
    isActive: input.isActive ?? true,
    pricePaise,
  };
}

function toAdminProductDto(product: Product) {
  return {
    ...mapProductToDto(product),
    isActive: product.isActive,
    makingChargeKind: product.makingChargeKind,
    makingChargeValue: Number.parseFloat(product.makingChargeValue.toString()),
    gstPercent: product.gstPercent,
    pricePaise: product.pricePaise,
    metalCode: product.metal,
    purityCode: product.purity,
    weightGrams: Number.parseFloat(product.weightGrams.toString()),
    makingCharge: makingChargeFromDb(
      product.makingChargeKind,
      product.makingChargeValue,
    ),
  };
}

export async function listAdminProducts(filters: {
  category?: string;
  includeInactive?: boolean;
}) {
  const products = await prisma.product.findMany({
    where: {
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.includeInactive === false ? { isActive: true } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return products.map(toAdminProductDto);
}

export async function getAdminProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return null;
  return toAdminProductDto(product);
}

export async function createAdminProduct(data: AdminProductInput & { id?: string }) {
  const payload = buildProductData(data);
  const product = await prisma.product.create({
    data: {
      id: data.id,
      ...payload,
    },
  });
  return toAdminProductDto(product);
}

export async function updateAdminProduct(id: string, data: Partial<AdminProductInput>) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return null;

  const merged: AdminProductInput = {
    slug: data.slug ?? existing.slug,
    name: data.name ?? existing.name,
    category: data.category ?? existing.category,
    image: data.image ?? existing.image,
    alt: data.alt ?? existing.alt,
    metal: data.metal ?? existing.metal,
    purity: data.purity ?? existing.purity,
    weightGrams: data.weightGrams ?? existing.weightGrams.toString(),
    sku: data.sku ?? existing.sku,
    ringSize: data.ringSize !== undefined ? data.ringSize : existing.ringSize,
    description: data.description ?? existing.description,
    gallery: data.gallery ?? existing.gallery,
    makingChargeKind: data.makingChargeKind ?? existing.makingChargeKind,
    makingChargeValue:
      data.makingChargeValue ?? existing.makingChargeValue.toString(),
    gstPercent: data.gstPercent ?? existing.gstPercent,
    isActive: data.isActive ?? existing.isActive,
  };

  const payload = buildProductData(merged);
  const product = await prisma.product.update({
    where: { id },
    data: payload,
  });
  return toAdminProductDto(product);
}

export async function deleteAdminProduct(id: string) {
  const product = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
  return toAdminProductDto(product);
}
