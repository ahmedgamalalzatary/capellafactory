import { asc, eq, like } from "drizzle-orm";
import type { Buyer } from "@capella/shared/buyers/buyer.types";
import { db } from "../../db/index.js";
import { buyersTable } from "../../db/schema/buyers.js";
import { buyerHasSalesInvoiceHistory } from "../sales-invoices/sales-invoices.repository.js";

type BuyerRow = typeof buyersTable.$inferSelect;
type BuyerInsert = typeof buyersTable.$inferInsert;

export class DuplicateBuyerPhoneError extends Error {
  constructor() {
    super("Buyer phone must be unique");
  }
}

export class BuyerLockedError extends Error {
  constructor() {
    super("Buyer cannot be edited after it has sales invoice history");
  }
}

export function mapBuyerRowToBuyer(row: BuyerRow): Buyer {
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
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  ) {
    return new DuplicateBuyerPhoneError();
  }

  return error;
}

export function normalizeBuyerSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

export async function listBuyers(query?: string) {
  const normalizedQuery = normalizeBuyerSearchQuery(query);
  const buyers = await db
    .select()
    .from(buyersTable)
    .where(
      normalizedQuery ? like(buyersTable.name, `%${normalizedQuery}%`) : undefined,
    )
    .orderBy(asc(buyersTable.id));

  return buyers.map(mapBuyerRowToBuyer);
}

export async function getBuyerById(id: number) {
  const buyer = await db.query.buyersTable.findFirst({
    where: eq(buyersTable.id, id),
  });

  return buyer ? mapBuyerRowToBuyer(buyer) : null;
}

export async function createBuyer(
  input: Omit<Buyer, "id" | "createdAt" | "updatedAt">,
) {
  try {
    const inserted = await db.insert(buyersTable).values(toBuyerInsert(input)).$returningId();
    const buyer = await getBuyerById(inserted[0]?.id ?? 0);

    if (!buyer) {
      throw new Error("Failed to load created buyer");
    }

    return buyer;
  } catch (error) {
    throw toDatabaseError(error);
  }
}

export async function updateBuyer(
  id: number,
  input: Partial<Omit<Buyer, "id" | "createdAt" | "updatedAt">>,
) {
  const existingBuyer = await getBuyerById(id);

  if (!existingBuyer) {
    return null;
  }

  if (await buyerHasSalesInvoiceHistory(id)) {
    throw new BuyerLockedError();
  }

  try {
    await db
      .update(buyersTable)
      .set({
        ...toBuyerUpdate(input),
        updatedAt: new Date(),
      })
      .where(eq(buyersTable.id, id));

    return getBuyerById(id);
  } catch (error) {
    throw toDatabaseError(error);
  }
}

export async function deleteBuyer(id: number) {
  if (await buyerHasSalesInvoiceHistory(id)) {
    throw new BuyerLockedError();
  }

  const result = await db.delete(buyersTable).where(eq(buyersTable.id, id));
  return result[0].affectedRows > 0;
}

function toBuyerInsert(input: Omit<Buyer, "id" | "createdAt" | "updatedAt">): BuyerInsert {
  return {
    name: input.name,
    phone: input.phone,
    where: input.where ?? null,
    notes: input.notes ?? null,
  };
}

function toBuyerUpdate(input: Partial<Omit<Buyer, "id" | "createdAt" | "updatedAt">>) {
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
