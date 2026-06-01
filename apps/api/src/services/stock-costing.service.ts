import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  ingredientPurchaseLinesTable,
  ingredientPurchasesTable,
  ingredientsTable,
} from "../db/schema/index.js";

type PurchaseReplayLine = {
  ingredientId: number;
  lineTotal: number;
  normalizedQuantity: number;
};

export async function recalculateIngredientBalances() {
  const purchases = await db
    .select({
      purchaseId: ingredientPurchasesTable.id,
      occurredAt: ingredientPurchasesTable.occurredAt,
      ingredientId: ingredientPurchaseLinesTable.ingredientId,
      lineTotal: ingredientPurchaseLinesTable.lineTotal,
      normalizedQuantity: ingredientPurchaseLinesTable.normalizedQuantity,
    })
    .from(ingredientPurchasesTable)
    .innerJoin(
      ingredientPurchaseLinesTable,
      eq(ingredientPurchasesTable.id, ingredientPurchaseLinesTable.purchaseId),
    )
    .orderBy(asc(ingredientPurchasesTable.occurredAt), asc(ingredientPurchasesTable.id));

  const balances = new Map<number, { quantity: number; totalCost: number }>();

  for (const purchase of purchases) {
    applyPurchaseReplayLine(balances, {
      ingredientId: purchase.ingredientId,
      lineTotal: Number(purchase.lineTotal),
      normalizedQuantity: Number(purchase.normalizedQuantity),
    });
  }

  const ingredients = await db.select().from(ingredientsTable);

  for (const ingredient of ingredients) {
    const balance = balances.get(ingredient.id);
    const quantity = balance?.quantity ?? 0;
    const totalCost = balance?.totalCost ?? 0;
    const averageUnitCost = quantity > 0 ? totalCost / quantity : 0;

    await db
      .update(ingredientsTable)
      .set({
        stockQuantity: quantity.toFixed(3),
        averageUnitCost: averageUnitCost.toFixed(6),
        hasHistory: Boolean(balance),
        updatedAt: new Date(),
      })
      .where(eq(ingredientsTable.id, ingredient.id));
  }
}

function applyPurchaseReplayLine(
  balances: Map<number, { quantity: number; totalCost: number }>,
  line: PurchaseReplayLine,
) {
  const current = balances.get(line.ingredientId) ?? { quantity: 0, totalCost: 0 };

  current.quantity += line.normalizedQuantity;
  current.totalCost += line.lineTotal;

  balances.set(line.ingredientId, current);
}
