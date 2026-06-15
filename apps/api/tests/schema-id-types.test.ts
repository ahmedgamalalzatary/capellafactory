import test from "node:test";
import assert from "node:assert/strict";
import {
  buyersTable,
  expensesTable,
  ingredientPurchaseLinesTable,
  ingredientPurchasesTable,
  ingredientsTable,
  productionBatchLinesTable,
  productionBatchesTable,
  productsTable,
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
    ingredientsTable.id,
    productionBatchesTable.id,
    productionBatchesTable.productId,
    productionBatchLinesTable.id,
    productionBatchLinesTable.batchId,
    productionBatchLinesTable.ingredientId,
    productsTable.id,
    suppliersTable.id,
  ];

  for (const column of columns) {
    assert.equal(column.getSQLType(), "int");
  }
});
