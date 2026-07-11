import { and, asc, eq, like } from "drizzle-orm";
import type {
  Ingredient,
  IngredientBaseUnit,
  IngredientInput,
} from "@capella/shared/ingredients/ingredient.types";
import { escapeLike } from "../../utils/search.js";
import { db } from "../../db/index.js";
import { ingredientsTable } from "../../db/schema/ingredients.js";

type IngredientRow = typeof ingredientsTable.$inferSelect;
type IngredientInsert = typeof ingredientsTable.$inferInsert;

export class DuplicateIngredientNameError extends Error {
  constructor() {
    super("اسم الخامة مستخدم بالفعل");
  }
}

export class IngredientLockedError extends Error {
  constructor() {
    super("لا يمكن تعديل الخامة لوجود سجل حركات مرتبط بها");
  }
}

export class IngredientArchiveConflictError extends Error {
  constructor() {
    super("لا يمكن أرشفة الخامة إلا عندما يكون رصيدها صفرًا");
  }
}

export class IngredientDeleteConflictError extends Error {
  constructor() {
    super("لا يمكن حذف الخامة إلا عندما يكون رصيدها صفرًا ولا توجد لها حركات");
  }
}

export function mapIngredientRowToIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    unitFamily: row.unitFamily,
    baseUnit: row.baseUnit,
    stockQuantity: Number(row.stockQuantity),
    hasHistory: Boolean(row.hasHistory),
    isArchived: Boolean(row.isArchived),
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  };
}

export function toIngredientDatabaseError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ER_DUP_ENTRY"
  ) {
    return new DuplicateIngredientNameError();
  }

  return error;
}

export function normalizeIngredientSearchQuery(query?: string) {
  const normalized = query?.trim();
  return normalized ? normalized : undefined;
}

export async function listIngredients(query?: string, includeArchived = false) {
  const normalizedQuery = normalizeIngredientSearchQuery(query);
  const ingredients = await db
    .select()
    .from(ingredientsTable)
    .where(
      and(
        includeArchived ? undefined : eq(ingredientsTable.isArchived, false),
        normalizedQuery ? like(ingredientsTable.name, `%${escapeLike(normalizedQuery)}%`) : undefined,
      ),
    )
    .orderBy(asc(ingredientsTable.id));

  return ingredients.map(mapIngredientRowToIngredient);
}

export async function getIngredientById(id: number) {
  const ingredient = await db.query.ingredientsTable.findFirst({
    where: eq(ingredientsTable.id, id),
  });

  return ingredient ? mapIngredientRowToIngredient(ingredient) : null;
}

export async function createIngredient(input: IngredientInput) {
  try {
    const inserted = await db
      .insert(ingredientsTable)
      .values(toIngredientInsert(input))
      .$returningId();
    const ingredient = await getIngredientById(inserted[0]?.id ?? 0);

    if (!ingredient) {
      throw new Error("تعذر تحميل الخامة التي تم إنشاؤها");
    }

    return ingredient;
  } catch (error) {
    throw toIngredientDatabaseError(error);
  }
}

export async function updateIngredient(id: number, input: Partial<IngredientInput>) {
  const existingIngredient = await getIngredientById(id);

  if (!existingIngredient) {
    return null;
  }

  if (existingIngredient.hasHistory) {
    throw new IngredientLockedError();
  }

  try {
    await db
      .update(ingredientsTable)
      .set({
        ...toIngredientUpdate(input),
        updatedAt: new Date(),
      })
      .where(eq(ingredientsTable.id, id));

    return getIngredientById(id);
  } catch (error) {
    throw toIngredientDatabaseError(error);
  }
}

export async function archiveIngredient(id: number) {
  const existingIngredient = await getIngredientById(id);

  if (!existingIngredient) {
    return null;
  }

  if (existingIngredient.stockQuantity !== 0) {
    throw new IngredientArchiveConflictError();
  }

  await db
    .update(ingredientsTable)
    .set({
      isArchived: true,
      updatedAt: new Date(),
    })
    .where(eq(ingredientsTable.id, id));

  return getIngredientById(id);
}

export async function reactivateIngredient(id: number) {
  const existingIngredient = await getIngredientById(id);

  if (!existingIngredient) {
    return null;
  }

  await db
    .update(ingredientsTable)
    .set({
      isArchived: false,
      updatedAt: new Date(),
    })
    .where(eq(ingredientsTable.id, id));

  return getIngredientById(id);
}

export async function deleteIngredient(id: number) {
  const existingIngredient = await getIngredientById(id);

  if (!existingIngredient) {
    return false;
  }

  if (existingIngredient.stockQuantity !== 0 || existingIngredient.hasHistory) {
    throw new IngredientDeleteConflictError();
  }

  const result = await db.delete(ingredientsTable).where(eq(ingredientsTable.id, id));
  return result[0].affectedRows > 0;
}

function toIngredientInsert(input: IngredientInput): IngredientInsert {
  return {
    name: input.name,
    unitFamily: input.unitFamily,
    baseUnit: toBaseUnit(input.unitFamily),
  };
}

function toIngredientUpdate(input: Partial<IngredientInput>) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.unitFamily !== undefined
      ? {
          unitFamily: input.unitFamily,
          baseUnit: toBaseUnit(input.unitFamily),
        }
      : {}),
  };
}

function toBaseUnit(unitFamily: IngredientInput["unitFamily"]): IngredientBaseUnit {
  if (unitFamily === "weight") {
    return "g";
  }

  if (unitFamily === "volume") {
    return "ml";
  }

  return "piece";
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
