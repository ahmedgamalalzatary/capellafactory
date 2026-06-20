import test from "node:test";
import assert from "node:assert/strict";
import {
  additionalPaymentInputSchema,
  createPaymentSummary,
  initialPaymentInputSchema,
  paymentMethodSchema,
} from "../src/payments/payment.schema.js";

test("payment method accepts only the four approved choices", () => {
  assert.equal(paymentMethodSchema.safeParse("visa").success, true);
  assert.equal(paymentMethodSchema.safeParse("vodafone_cash").success, true);
  assert.equal(paymentMethodSchema.safeParse("cod").success, true);
  assert.equal(paymentMethodSchema.safeParse("instapay").success, true);
  assert.equal(paymentMethodSchema.safeParse("cash").success, false);
});

test("initial payment allows zero amount without method or date", () => {
  const result = initialPaymentInputSchema.safeParse({
    paidAmount: 0,
    totalAmount: 40000,
  });

  assert.equal(result.success, true);
});

test("initial payment requires method and date for positive amount", () => {
  const result = initialPaymentInputSchema.safeParse({
    paidAmount: 37000,
    totalAmount: 40000,
  });

  assert.equal(result.success, false);
});

test("initial payment rejects amount greater than total", () => {
  const result = initialPaymentInputSchema.safeParse({
    paidAmount: 41000,
    totalAmount: 40000,
    paymentMethod: "instapay",
    paidAt: "2026-06-20T10:00:00.000Z",
  });

  assert.equal(result.success, false);
});

test("payment summary derives paid partial and remaining amounts", () => {
  const summary = createPaymentSummary({
    totalAmount: 40000,
    paidAmount: 37000,
  });

  assert.deepEqual(summary, {
    totalAmount: 40000,
    paidAmount: 37000,
    remainingAmount: 3000,
    paymentStatus: "partial",
  });
});

test("additional payment requires a positive amount within remaining balance", () => {
  const result = additionalPaymentInputSchema.safeParse({
    remainingAmount: 4000,
    amount: 0,
    paymentMethod: "instapay",
    paidAt: "2026-06-20T10:00:00.000Z",
  });

  assert.equal(result.success, false);
});

test("additional payment rejects amount greater than remaining balance", () => {
  const result = additionalPaymentInputSchema.safeParse({
    remainingAmount: 4000,
    amount: 4001,
    paymentMethod: "instapay",
    paidAt: "2026-06-20T10:00:00.000Z",
  });

  assert.equal(result.success, false);
});

test("additional payment accepts valid amount and payment method", () => {
  const result = additionalPaymentInputSchema.safeParse({
    remainingAmount: 4000,
    amount: 4000,
    paymentMethod: "instapay",
    paidAt: "2026-06-20T10:00:00.000Z",
  });

  assert.equal(result.success, true);
});
