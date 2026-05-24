import { and, asc, eq, like } from "drizzle-orm";
import type { Product, ProductInput } from "@capella/shared/products/product.types";
import { db } from "../../db/index.js";
import { productsTable } from "../../db/schema/products.js";

type ProductRow = typeof productsTable.$inferSelect;
type ProductInsert = typeof productsTable.$inferInsert;

export class DuplicateProductNameError extends Error {
  constructor() {
    super("Product name must be unique");
  }
}

export class ProductLockedError extends Error {
  constructor() {
    super("Product cannot be edited after it has history");
  }
}

export class ProductArchiveConflictError extends Error {
  constructor() {
    super("Product can only be archived when stock is zero");
  }
}

export class ProductDeleteConflictError extends Error {
  constructor() {
    super("Product can only be deleted when stock is zero and there is no history");
  }
}

export function mapProductRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    stockQuantity: Number(row.stockQuantity),
    hasHistory: Boolean(row.hasHistory),
    isArchived: Boolean(row.isArchived),
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function toProductDatabaseError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  ) {
    return new DuplicateProductNameError();
  }

  return error;
}

export function normalizeProductSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

export async function listProducts(query?: string, includeArchived = false) {
  const normalizedQuery = normalizeProductSearchQuery(query);
  const products = await db
    .select()
    .from(productsTable)
    .where(
      and(
        includeArchived ? undefined : eq(productsTable.isArchived, false),
        normalizedQuery ? like(productsTable.name, `%${normalizedQuery}%`) : undefined,
      ),
    )
    .orderBy(asc(productsTable.id));

  return products.map(mapProductRowToProduct);
}

export async function getProductById(id: number) {
  const product = await db.query.productsTable.findFirst({
    where: eq(productsTable.id, id),
  });

  return product ? mapProductRowToProduct(product) : null;
}

export async function createProduct(input: ProductInput) {
  try {
    const inserted = await db.insert(productsTable).values(toProductInsert(input)).$returningId();
    const product = await getProductById(inserted[0]?.id ?? 0);

    if (!product) {
      throw new Error("Failed to load created product");
    }

    return product;
  } catch (error) {
    throw toProductDatabaseError(error);
  }
}

export async function updateProduct(id: number, input: Partial<ProductInput>) {
  const existingProduct = await getProductById(id);

  if (!existingProduct) {
    return null;
  }

  if (existingProduct.hasHistory) {
    throw new ProductLockedError();
  }

  try {
    await db
      .update(productsTable)
      .set({
        ...toProductUpdate(input),
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, id));

    return getProductById(id);
  } catch (error) {
    throw toProductDatabaseError(error);
  }
}

export async function archiveProduct(id: number) {
  const existingProduct = await getProductById(id);

  if (!existingProduct) {
    return null;
  }

  if (existingProduct.stockQuantity !== 0) {
    throw new ProductArchiveConflictError();
  }

  await db
    .update(productsTable)
    .set({
      isArchived: true,
      updatedAt: new Date(),
    })
    .where(eq(productsTable.id, id));

  return getProductById(id);
}

export async function reactivateProduct(id: number) {
  const existingProduct = await getProductById(id);

  if (!existingProduct) {
    return null;
  }

  await db
    .update(productsTable)
    .set({
      isArchived: false,
      updatedAt: new Date(),
    })
    .where(eq(productsTable.id, id));

  return getProductById(id);
}

export async function deleteProduct(id: number) {
  const existingProduct = await getProductById(id);

  if (!existingProduct) {
    return false;
  }

  if (existingProduct.stockQuantity !== 0 || existingProduct.hasHistory) {
    throw new ProductDeleteConflictError();
  }

  const result = await db.delete(productsTable).where(eq(productsTable.id, id));
  return result[0].affectedRows > 0;
}

function toProductInsert(input: ProductInput): ProductInsert {
  return {
    name: input.name,
  };
}

function toProductUpdate(input: Partial<ProductInput>) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
  };
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
