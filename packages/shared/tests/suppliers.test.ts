import test from "node:test";
import assert from "node:assert/strict";
import { supplierInputSchema } from "../src/suppliers/supplier.schema.js";

test("supplier input accepts required name and phone", () => {
  const result = supplierInputSchema.safeParse({
    name: "Cairo Plastics",
    phone: "+20 111 111 1111",
  });

  assert.equal(result.success, true);
});

test("supplier input rejects empty notes when provided", () => {
  const result = supplierInputSchema.safeParse({
    name: "Cairo Plastics",
    phone: "+20 111 111 1111",
    notes: "",
  });

  assert.equal(result.success, false);
});
