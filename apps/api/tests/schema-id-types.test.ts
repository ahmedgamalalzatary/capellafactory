import test from "node:test";
import assert from "node:assert/strict";
import { getTableConfig } from "drizzle-orm/mysql-core";
import {
  authSessionsTable,
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
  solidAssetsTable,
  suppliersTable,
} from "../src/db/schema/index.js";

function foreignKeyNames(table: Parameters<typeof getTableConfig>[0]) {
  return getTableConfig(table).foreignKeys.map((foreignKey) => foreignKey.getName());
}

function foreignKeyActions(table: Parameters<typeof getTableConfig>[0]) {
  return Object.fromEntries(
    getTableConfig(table).foreignKeys.map((foreignKey) => [
      foreignKey.getName(),
      {
        onDelete: foreignKey.onDelete,
        onUpdate: foreignKey.onUpdate,
      },
    ]),
  );
}

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

test("document header tables expose tax discount and final total columns", () => {
  for (const table of [ingredientPurchasesTable, salesInvoicesTable, expensesTable]) {
    assert.equal(table.baseTotal.getSQLType(), "decimal(14,3)");
    assert.equal(table.taxState.getSQLType(), "enum('active','inactive')");
    assert.equal(table.taxType.getSQLType(), "enum('amount','percentage')");
    assert.equal(table.taxValue.getSQLType(), "decimal(14,3)");
    assert.equal(table.taxAmount.getSQLType(), "decimal(14,3)");
    assert.equal(table.totalAfterTax.getSQLType(), "decimal(14,3)");
    assert.equal(table.discountState.getSQLType(), "enum('active','inactive')");
    assert.equal(table.discountType.getSQLType(), "enum('amount','percentage')");
    assert.equal(table.discountValue.getSQLType(), "decimal(14,3)");
    assert.equal(table.discountAmount.getSQLType(), "decimal(14,3)");
    assert.equal(table.finalTotal.getSQLType(), "decimal(14,3)");
  }
});

test("solid assets table exposes constrained quantity and price columns", () => {
  assert.equal(solidAssetsTable.qty.getSQLType(), "int");
  assert.equal(solidAssetsTable.priceOfOne.getSQLType(), "decimal(14,3)");
  assert.deepEqual(
    getTableConfig(solidAssetsTable).checks.map((entry) => entry.name),
    ["solid_assets_qty_check", "solid_assets_price_of_one_check"],
  );
});

test("schema defines foreign keys for clear single-parent relationships", () => {
  assert.deepEqual(foreignKeyNames(authSessionsTable), [
    "auth_sessions_admin_id_admins_id_fk",
  ]);
  assert.deepEqual(foreignKeyNames(ingredientPurchasesTable), [
    "ingredient_purchases_supplier_id_suppliers_id_fk",
  ]);
  assert.deepEqual(foreignKeyNames(ingredientPurchaseLinesTable), [
    "ingredient_purchase_lines_purchase_id_ingredient_purchases_id_fk",
    "ingredient_purchase_lines_ingredient_id_ingredients_id_fk",
  ]);
  assert.deepEqual(foreignKeyNames(purchaseCorrectionsTable), [
    "fk_purchase_corrections_source_purchase",
  ]);
  assert.deepEqual(foreignKeyNames(purchaseCorrectionLinesTable), [
    "purchase_correction_lines_ingredient_id_ingredients_id_fk",
    "fk_purchase_correction_lines_correction",
    "fk_purchase_correction_lines_source_line",
  ]);
  assert.deepEqual(foreignKeyNames(productionBatchesTable), [
    "production_batches_product_id_products_id_fk",
  ]);
  assert.deepEqual(foreignKeyNames(productionBatchLinesTable), [
    "production_batch_lines_batch_id_production_batches_id_fk",
    "production_batch_lines_ingredient_id_ingredients_id_fk",
  ]);
  assert.deepEqual(foreignKeyNames(salesInvoicesTable), [
    "sales_invoices_buyer_id_buyers_id_fk",
  ]);
  assert.deepEqual(foreignKeyNames(salesInvoiceLinesTable), [
    "sales_invoice_lines_invoice_id_sales_invoices_id_fk",
    "sales_invoice_lines_product_id_products_id_fk",
  ]);
  assert.deepEqual(foreignKeyNames(stockLayerAllocationsTable), [
    "stock_layer_allocations_stock_layer_id_stock_layers_id_fk",
  ]);

  assert.deepEqual(foreignKeyNames(stockLayersTable), []);
});

test("schema foreign keys use the intended delete and update actions", () => {
  const cascade = { onDelete: "cascade", onUpdate: "cascade" };
  const restrict = { onDelete: "restrict", onUpdate: "cascade" };

  assert.deepEqual(foreignKeyActions(authSessionsTable), {
    auth_sessions_admin_id_admins_id_fk: cascade,
  });
  assert.deepEqual(foreignKeyActions(ingredientPurchasesTable), {
    ingredient_purchases_supplier_id_suppliers_id_fk: restrict,
  });
  assert.deepEqual(foreignKeyActions(ingredientPurchaseLinesTable), {
    ingredient_purchase_lines_purchase_id_ingredient_purchases_id_fk: cascade,
    ingredient_purchase_lines_ingredient_id_ingredients_id_fk: restrict,
  });
  assert.deepEqual(foreignKeyActions(purchaseCorrectionsTable), {
    fk_purchase_corrections_source_purchase: restrict,
  });
  assert.deepEqual(foreignKeyActions(purchaseCorrectionLinesTable), {
    purchase_correction_lines_ingredient_id_ingredients_id_fk: restrict,
    fk_purchase_correction_lines_correction: cascade,
    fk_purchase_correction_lines_source_line: restrict,
  });
  assert.deepEqual(foreignKeyActions(productionBatchesTable), {
    production_batches_product_id_products_id_fk: restrict,
  });
  assert.deepEqual(foreignKeyActions(productionBatchLinesTable), {
    production_batch_lines_batch_id_production_batches_id_fk: cascade,
    production_batch_lines_ingredient_id_ingredients_id_fk: restrict,
  });
  assert.deepEqual(foreignKeyActions(salesInvoicesTable), {
    sales_invoices_buyer_id_buyers_id_fk: restrict,
  });
  assert.deepEqual(foreignKeyActions(salesInvoiceLinesTable), {
    sales_invoice_lines_invoice_id_sales_invoices_id_fk: cascade,
    sales_invoice_lines_product_id_products_id_fk: restrict,
  });
  assert.deepEqual(foreignKeyActions(stockLayerAllocationsTable), {
    stock_layer_allocations_stock_layer_id_stock_layers_id_fk: restrict,
  });
});
