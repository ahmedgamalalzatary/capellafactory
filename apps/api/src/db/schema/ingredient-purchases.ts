import {
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { ingredientsTable } from "./ingredients.js";
import { suppliersTable } from "./suppliers.js";

export const ingredientPurchasesTable = mysqlTable(
  "ingredient_purchases",
  {
    id: int("id").autoincrement().primaryKey(),
    invoiceCode: varchar("invoice_code", { length: 32 }).notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    baseTotal: decimal("base_total", { precision: 14, scale: 3 }).notNull(),
    taxState: mysqlEnum("tax_state", ["active", "inactive"]).notNull(),
    taxType: mysqlEnum("tax_type", ["amount", "percentage"]),
    taxValue: decimal("tax_value", { precision: 14, scale: 3 }).notNull(),
    taxAmount: decimal("tax_amount", { precision: 14, scale: 3 }).notNull(),
    totalAfterTax: decimal("total_after_tax", { precision: 14, scale: 3 }).notNull(),
    discountState: mysqlEnum("discount_state", ["active", "inactive"]).notNull(),
    discountType: mysqlEnum("discount_type", ["amount", "percentage"]),
    discountValue: decimal("discount_value", { precision: 14, scale: 3 }).notNull(),
    discountAmount: decimal("discount_amount", { precision: 14, scale: 3 }).notNull(),
    finalTotal: decimal("final_total", { precision: 14, scale: 3 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 14, scale: 3 }).notNull(),
    supplierId: int("supplier_id").references(() => suppliersTable.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    supplierName: varchar("supplier_name", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    invoiceCodeUniqueIndex: uniqueIndex("ingredient_purchases_invoice_code_unique").on(
      table.invoiceCode,
    ),
    occurredAtIndex: index("ingredient_purchases_occurred_at_index").on(table.occurredAt),
    finalTotalIndex: index("ingredient_purchases_final_total_index").on(table.finalTotal),
    supplierIdIndex: index("ingredient_purchases_supplier_id_index").on(table.supplierId),
  }),
);

export const ingredientPurchasePaymentsTable = mysqlTable(
  "ingredient_purchase_payments",
  {
    id: int("id").autoincrement().primaryKey(),
    purchaseId: int("purchase_id").notNull(),
    amount: decimal("amount", { precision: 14, scale: 3 }).notNull(),
    paymentMethod: mysqlEnum("payment_method", [
      "visa",
      "vodafone_cash",
      "cod",
      "instapay",
    ]).notNull(),
    paidAt: timestamp("paid_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Explicit short name: the drizzle-derived name exceeds MySQL's 64-char identifier limit.
    purchaseFk: foreignKey({
      name: "ingredient_purchase_payments_purchase_fk",
      columns: [table.purchaseId],
      foreignColumns: [ingredientPurchasesTable.id],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    purchaseIdIndex: index("ingredient_purchase_payments_purchase_id_index").on(table.purchaseId),
    paidAtIndex: index("ingredient_purchase_payments_paid_at_index").on(table.paidAt),
  }),
);

export const ingredientPurchaseLinesTable = mysqlTable(
  "ingredient_purchase_lines",
  {
    id: int("id").autoincrement().primaryKey(),
    purchaseId: int("purchase_id")
      .notNull()
      .references(() => ingredientPurchasesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ingredientId: int("ingredient_id")
      .notNull()
      .references(() => ingredientsTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    quantity: decimal("quantity", { precision: 14, scale: 3 }).notNull(),
    unit: mysqlEnum("unit", ["kg", "g", "L", "ml", "piece"]).notNull(),
    unitPrice: decimal("unit_price", { precision: 14, scale: 3 }).notNull(),
    lineTotal: decimal("line_total", { precision: 14, scale: 3 }).notNull(),
    normalizedQuantity: decimal("normalized_quantity", { precision: 14, scale: 3 }).notNull(),
  },
  (table) => ({
    purchaseIdIndex: index("ingredient_purchase_lines_purchase_id_index").on(table.purchaseId),
    ingredientIdIndex: index("ingredient_purchase_lines_ingredient_id_index").on(table.ingredientId),
  }),
);
