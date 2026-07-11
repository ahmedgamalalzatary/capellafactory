import test from "node:test";
import assert from "node:assert/strict";
import { mapExpenseRowToExpense } from "../src/modules/expenses/expenses.repository.js";
import {
  mapSalesInvoiceRowToSalesInvoice,
  mapSalesInvoiceRowsToSalesInvoices,
} from "../src/modules/sales-invoices/sales-invoices.mappers.js";
import { mapIngredientPurchaseRowToIngredientPurchase } from "../src/modules/ingredient-purchases/ingredient-purchases.mappers.js";

// Regression tests: a document that has zero recorded payments is a credit
// document. It must read as UNPAID with the full final total remaining —
// never silently as "paid".

const expenseRow = {
  id: 7,
  type: "salary" as const,
  baseTotal: "2500.000",
  taxState: "inactive" as const,
  taxType: null,
  taxValue: "0.000",
  taxAmount: "0.000",
  totalAfterTax: "2500.000",
  discountState: "inactive" as const,
  discountType: null,
  discountValue: "0.000",
  discountAmount: "0.000",
  finalTotal: "2500.000",
  amount: "2500.000",
  occurredAt: new Date("2026-05-24T12:00:00.000Z"),
  notes: null,
  employeeName: "Ahmed",
  otherLabel: null,
  createdAt: new Date("2026-05-24T12:05:00.000Z"),
};

const salesInvoiceRow = {
  id: 9,
  invoiceCode: "SAL-20260524-0009",
  occurredAt: new Date("2026-05-24T12:00:00.000Z"),
  buyerId: 4,
  baseTotal: "90.500",
  taxState: "inactive" as const,
  taxType: null,
  taxValue: "0.000",
  taxAmount: "0.000",
  totalAfterTax: "90.500",
  discountState: "inactive" as const,
  discountType: null,
  discountValue: "0.000",
  discountAmount: "0.000",
  finalTotal: "90.500",
  subtotal: "90.500",
  totalCost: "60.250",
  grossProfit: "30.250",
  notes: null,
  createdAt: new Date("2026-05-24T12:05:00.000Z"),
};

const ingredientPurchaseRow = {
  id: 3,
  invoiceCode: "PUR-20260524-0003",
  occurredAt: new Date("2026-05-24T12:00:00.000Z"),
  baseTotal: "113.125",
  taxState: "inactive" as const,
  taxType: null,
  taxValue: "0.000",
  taxAmount: "0.000",
  totalAfterTax: "113.125",
  discountState: "inactive" as const,
  discountType: null,
  discountValue: "0.000",
  discountAmount: "0.000",
  finalTotal: "113.125",
  totalAmount: "113.125",
  supplierId: 4,
  supplierName: "مورد الدقيق",
  notes: null,
  createdAt: new Date("2026-05-24T12:05:00.000Z"),
};

test("expense with no recorded payments reads as unpaid with full remaining amount", () => {
  const expense = mapExpenseRowToExpense(expenseRow);

  assert.equal(expense.paidAmount, 0);
  assert.equal(expense.remainingAmount, 2500);
  assert.equal(expense.paymentStatus, "unpaid");
});

test("sales invoice with no recorded payments reads as unpaid with full remaining amount", () => {
  const invoice = mapSalesInvoiceRowToSalesInvoice(salesInvoiceRow, []);

  assert.equal(invoice.paidAmount, 0);
  assert.equal(invoice.remainingAmount, 90.5);
  assert.equal(invoice.paymentStatus, "unpaid");
});

test("listed sales invoices missing from the payment totals lookup read as unpaid", () => {
  const [invoice] = mapSalesInvoiceRowsToSalesInvoices(
    [salesInvoiceRow],
    [],
    new Map(),
  );

  assert.equal(invoice?.paidAmount, 0);
  assert.equal(invoice?.remainingAmount, 90.5);
  assert.equal(invoice?.paymentStatus, "unpaid");
});

test("ingredient purchase with no recorded payments reads as unpaid with full remaining amount", () => {
  const purchase = mapIngredientPurchaseRowToIngredientPurchase(ingredientPurchaseRow, []);

  assert.equal(purchase.paidAmount, 0);
  assert.equal(purchase.remainingAmount, 113.125);
  assert.equal(purchase.paymentStatus, "unpaid");
});
