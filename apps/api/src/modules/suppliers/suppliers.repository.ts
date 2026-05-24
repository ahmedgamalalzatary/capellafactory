import { eq } from "drizzle-orm";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";
import { db } from "../../db/index.js";
import { suppliersTable } from "../../db/schema/suppliers.js";

type SupplierRow = typeof suppliersTable.$inferSelect;
type SupplierInsert = typeof suppliersTable.$inferInsert;

export class DuplicateSupplierPhoneError extends Error {
  constructor() {
    super("Supplier phone must be unique");
  }
}

export function mapSupplierRowToSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    where: row.where ?? undefined,
    notes: row.notes,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function toDatabaseError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  ) {
    return new DuplicateSupplierPhoneError();
  }

  return error;
}

export async function listSuppliers() {
  const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.id);
  return suppliers.map(mapSupplierRowToSupplier);
}

export async function getSupplierById(id: number) {
  const supplier = await db.query.suppliersTable.findFirst({
    where: eq(suppliersTable.id, id),
  });

  return supplier ? mapSupplierRowToSupplier(supplier) : null;
}

export async function createSupplier(
  input: Omit<Supplier, "id" | "createdAt" | "updatedAt">,
) {
  try {
    const inserted = await db
      .insert(suppliersTable)
      .values(toSupplierInsert(input))
      .$returningId();

    const supplier = await getSupplierById(inserted[0]?.id ?? 0);

    if (!supplier) {
      throw new Error("Failed to load created supplier");
    }

    return supplier;
  } catch (error) {
    throw toDatabaseError(error);
  }
}

export async function updateSupplier(
  id: number,
  input: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>,
) {
  const existingSupplier = await getSupplierById(id);

  if (!existingSupplier) {
    return null;
  }

  try {
    await db
      .update(suppliersTable)
      .set({
        ...toSupplierUpdate(input),
        updatedAt: new Date(),
      })
      .where(eq(suppliersTable.id, id));

    return getSupplierById(id);
  } catch (error) {
    throw toDatabaseError(error);
  }
}

export async function deleteSupplier(id: number) {
  const result = await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
  return result[0].affectedRows > 0;
}

function toSupplierInsert(
  input: Omit<Supplier, "id" | "createdAt" | "updatedAt">,
): SupplierInsert {
  return {
    name: input.name,
    phone: input.phone,
    where: input.where ?? null,
    notes: input.notes,
  };
}

function toSupplierUpdate(
  input: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>,
) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.where !== undefined ? { where: input.where || null } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  };
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
