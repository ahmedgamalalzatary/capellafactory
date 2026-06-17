import {
  decimal,
  index,
  int,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { buyersTable } from "./buyers.js";
import { productsTable } from "./products.js";

export const salesInvoicesTable = mysqlTable(
  "sales_invoices",
  {
    id: int("id").autoincrement().primaryKey(),
    invoiceCode: varchar("invoice_code", { length: 32 }).notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    buyerId: int("buyer_id")
      .notNull()
      .references(() => buyersTable.id, { onDelete: "restrict", onUpdate: "cascade" }),
    subtotal: decimal("subtotal", { precision: 14, scale: 3 }).notNull(),
    totalCost: decimal("total_cost", { precision: 14, scale: 3 }).notNull(),
    grossProfit: decimal("gross_profit", { precision: 14, scale: 3 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    invoiceCodeUniqueIndex: uniqueIndex("sales_invoices_invoice_code_unique").on(
      table.invoiceCode,
    ),
    occurredAtIndex: index("sales_invoices_occurred_at_index").on(table.occurredAt),
    buyerIdIndex: index("sales_invoices_buyer_id_index").on(table.buyerId),
  }),
);

export const salesInvoiceLinesTable = mysqlTable(
  "sales_invoice_lines",
  {
    id: int("id").autoincrement().primaryKey(),
    invoiceId: int("invoice_id")
      .notNull()
      .references(() => salesInvoicesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    productId: int("product_id")
      .notNull()
      .references(() => productsTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    quantity: decimal("quantity", { precision: 14, scale: 3 }).notNull(),
    sellingUnitPrice: decimal("selling_unit_price", { precision: 14, scale: 3 }).notNull(),
    lineTotal: decimal("line_total", { precision: 14, scale: 3 }).notNull(),
    unitCost: decimal("unit_cost", { precision: 14, scale: 6 }).notNull(),
    lineCost: decimal("line_cost", { precision: 14, scale: 3 }).notNull(),
  },
  (table) => ({
    invoiceIdIndex: index("sales_invoice_lines_invoice_id_index").on(table.invoiceId),
    productIdIndex: index("sales_invoice_lines_product_id_index").on(table.productId),
  }),
);
