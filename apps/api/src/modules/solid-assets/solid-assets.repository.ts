import { asc, eq, like } from "drizzle-orm";
import type {
  SolidAsset,
  SolidAssetInput,
  SolidAssetWithTotalPrice,
} from "@capella/shared/solid-assets/solid-asset.types";
import { db } from "../../db/index.js";
import { solidAssetsTable } from "../../db/schema/solid-assets.js";

type SolidAssetRow = typeof solidAssetsTable.$inferSelect;
type SolidAssetInsert = typeof solidAssetsTable.$inferInsert;

export function mapSolidAssetRowToSolidAsset(row: SolidAssetRow): SolidAssetWithTotalPrice {
  const qty = Number(row.qty);
  const priceOfOne = Number(row.priceOfOne);

  return {
    id: row.id,
    name: row.name,
    qty,
    priceOfOne,
    totalPrice: Number((qty * priceOfOne).toFixed(3)),
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function normalizeSolidAssetSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

export async function listSolidAssets(query?: string) {
  const normalizedQuery = normalizeSolidAssetSearchQuery(query);
  const rows = await db
    .select()
    .from(solidAssetsTable)
    .where(normalizedQuery ? like(solidAssetsTable.name, `%${normalizedQuery}%`) : undefined)
    .orderBy(asc(solidAssetsTable.id));

  return rows.map(mapSolidAssetRowToSolidAsset);
}

export async function getSolidAssetById(id: number) {
  const row = await db.query.solidAssetsTable.findFirst({
    where: eq(solidAssetsTable.id, id),
  });

  return row ? mapSolidAssetRowToSolidAsset(row) : null;
}

export async function createSolidAsset(input: SolidAssetInput) {
  const inserted = await db.insert(solidAssetsTable).values(toSolidAssetInsert(input)).$returningId();
  const asset = await getSolidAssetById(inserted[0]?.id ?? 0);

  if (!asset) {
    throw new Error("Failed to load created solid asset");
  }

  return asset;
}

export async function updateSolidAsset(id: number, input: Partial<SolidAssetInput>) {
  const existing = await getSolidAssetById(id);

  if (!existing) {
    return null;
  }

  await db
    .update(solidAssetsTable)
    .set({
      ...toSolidAssetUpdate(input),
      updatedAt: new Date(),
    })
    .where(eq(solidAssetsTable.id, id));

  return getSolidAssetById(id);
}

export async function deleteSolidAsset(id: number) {
  const result = await db.delete(solidAssetsTable).where(eq(solidAssetsTable.id, id));
  return result[0].affectedRows > 0;
}

function toSolidAssetInsert(input: SolidAssetInput): SolidAssetInsert {
  return {
    name: input.name,
    qty: input.qty,
    priceOfOne: input.priceOfOne.toFixed(3),
  };
}

function toSolidAssetUpdate(input: Partial<SolidAssetInput>) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.qty !== undefined ? { qty: input.qty } : {}),
    ...(input.priceOfOne !== undefined ? { priceOfOne: input.priceOfOne.toFixed(3) } : {}),
  };
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
