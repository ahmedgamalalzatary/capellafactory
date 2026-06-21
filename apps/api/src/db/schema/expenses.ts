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
    baseTotal: decimal("base_total", { precision: 14, scale: 3 }).notNull(),
    taxState: mysqlEnum("tax_state", ["active", "inactive"]).notNull(),
    taxType: mysqlEnum("tax_type", ["amount", "percentage"]),
    taxValue: decimal("tax_value", { precision: 14, scale: 3 }).notNull(),
    taxAmount: decimal("tax_amount", { precision: 14, scale: 3 }).notNull(),
    totalAfterTax: decimal("total_after_tax", { precision: 14, scale: 3 }).notNull(),
    discountState: mysqlEnum("discount_state", ["active", "inactive"]).notNull(),
    discountType: mysqlEnum("discount_type", ["amount", "percentage"]),
    discountValue: decimal("discount_value", { precision: 14, scale: 3 }).notNull(),
    discountAmount: decimal("discount_amount", { precision: 14, scale: 3 }).notNull(),
    finalTotal: decimal("final_total", { precision: 14, scale: 3 }).notNull(),
    amount: decimal("amount", { precision: 14, scale: 3 }).notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    notes: text("notes"),
    employeeName: varchar("employee_name", { length: 255 }),
    otherLabel: varchar("other_label", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    typeIndex: index("expenses_type_index").on(table.type),
    finalTotalIndex: index("expenses_final_total_index").on(table.finalTotal),
    occurredAtIndex: index("expenses_occurred_at_index").on(table.occurredAt),
  }),
);

export const expensePaymentsTable = mysqlTable(
  "expense_payments",
  {
    id: int("id").autoincrement().primaryKey(),
    expenseId: int("expense_id")
      .notNull()
      .references(() => expensesTable.id, { onDelete: "restrict", onUpdate: "cascade" }),
    amount: decimal("amount", { precision: 14, scale: 3 }).notNull(),
    paymentMethod: mysqlEnum("payment_method", [
      "visa",
      "vodafone_cash",
      "cod",
      "instapay",
    ]).notNull(),
    paidAt: timestamp("paid_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    expenseIdIndex: index("expense_payments_expense_id_index").on(table.expenseId),
    paidAtIndex: index("expense_payments_paid_at_index").on(table.paidAt),
  }),
);
