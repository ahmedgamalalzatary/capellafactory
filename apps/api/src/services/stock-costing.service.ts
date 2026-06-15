import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  ingredientsTable,
  productsTable,
  stockLayersTable,
} from "../db/schema/index.js";
import {
  buildFifoStatesFromLayers,
  getFifoStockSnapshot,
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
  const allLayers = await tx
    .select({
      id: stockLayersTable.id,
      domain: stockLayersTable.domain,
      itemId: stockLayersTable.itemId,
      sourceDocumentType: stockLayersTable.sourceDocumentType,
      sourceDocumentId: stockLayersTable.sourceDocumentId,
      sourceLineId: stockLayersTable.sourceLineId,
      originalQuantity: stockLayersTable.originalQuantity,
      remainingQuantity: stockLayersTable.remainingQuantity,
      unitCost: stockLayersTable.unitCost,
      totalCost: stockLayersTable.totalCost,
      occurredAt: stockLayersTable.occurredAt,
    })
    .from(stockLayersTable);

  const ingredientStates = buildFifoStatesFromLayers(
    allLayers
      .filter((layer) => layer.domain === "ingredient")
      .map((layer) => ({
        ...layer,
        originalQuantity: Number(layer.originalQuantity),
        remainingQuantity: Number(layer.remainingQuantity),
        unitCost: Number(layer.unitCost),
        totalCost: Number(layer.totalCost),
      })),
  );
  const productStates = buildFifoStatesFromLayers(
    allLayers
      .filter((layer) => layer.domain === "product")
      .map((layer) => ({
        ...layer,
        originalQuantity: Number(layer.originalQuantity),
        remainingQuantity: Number(layer.remainingQuantity),
        unitCost: Number(layer.unitCost),
        totalCost: Number(layer.totalCost),
      })),
  );

  await persistIngredientBalances(tx, ingredientStates);
  await persistProductBalances(tx, productStates);
}

export async function recalculateIngredientBalances(executor?: StockExecutor) {
  await recalculateStockBalances(executor);
}

async function persistIngredientBalances(
  tx: StockExecutor,
  states: ReturnType<typeof buildFifoStatesFromLayers>,
) {
  const ingredients = await tx.select().from(ingredientsTable);

  for (const ingredient of ingredients) {
    const snapshot = getFifoStockSnapshot(states, ingredient.id);

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

async function persistProductBalances(
  tx: StockExecutor,
  states: ReturnType<typeof buildFifoStatesFromLayers>,
) {
  const products = await tx.select().from(productsTable);

  for (const product of products) {
    const snapshot = getFifoStockSnapshot(states, product.id);

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
