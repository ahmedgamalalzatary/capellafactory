import {
  decimal,
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";
import {
  ingredientPurchaseLinesTable,
  ingredientPurchasesTable,
} from "./ingredient-purchases.js";
import { ingredientsTable } from "./ingredients.js";

export const purchaseCorrectionsTable = mysqlTable(
  "purchase_corrections",
  {
    id: int("id").autoincrement().primaryKey(),
    sourcePurchaseId: int("source_purchase_id").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sourcePurchaseIdIndex: index("purchase_corrections_source_purchase_id_index").on(
      table.sourcePurchaseId,
    ),
    sourcePurchaseForeignKey: foreignKey({
      name: "fk_purchase_corrections_source_purchase",
      columns: [table.sourcePurchaseId],
      foreignColumns: [ingredientPurchasesTable.id],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  }),
);

export const purchaseCorrectionLinesTable = mysqlTable(
  "purchase_correction_lines",
  {
    id: int("id").autoincrement().primaryKey(),
    correctionId: int("correction_id").notNull(),
    sourcePurchaseLineId: int("source_purchase_line_id").notNull(),
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
    correctionIdIndex: index("purchase_correction_lines_correction_id_index").on(table.correctionId),
    sourcePurchaseLineIdIndex: index("purchase_correction_lines_source_purchase_line_id_index").on(
      table.sourcePurchaseLineId,
    ),
    ingredientIdIndex: index("purchase_correction_lines_ingredient_id_index").on(table.ingredientId),
    correctionForeignKey: foreignKey({
      name: "fk_purchase_correction_lines_correction",
      columns: [table.correctionId],
      foreignColumns: [purchaseCorrectionsTable.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    sourcePurchaseLineForeignKey: foreignKey({
      name: "fk_purchase_correction_lines_source_line",
      columns: [table.sourcePurchaseLineId],
      foreignColumns: [ingredientPurchaseLinesTable.id],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  }),
);
