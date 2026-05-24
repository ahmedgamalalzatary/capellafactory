import {
  decimal,
  index,
  mysqlEnum,
  mysqlTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
  boolean,
} from "drizzle-orm/mysql-core";

export const ingredientsTable = mysqlTable(
  "ingredients",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    unitFamily: mysqlEnum("unit_family", ["weight", "volume", "count"]).notNull(),
    baseUnit: mysqlEnum("base_unit", ["g", "ml", "piece"]).notNull(),
    stockQuantity: decimal("stock_quantity", { precision: 14, scale: 3 })
      .default("0.000")
      .notNull(),
    hasHistory: boolean("has_history").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameUniqueIndex: uniqueIndex("ingredients_name_unique").on(table.name),
    nameIndex: index("ingredients_name_index").on(table.name),
  }),
);
