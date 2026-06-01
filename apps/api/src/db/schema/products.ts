import {
  boolean,
  decimal,
  index,
  mysqlTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const productsTable = mysqlTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    stockQuantity: decimal("stock_quantity", { precision: 14, scale: 3 })
      .default("0.000")
      .notNull(),
    averageUnitCost: decimal("average_unit_cost", { precision: 14, scale: 6 })
      .default("0.000000")
      .notNull(),
    hasHistory: boolean("has_history").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameUniqueIndex: uniqueIndex("products_name_unique").on(table.name),
    nameIndex: index("products_name_index").on(table.name),
  }),
);
