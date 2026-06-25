import { sql } from "drizzle-orm";
import { check, decimal, index, int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const solidAssetsTable = mysqlTable(
  "solid_assets",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    qty: int("qty").notNull(),
    priceOfOne: decimal("price_of_one", { precision: 14, scale: 3 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
  },
  (table) => ({
    nameIndex: index("solid_assets_name_index").on(table.name),
    qtyCheck: check("solid_assets_qty_check", sql`${table.qty} >= 1`),
    priceOfOneCheck: check("solid_assets_price_of_one_check", sql`${table.priceOfOne} > 0`),
  }),
);
