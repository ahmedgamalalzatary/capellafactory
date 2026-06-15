import {
  decimal,
  int,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const expensesTable = mysqlTable(
  "expenses",
  {
    id: int("id").autoincrement().primaryKey(),
    type: mysqlEnum("type", [
      "rent",
      "food",
      "water",
      "gas",
      "electricity",
      "internet",
      "salary",
      "other",
    ]).notNull(),
    amount: decimal("amount", { precision: 14, scale: 3 }).notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    notes: text("notes"),
    employeeName: varchar("employee_name", { length: 255 }),
    otherLabel: varchar("other_label", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    typeIndex: index("expenses_type_index").on(table.type),
    occurredAtIndex: index("expenses_occurred_at_index").on(table.occurredAt),
  }),
);
