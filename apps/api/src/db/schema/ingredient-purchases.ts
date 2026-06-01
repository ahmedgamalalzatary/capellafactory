import {
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const ingredientPurchasesTable = mysqlTable(
  "ingredient_purchases",
  {
    id: serial("id").primaryKey(),
    invoiceCode: varchar("invoice_code", { length: 32 }).notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    supplierId: int("supplier_id"),
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
    id: serial("id").primaryKey(),
    purchaseId: int("purchase_id").notNull(),
    ingredientId: int("ingredient_id").notNull(),
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
