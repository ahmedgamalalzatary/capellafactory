import test from "node:test";
import assert from "node:assert/strict";
import { createSalesInvoiceSchema } from "../src/modules/sales-invoices/sales-invoices.validation.js";

test("create sales invoice accepts a saved buyer with product lines", () => {
  const result = createSalesInvoiceSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    lines: [{ productId: 1, quantity: 2, sellingUnitPrice: 45 }],
  });

  assert.equal(result.success, true);
});

test("create sales invoice rejects typed buyer names", () => {
  const result = createSalesInvoiceSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerName: "Cash buyer",
    lines: [{ productId: 1, quantity: 2, sellingUnitPrice: 45 }],
  });

  assert.equal(result.success, false);
});

test("create sales invoice rejects duplicate product lines", () => {
  const result = createSalesInvoiceSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    lines: [
      { productId: 1, quantity: 2, sellingUnitPrice: 45 },
      { productId: 1, quantity: 1, sellingUnitPrice: 50 },
    ],
  });

  assert.equal(result.success, false);
});

test("create sales invoice requires integer product quantities", () => {
  const result = createSalesInvoiceSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    lines: [{ productId: 1, quantity: 1.5, sellingUnitPrice: 45 }],
  });

  assert.equal(result.success, false);
});

test("create sales invoice requires at least one line", () => {
  const result = createSalesInvoiceSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    lines: [],
  });

  assert.equal(result.success, false);
});
