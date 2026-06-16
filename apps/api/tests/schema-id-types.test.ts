import test from "node:test";
import assert from "node:assert/strict";
import {
  buyersTable,
  expensesTable,
  purchaseCorrectionLinesTable,
  purchaseCorrectionsTable,
  ingredientPurchaseLinesTable,
  ingredientPurchasesTable,
  ingredientsTable,
  productionBatchLinesTable,
  productionBatchesTable,
  productsTable,
  salesInvoiceLinesTable,
  salesInvoicesTable,
  stockLayerAllocationsTable,
  stockLayersTable,
  suppliersTable,
} from "../src/db/schema/index.js";

test("all primary and related id columns use int in the mysql schema", () => {
  const columns = [
    buyersTable.id,
    expensesTable.id,
    ingredientPurchasesTable.id,
    ingredientPurchasesTable.supplierId,
    ingredientPurchaseLinesTable.id,
    ingredientPurchaseLinesTable.purchaseId,
    ingredientPurchaseLinesTable.ingredientId,
    purchaseCorrectionsTable.id,
    purchaseCorrectionsTable.sourcePurchaseId,
    purchaseCorrectionLinesTable.id,
    purchaseCorrectionLinesTable.correctionId,
    purchaseCorrectionLinesTable.sourcePurchaseLineId,
    purchaseCorrectionLinesTable.ingredientId,
    ingredientsTable.id,
    productionBatchesTable.id,
    productionBatchesTable.productId,
    productionBatchLinesTable.id,
    productionBatchLinesTable.batchId,
    productionBatchLinesTable.ingredientId,
    productsTable.id,
    salesInvoicesTable.id,
    salesInvoicesTable.buyerId,
    salesInvoiceLinesTable.id,
    salesInvoiceLinesTable.invoiceId,
    salesInvoiceLinesTable.productId,
    stockLayersTable.id,
    stockLayersTable.itemId,
    stockLayersTable.sourceDocumentId,
    stockLayersTable.sourceLineId,
    stockLayerAllocationsTable.id,
    stockLayerAllocationsTable.itemId,
    stockLayerAllocationsTable.outboundDocumentId,
    stockLayerAllocationsTable.outboundLineId,
    stockLayerAllocationsTable.stockLayerId,
    suppliersTable.id,
  ];

  for (const column of columns) {
    assert.equal(column.getSQLType(), "int");
  }
});

test("fifo layer tables expose the expected quantity and costing columns", () => {
  assert.equal(stockLayersTable.originalQuantity.getSQLType(), "decimal(14,3)");
  assert.equal(stockLayersTable.remainingQuantity.getSQLType(), "decimal(14,3)");
  assert.equal(stockLayersTable.unitCost.getSQLType(), "decimal(14,6)");
  assert.equal(stockLayersTable.totalCost.getSQLType(), "decimal(14,3)");
  assert.equal(stockLayerAllocationsTable.allocatedQuantity.getSQLType(), "decimal(14,3)");
  assert.equal(stockLayerAllocationsTable.unitCost.getSQLType(), "decimal(14,6)");
  assert.equal(stockLayerAllocationsTable.allocatedCost.getSQLType(), "decimal(14,3)");
});

test("sales invoice tables expose expected money and FIFO cost columns", () => {
  assert.equal(salesInvoicesTable.subtotal.getSQLType(), "decimal(14,3)");
  assert.equal(salesInvoicesTable.totalCost.getSQLType(), "decimal(14,3)");
  assert.equal(salesInvoicesTable.grossProfit.getSQLType(), "decimal(14,3)");
  assert.equal(salesInvoiceLinesTable.quantity.getSQLType(), "decimal(14,3)");
  assert.equal(salesInvoiceLinesTable.sellingUnitPrice.getSQLType(), "decimal(14,3)");
  assert.equal(salesInvoiceLinesTable.lineTotal.getSQLType(), "decimal(14,3)");
  assert.equal(salesInvoiceLinesTable.unitCost.getSQLType(), "decimal(14,6)");
  assert.equal(salesInvoiceLinesTable.lineCost.getSQLType(), "decimal(14,3)");
});
