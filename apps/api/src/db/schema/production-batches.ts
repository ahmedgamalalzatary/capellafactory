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
import { productsTable } from "./products.js";

export const productionBatchesTable = mysqlTable(
  "production_batches",
  {
    id: int("id").autoincrement().primaryKey(),
    batchCode: varchar("batch_code", { length: 32 }).notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    productId: int("product_id")
      .notNull()
      .references(() => productsTable.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    producedQuantity: decimal("produced_quantity", { precision: 14, scale: 3 }).notNull(),
    totalCost: decimal("total_cost", { precision: 14, scale: 3 }).notNull(),
    unitCost: decimal("unit_cost", { precision: 14, scale: 6 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    batchCodeUniqueIndex: uniqueIndex("production_batches_batch_code_unique").on(
      table.batchCode,
    ),
    occurredAtIndex: index("production_batches_occurred_at_index").on(table.occurredAt),
    productIdIndex: index("production_batches_product_id_index").on(table.productId),
  }),
);

export const productionBatchLinesTable = mysqlTable(
  "production_batch_lines",
  {
    id: int("id").autoincrement().primaryKey(),
    batchId: int("batch_id")
      .notNull()
      .references(() => productionBatchesTable.id, {
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
    normalizedQuantity: decimal("normalized_quantity", { precision: 14, scale: 3 }).notNull(),
    unitCost: decimal("unit_cost", { precision: 14, scale: 6 }).notNull(),
    lineCost: decimal("line_cost", { precision: 14, scale: 3 }).notNull(),
  },
  (table) => ({
    batchIdIndex: index("production_batch_lines_batch_id_index").on(table.batchId),
    ingredientIdIndex: index("production_batch_lines_ingredient_id_index").on(table.ingredientId),
  }),
);
