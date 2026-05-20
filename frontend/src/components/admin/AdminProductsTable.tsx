"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  deleteAdminProduct,
  fetchAdminProducts,
  type AdminProduct,
} from "@/lib/adminApi";

export default function AdminProductsTable() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await fetchAdminProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeactivate = async (product: AdminProduct) => {
    if (
      !window.confirm(
        `Deactivate "${product.name}"? It will be hidden from the store but kept in orders.`,
      )
    ) {
      return;
    }
    setActionError(null);
    setDeletingId(product.id);
    try {
      await deleteAdminProduct(product.id);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to deactivate");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <p className="text-sm font-light text-zinc-500">Loading products…</p>;
  if (error) return <p className="text-sm font-light text-red-700">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-light text-zinc-600">{products.length} products</p>
        <Link
          href="/admin/products/new"
          className="inline-block border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800"
        >
          + Add product
        </Link>
      </div>

      {actionError ? (
        <p className="text-sm font-light text-red-700">{actionError}</p>
      ) : null}

      <div className="overflow-x-auto border border-zinc-200 bg-white">
        <table className="w-full min-w-[880px] text-left text-sm font-light">
          <thead className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-normal">Product</th>
              <th className="px-5 py-3 font-normal">SKU</th>
              <th className="px-5 py-3 font-normal">Category</th>
              <th className="px-5 py-3 font-normal">Weight</th>
              <th className="px-5 py-3 font-normal">Price</th>
              <th className="px-5 py-3 font-normal">Status</th>
              <th className="px-5 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-5 py-4 text-zinc-900">{product.name}</td>
                <td className="px-5 py-4 text-zinc-600">{product.sku}</td>
                <td className="px-5 py-4 capitalize text-zinc-700">{product.category}</td>
                <td className="px-5 py-4 text-zinc-600">{product.weight}</td>
                <td className="px-5 py-4 text-zinc-900">{product.price}</td>
                <td className="px-5 py-4">
                  <span
                    className={`text-[10px] uppercase tracking-[0.14em] ${
                      product.isActive ? "text-emerald-700" : "text-zinc-400"
                    }`}
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-[10px] uppercase tracking-[0.14em] text-zinc-700 hover:text-zinc-900"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 hover:text-zinc-900"
                    >
                      View
                    </Link>
                    {product.isActive ? (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(product)}
                        disabled={deletingId === product.id}
                        className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-red-700 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingId === product.id ? "…" : "Deactivate"}
                      </button>
                    ) : (
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-[10px] uppercase tracking-[0.14em] text-emerald-700 hover:text-emerald-900"
                      >
                        Reactivate
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
