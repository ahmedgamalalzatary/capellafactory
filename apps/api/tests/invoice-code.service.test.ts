import test from "node:test";
import assert from "node:assert/strict";
import { buildIngredientPurchaseInvoiceCode } from "../src/services/invoice-code.service.js";

test("builds ingredient purchase invoice codes from date and sequence", () => {
  const code = buildIngredientPurchaseInvoiceCode(
    new Date("2026-05-24T12:00:00.000Z"),
    9,
  );

  assert.equal(code, "PUR-20260524-0009");
});

test("builds ingredient purchase invoice codes from inserted id values", () => {
  const code = buildIngredientPurchaseInvoiceCode(
    new Date("2024-01-01T08:30:00.000Z"),
    52,
  );

  assert.equal(code, "PUR-20240101-0052");
});
