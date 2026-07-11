import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  ingredientsTable,
  productsTable,
  stockLayerAllocationsTable,
  stockLayersTable,
} from "../db/schema/index.js";
import {
  buildFifoStatesFromLayers,
  getFifoStockSnapshot,
  validateChronologicalStockHistory,
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

  const allAllocations = await tx
    .select({
      id: stockLayerAllocationsTable.id,
      domain: stockLayerAllocationsTable.domain,
      itemId: stockLayerAllocationsTable.itemId,
      outboundDocumentType: stockLayerAllocationsTable.outboundDocumentType,
      allocatedQuantity: stockLayerAllocationsTable.allocatedQuantity,
      occurredAt: stockLayerAllocationsTable.occurredAt,
    })
    .from(stockLayerAllocationsTable);

  // Reject the whole transaction when the recorded history is chronologically
  // impossible (e.g. a backdated document consuming stock that had not arrived
  // yet at that date). Callers translate the conflict into a domain error.
  validateChronologicalStockHistory(
    allLayers.map((layer) => ({
      id: layer.id,
      domain: layer.domain,
      itemId: layer.itemId,
      sourceDocumentType: layer.sourceDocumentType,
      originalQuantity: Number(layer.originalQuantity),
      occurredAt: layer.occurredAt,
    })),
    allAllocations.map((allocation) => ({
      id: allocation.id,
      domain: allocation.domain,
      itemId: allocation.itemId,
      outboundDocumentType: allocation.outboundDocumentType,
      allocatedQuantity: Number(allocation.allocatedQuantity),
      occurredAt: allocation.occurredAt,
    })),
  );

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
