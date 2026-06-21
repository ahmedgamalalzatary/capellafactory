import test from "node:test";
import assert from "node:assert/strict";
import { salesInvoiceInputSchema } from "../src/sales-invoices/sales-invoice.schema.js";

test("sales invoice input accepts a saved buyer with product lines", () => {
  const result = salesInvoiceInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    taxState: "inactive",
    taxValue: 0,
    discountState: "inactive",
    discountValue: 0,
    payments: [],
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
    taxState: "inactive",
    taxValue: 0,
    discountState: "inactive",
    discountValue: 0,
    payments: [],
    buyerName: "Cash buyer",
    lines: [{ productId: 1, quantity: 2, sellingUnitPrice: 45 }],
  });

  assert.equal(result.success, false);
});

test("sales invoice input rejects duplicate product lines", () => {
  const result = salesInvoiceInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    taxState: "inactive",
    taxValue: 0,
    discountState: "inactive",
    discountValue: 0,
    payments: [],
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
    taxState: "inactive",
    taxValue: 0,
    discountState: "inactive",
    discountValue: 0,
    payments: [],
    lines: [{ productId: 1, quantity: 1.5, sellingUnitPrice: 45 }],
  });

  assert.equal(result.success, false);
});

test("sales invoice input accepts partial payment with method and date", () => {
  const result = salesInvoiceInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    taxState: "inactive",
    taxValue: 0,
    discountState: "inactive",
    discountValue: 0,
    payments: [{ amount: 40, paymentMethod: "instapay", paidAt: "2026-05-24T12:05:00.000Z" }],
    lines: [{ productId: 1, quantity: 2, sellingUnitPrice: 25 }],
  });

  assert.equal(result.success, true);
});

test("sales invoice input rejects paid amount greater than subtotal", () => {
  const result = salesInvoiceInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    taxState: "inactive",
    taxValue: 0,
    discountState: "inactive",
    discountValue: 0,
    payments: [{ amount: 51, paymentMethod: "instapay", paidAt: "2026-05-24T12:05:00.000Z" }],
    lines: [{ productId: 1, quantity: 2, sellingUnitPrice: 25 }],
  });

  assert.equal(result.success, false);
});

test("sales invoice input accepts tax, discount, and split payments", () => {
  const result = salesInvoiceInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    taxState: "active",
    taxType: "amount",
    taxValue: 15,
    discountState: "active",
    discountType: "percentage",
    discountValue: 10,
    payments: [
      {
        amount: 30,
        paymentMethod: "cod",
        paidAt: "2026-05-24T12:01:00.000Z",
      },
      {
        amount: 5,
        paymentMethod: "instapay",
        paidAt: "2026-05-24T12:02:00.000Z",
      },
    ],
    lines: [{ productId: 1, quantity: 2, sellingUnitPrice: 25 }],
  });

  assert.equal(result.success, true);
});

test("sales invoice input rejects split payments above final total after tax and discount", () => {
  const result = salesInvoiceInputSchema.safeParse({
    occurredAt: "2026-05-24T12:00:00.000Z",
    buyerId: 7,
    taxState: "active",
    taxType: "amount",
    taxValue: 10,
    discountState: "active",
    discountType: "amount",
    discountValue: 5,
    payments: [
      {
        amount: 40,
        paymentMethod: "cod",
        paidAt: "2026-05-24T12:01:00.000Z",
      },
      {
        amount: 20,
        paymentMethod: "instapay",
        paidAt: "2026-05-24T12:02:00.000Z",
      },
    ],
    lines: [{ productId: 1, quantity: 2, sellingUnitPrice: 25 }],
  });

  assert.equal(result.success, false);
});
