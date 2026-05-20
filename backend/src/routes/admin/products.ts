import { Router } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProductById,
  listAdminProducts,
  updateAdminProduct,
} from "../../services/adminProducts.js";

export const adminProductsRouter = Router();

adminProductsRouter.get("/", async (req, res) => {
  try {
    const products = await listAdminProducts({
      category: typeof req.query.category === "string" ? req.query.category : undefined,
      includeInactive: req.query.includeInactive !== "false",
    });
    res.json({ products });
  } catch (error) {
    console.error("GET /api/admin/products failed:", error);
    res.status(500).json({ error: "Failed to load products" });
  }
});

adminProductsRouter.get("/:id", async (req, res) => {
  try {
    const product = await getAdminProductById(req.params.id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product });
  } catch (error) {
    console.error(`GET /api/admin/products/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to load product" });
  }
});

adminProductsRouter.post("/", async (req, res) => {
  const { slug, name, category, image, alt, sku, description } = req.body ?? {};
  if (!slug || !name || !category || !image || !alt || !sku || !description) {
    res.status(400).json({ error: "Missing required product fields" });
    return;
  }

  try {
    const product = await createAdminProduct(req.body);
    res.status(201).json({ product });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: "Slug or SKU already exists" });
      return;
    }
    console.error("POST /api/admin/products failed:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

adminProductsRouter.patch("/:id", async (req, res) => {
  try {
    const product = await updateAdminProduct(req.params.id, req.body);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: "Slug or SKU already exists" });
      return;
    }
    console.error(`PATCH /api/admin/products/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

adminProductsRouter.delete("/:id", async (req, res) => {
  try {
    const product = await deleteAdminProduct(req.params.id);
    res.json({ product });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    console.error(`DELETE /api/admin/products/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to deactivate product" });
  }
});
