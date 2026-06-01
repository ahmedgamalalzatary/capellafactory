import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  ingredientPurchaseLinesTable,
  ingredientPurchasesTable,
  ingredientsTable,
} from "../db/schema/index.js";
import {
  applyStockLedgerEntry,
  getStockLedgerSnapshot,
  type StockLedgerBalances,
} from "../utils/stock-ledger.js";

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

  const balances: StockLedgerBalances = new Map();

  for (const purchase of purchases) {
    applyStockLedgerEntry(balances, {
      itemId: purchase.ingredientId,
      quantityDelta: Number(purchase.normalizedQuantity),
      costDelta: Number(purchase.lineTotal),
    });
  }

  const ingredients = await db.select().from(ingredientsTable);

  for (const ingredient of ingredients) {
    const snapshot = getStockLedgerSnapshot(balances, ingredient.id);

    await db
      .update(ingredientsTable)
      .set({
        stockQuantity: snapshot.quantity.toFixed(3),
        averageUnitCost: snapshot.averageUnitCost.toFixed(6),
        hasHistory: snapshot.hasHistory,
        updatedAt: new Date(),
      })
      .where(eq(ingredientsTable.id, ingredient.id));
  }
}
