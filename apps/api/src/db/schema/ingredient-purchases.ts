import {
  decimal,
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
    supplierIdIndex: index("ingredient_purchases_supplier_id_index").on(table.supplierId),
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
