import { mysqlTable, serial, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const suppliersTable = mysqlTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  where: varchar("where", { length: 255 }),
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
