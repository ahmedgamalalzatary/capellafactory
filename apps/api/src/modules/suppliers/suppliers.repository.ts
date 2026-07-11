import { asc, eq, like } from "drizzle-orm";
import type { Supplier } from "@capella/shared/suppliers/supplier.types";
import { escapeLike } from "../../utils/search.js";
import { db } from "../../db/index.js";
import { suppliersTable } from "../../db/schema/suppliers.js";

type SupplierRow = typeof suppliersTable.$inferSelect;
type SupplierInsert = typeof suppliersTable.$inferInsert;

export class DuplicateSupplierPhoneError extends Error {
  constructor() {
    super("رقم هاتف المورد مستخدم بالفعل");
  }
}

export class SupplierHasPurchaseHistoryError extends Error {
  constructor() {
    super("لا يمكن حذف المورد لوجود سجل مشتريات مرتبط به");
  }
}

export function mapSupplierRowToSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    where: row.where ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function toDatabaseError(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    if (error.code === "ER_DUP_ENTRY") {
      return new DuplicateSupplierPhoneError();
    }

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return new SupplierHasPurchaseHistoryError();
    }
  }

  return error;
}

export function normalizeSupplierSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

export async function listSuppliers(query?: string) {
  const normalizedQuery = normalizeSupplierSearchQuery(query);
  const suppliers = await db
    .select()
    .from(suppliersTable)
    .where(
      normalizedQuery
        ? like(suppliersTable.name, `%${escapeLike(normalizedQuery)}%`)
        : undefined,
    )
    .orderBy(asc(suppliersTable.id));

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
      throw new Error("تعذر تحميل المورد الذي تم إنشاؤه");
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
  try {
    const result = await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
    return result[0].affectedRows > 0;
  } catch (error) {
    throw toDatabaseError(error);
  }
}

function toSupplierInsert(
  input: Omit<Supplier, "id" | "createdAt" | "updatedAt">,
): SupplierInsert {
  return {
    name: input.name,
    phone: input.phone,
    where: input.where ?? null,
    notes: input.notes ?? null,
  };
}

function toSupplierUpdate(
  input: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>,
) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.where !== undefined ? { where: input.where || null } : {}),
    ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
  };
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
