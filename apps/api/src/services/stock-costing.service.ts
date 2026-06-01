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
  applyStockLedgerEntry,
  getStockLedgerSnapshot,
  type StockLedgerBalances,
} from "../utils/stock-ledger.js";

type StockReplayEvent =
  | {
      id: number;
      occurredAt: Date | string;
      kind: "ingredient-purchase";
      ingredientId: number;
      quantity: number;
      cost: number;
    }
  | {
      id: number;
      occurredAt: Date | string;
      kind: "production-consumption";
      ingredientId: number;
      quantity: number;
      cost: number;
    }
  | {
      id: number;
      occurredAt: Date | string;
      kind: "production-output";
      productId: number;
      quantity: number;
      cost: number;
    };

export async function recalculateStockBalances() {
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

  const productionLines = await db
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
  ].sort(compareStockReplayEvents);

  const ingredientBalances: StockLedgerBalances = new Map();
  const productBalances: StockLedgerBalances = new Map();

  for (const event of events) {
    if (event.kind === "ingredient-purchase") {
      applyStockLedgerEntry(ingredientBalances, {
        itemId: event.ingredientId,
        quantityDelta: event.quantity,
        costDelta: event.cost,
      });
    } else if (event.kind === "production-consumption") {
      applyStockLedgerEntry(ingredientBalances, {
        itemId: event.ingredientId,
        quantityDelta: -event.quantity,
        costDelta: -event.cost,
      });
    } else {
      applyStockLedgerEntry(productBalances, {
        itemId: event.productId,
        quantityDelta: event.quantity,
        costDelta: event.cost,
      });
    }
  }

  await persistIngredientBalances(ingredientBalances);
  await persistProductBalances(productBalances);
}

export async function recalculateIngredientBalances() {
  await recalculateStockBalances();
}

async function persistIngredientBalances(balances: StockLedgerBalances) {
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

async function persistProductBalances(balances: StockLedgerBalances) {
  const products = await db.select().from(productsTable);

  for (const product of products) {
    const snapshot = getStockLedgerSnapshot(balances, product.id);

    await db
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

function compareStockReplayEvents(left: StockReplayEvent, right: StockReplayEvent) {
  const leftTime = new Date(left.occurredAt).getTime();
  const rightTime = new Date(right.occurredAt).getTime();

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return left.id - right.id;
}
