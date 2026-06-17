import test from "node:test";
import assert from "node:assert/strict";
import { salesInvoiceInputSchema } from "../src/sales-invoices/sales-invoice.schema.js";

test("sales invoice input accepts a saved buyer with product lines", () => {
  const result = salesInvoiceInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    notes: " Retail ",
    lines: [{ productId: 1, quantity: 2, sellingUnitPrice: 45 }],
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.notes, "Retail");
  }
});

test("sales invoice input rejects typed buyer names", () => {
  const result = salesInvoiceInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerName: "Cash buyer",
    lines: [{ productId: 1, quantity: 2, sellingUnitPrice: 45 }],
  });

  assert.equal(result.success, false);
});

test("sales invoice input rejects duplicate product lines", () => {
  const result = salesInvoiceInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    lines: [
      { productId: 1, quantity: 2, sellingUnitPrice: 45 },
      { productId: 1, quantity: 1, sellingUnitPrice: 50 },
    ],
  });

  assert.equal(result.success, false);
});

test("sales invoice input requires integer product quantities", () => {
  const result = salesInvoiceInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    lines: [{ productId: 1, quantity: 1.5, sellingUnitPrice: 45 }],
  });

  assert.equal(result.success, false);
});
