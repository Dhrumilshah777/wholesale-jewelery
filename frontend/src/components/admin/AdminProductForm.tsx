"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { collectionSlugs, collections } from "@/data/collections";
import {
  calculatePriceBreakup,
  type GoldPurity,
  type ProductMakingCharge,
} from "@/lib/pricing";
import {
  createAdminProduct,
  fetchAdminProductById,
  updateAdminProduct,
  type AdminProduct,
  type AdminProductPayload,
} from "@/lib/adminApi";

const METAL_OPTIONS = [
  { value: "YELLOW_GOLD", label: "Yellow Gold" },
  { value: "ROSE_GOLD", label: "Rose Gold" },
  { value: "WHITE_GOLD", label: "White Gold" },
] as const;

const PURITY_OPTIONS = [
  { value: "KT_14", label: "14KT" },
  { value: "KT_18", label: "18KT" },
  { value: "KT_22", label: "22KT" },
] as const;

function purityLabelToGold(code: string): GoldPurity {
  if (code === "KT_14") return "14kt";
  if (code === "KT_22") return "22kt";
  return "18kt";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function emptyForm(): AdminProductPayload {
  return {
    slug: "",
    name: "",
    category: "rings",
    image: "",
    alt: "",
    metal: "YELLOW_GOLD",
    purity: "KT_18",
    weightGrams: 0.5,
    sku: "",
    ringSize: "",
    description: "",
    gallery: [],
    makingChargeKind: "PERCENTAGE",
    makingChargeValue: 0.1,
    gstPercent: 3,
    isActive: true,
  };
}

function productToForm(product: AdminProduct): AdminProductPayload {
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    image: product.image,
    alt: product.alt,
    metal: product.metalCode,
    purity: product.purityCode,
    weightGrams: product.weightGrams,
    sku: product.sku,
    ringSize: product.ringSize ?? "",
    description: product.description,
    gallery: product.gallery,
    makingChargeKind: product.makingChargeKind,
    makingChargeValue: product.makingChargeValue,
    gstPercent: product.gstPercent,
    isActive: product.isActive,
  };
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-normal uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-[10px] font-light text-zinc-500">{hint}</p> : null}
    </label>
  );
}

const inputClass =
  "w-full border border-zinc-300 bg-white px-3 py-2.5 text-sm font-light text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400";

export default function AdminProductForm({
  productId,
  mode,
}: {
  productId?: string;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [form, setForm] = useState<AdminProductPayload>(emptyForm);
  const [galleryText, setGalleryText] = useState("");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !productId) return;
    setLoading(true);
    fetchAdminProductById(productId)
      .then((product) => {
        setForm(productToForm(product));
        setGalleryText(
          product.gallery.filter((url) => url !== product.image).join("\n"),
        );
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load product"),
      )
      .finally(() => setLoading(false));
  }, [mode, productId]);

  const makingCharge: ProductMakingCharge = useMemo(
    () => ({
      type: form.makingChargeKind === "FIXED" ? "fixed" : "percentage",
      value: form.makingChargeValue,
    }),
    [form.makingChargeKind, form.makingChargeValue],
  );

  const pricePreview = useMemo(() => {
    try {
      const breakup = calculatePriceBreakup({
        netWeightGrams: form.weightGrams,
        purity: purityLabelToGold(form.purity),
        makingCharge,
        gstPercent: form.gstPercent,
      });
      return `₹${Math.round(breakup.total).toLocaleString("en-IN")}`;
    } catch {
      return "—";
    }
  }, [form.weightGrams, form.purity, form.gstPercent, makingCharge]);

  const update = <K extends keyof AdminProductPayload>(
    key: K,
    value: AdminProductPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const galleryExtra = galleryText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const gallery = [form.image, ...galleryExtra.filter((url) => url !== form.image)];

    const payload: AdminProductPayload = {
      ...form,
      slug: form.slug || slugify(form.name),
      gallery,
      ringSize: form.category === "rings" && form.ringSize ? form.ringSize : null,
    };

    try {
      if (mode === "create") {
        await createAdminProduct(payload);
        router.push("/admin/products");
        router.refresh();
        return;
      }
      if (productId) {
        await updateAdminProduct(productId, payload);
        router.push("/admin/products");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm font-light text-zinc-500">Loading product…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/products"
          className="text-[11px] font-light uppercase tracking-[0.16em] text-zinc-600 hover:text-zinc-900"
        >
          ← All products
        </Link>
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Live price preview: <span className="text-zinc-900">{pricePreview}</span>
        </p>
      </div>

      <section className="border border-zinc-200 bg-white p-6 space-y-5">
        <h2 className="text-[11px] font-normal uppercase tracking-[0.2em] text-zinc-900">
          Basics
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Product name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => {
                update("name", e.target.value);
                if (mode === "create" && !form.slug) {
                  update("slug", slugify(e.target.value));
                }
              }}
              required
            />
          </Field>
          <Field label="URL slug" hint="Used in /products/your-slug">
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => update("slug", slugify(e.target.value))}
              required
            />
          </Field>
          <Field label="SKU">
            <input
              className={inputClass}
              value={form.sku}
              onChange={(e) => update("sku", e.target.value)}
              required
            />
          </Field>
          <Field label="Category">
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {collectionSlugs.map((slug) => (
                <option key={slug} value={slug}>
                  {collections[slug].name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Active on store">
            <select
              className={inputClass}
              value={form.isActive ? "true" : "false"}
              onChange={(e) => update("isActive", e.target.value === "true")}
            >
              <option value="true">Active</option>
              <option value="false">Inactive (hidden)</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="border border-zinc-200 bg-white p-6 space-y-5">
        <h2 className="text-[11px] font-normal uppercase tracking-[0.2em] text-zinc-900">
          Pricing & metal
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Metal">
            <select
              className={inputClass}
              value={form.metal}
              onChange={(e) => update("metal", e.target.value)}
            >
              {METAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Purity">
            <select
              className={inputClass}
              value={form.purity}
              onChange={(e) => update("purity", e.target.value)}
            >
              {PURITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Weight (grams)" hint="e.g. 0.50 – 0.60">
            <input
              type="number"
              step="0.001"
              min="0.01"
              className={inputClass}
              value={form.weightGrams}
              onChange={(e) => update("weightGrams", Number(e.target.value))}
              required
            />
          </Field>
          <Field label="GST %">
            <input
              type="number"
              min="0"
              max="28"
              className={inputClass}
              value={form.gstPercent}
              onChange={(e) => update("gstPercent", Number(e.target.value))}
            />
          </Field>
          <Field label="Making charge type">
            <select
              className={inputClass}
              value={form.makingChargeKind}
              onChange={(e) => update("makingChargeKind", e.target.value)}
            >
              <option value="PERCENTAGE">Percentage of gold value</option>
              <option value="FIXED">Fixed amount (₹)</option>
            </select>
          </Field>
          <Field
            label={
              form.makingChargeKind === "FIXED"
                ? "Making charge (₹)"
                : "Making charge (%)"
            }
          >
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              value={form.makingChargeValue}
              onChange={(e) => update("makingChargeValue", Number(e.target.value))}
            />
          </Field>
          {form.category === "rings" ? (
            <Field label="Ring size">
              <input
                className={inputClass}
                value={form.ringSize ?? ""}
                onChange={(e) => update("ringSize", e.target.value)}
                placeholder="e.g. 10"
              />
            </Field>
          ) : null}
        </div>
      </section>

      <section className="border border-zinc-200 bg-white p-6 space-y-5">
        <h2 className="text-[11px] font-normal uppercase tracking-[0.2em] text-zinc-900">
          Media & copy
        </h2>
        <Field label="Main image URL">
          <input
            className={inputClass}
            value={form.image}
            onChange={(e) => update("image", e.target.value)}
            required
          />
        </Field>
        <Field label="Image alt text">
          <input
            className={inputClass}
            value={form.alt}
            onChange={(e) => update("alt", e.target.value)}
            required
          />
        </Field>
        <Field label="Extra gallery URLs" hint="One URL per line (main image is always included)">
          <textarea
            className={`${inputClass} min-h-[100px]`}
            value={galleryText}
            onChange={(e) => setGalleryText(e.target.value)}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={`${inputClass} min-h-[140px]`}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
          />
        </Field>
      </section>

      {error ? <p className="text-sm font-light text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer border border-zinc-900 bg-zinc-900 px-6 py-3 text-[10px] font-light uppercase tracking-[0.18em] text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        <Link
          href="/admin/products"
          className="inline-flex items-center border border-zinc-300 px-6 py-3 text-[10px] font-light uppercase tracking-[0.18em] text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
