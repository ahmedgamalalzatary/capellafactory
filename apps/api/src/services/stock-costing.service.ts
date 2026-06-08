import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  ingredientPurchaseLinesTable,
  ingredientPurchasesTable,
  ingredientsTable,
  productionBatchLinesTable,
  productionBatchesTable,
  productsTable,
} from "../db/schema/index.js";
import {
  getStockLedgerSnapshot,
  replayStockEvents,
  type StockLedgerBalances,
  type StockReplayEvent,
} from "../utils/stock-ledger.js";

type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type StockExecutor = typeof db | DrizzleTransaction;

export async function recalculateStockBalances(executor?: StockExecutor) {
  // Run the whole recompute atomically. When called inside an existing
  // transaction (e.g. while creating a purchase/batch) reuse that handle so the
  // mutation and balance update commit or roll back together; otherwise open a
  // dedicated transaction.
  if (!executor) {
    await db.transaction((tx) => recalculateStockBalances(tx));
    return;
  }

  const tx = executor;
  const purchases = await tx
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

  const productionLines = await tx
    .select({
      batchId: productionBatchesTable.id,
      occurredAt: productionBatchesTable.occurredAt,
      productId: productionBatchesTable.productId,
      producedQuantity: productionBatchesTable.producedQuantity,
      totalCost: productionBatchesTable.totalCost,
      ingredientId: productionBatchLinesTable.ingredientId,
      normalizedQuantity: productionBatchLinesTable.normalizedQuantity,
      lineCost: productionBatchLinesTable.lineCost,
    })
    .from(productionBatchesTable)
    .innerJoin(
      productionBatchLinesTable,
      eq(productionBatchesTable.id, productionBatchLinesTable.batchId),
    )
    .orderBy(asc(productionBatchesTable.occurredAt), asc(productionBatchesTable.id));

  const events: StockReplayEvent[] = [
    ...purchases.map((purchase) => ({
      id: purchase.purchaseId,
      occurredAt: purchase.occurredAt,
      kind: "ingredient-purchase" as const,
      ingredientId: purchase.ingredientId,
      quantity: Number(purchase.normalizedQuantity),
      cost: Number(purchase.lineTotal),
    })),
    ...productionLines.map((line) => ({
      id: line.batchId,
      occurredAt: line.occurredAt,
      kind: "production-consumption" as const,
      ingredientId: line.ingredientId,
      quantity: Number(line.normalizedQuantity),
      cost: Number(line.lineCost),
    })),
    ...dedupeProductionOutputs(productionLines).map((line) => ({
      id: line.batchId,
      occurredAt: line.occurredAt,
      kind: "production-output" as const,
      productId: line.productId,
      quantity: Number(line.producedQuantity),
      cost: Number(line.totalCost),
    })),
  ];

  // Chronological replay. Throws StockLedgerConflictError if any event (e.g. a
  // backdated batch) drives an ingredient balance negative, which rolls back
  // the surrounding transaction.
  const { ingredientBalances, productBalances } = replayStockEvents(events);

  await persistIngredientBalances(tx, ingredientBalances);
  await persistProductBalances(tx, productBalances);
}

export async function recalculateIngredientBalances(executor?: StockExecutor) {
  await recalculateStockBalances(executor);
}

async function persistIngredientBalances(tx: StockExecutor, balances: StockLedgerBalances) {
  const ingredients = await tx.select().from(ingredientsTable);

  for (const ingredient of ingredients) {
    const snapshot = getStockLedgerSnapshot(balances, ingredient.id);

    await tx
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

async function persistProductBalances(tx: StockExecutor, balances: StockLedgerBalances) {
  const products = await tx.select().from(productsTable);

  for (const product of products) {
    const snapshot = getStockLedgerSnapshot(balances, product.id);

    await tx
      .update(productsTable)
      .set({
        stockQuantity: snapshot.quantity.toFixed(3),
        averageUnitCost: snapshot.averageUnitCost.toFixed(6),
        hasHistory: snapshot.hasHistory,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, product.id));
  }
}

function dedupeProductionOutputs<T extends { batchId: number }>(lines: T[]) {
  const seenBatchIds = new Set<number>();
  return lines.filter((line) => {
    if (seenBatchIds.has(line.batchId)) {
      return false;
    }

    seenBatchIds.add(line.batchId);
    return true;
  });
}
