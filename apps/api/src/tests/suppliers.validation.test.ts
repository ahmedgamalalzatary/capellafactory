import test from "node:test";
import assert from "node:assert/strict";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "../modules/suppliers/suppliers.validation.js";

test("create supplier accepts missing notes", () => {
  const result = createSupplierSchema.safeParse({
    name: "Cairo Plastics",
    phone: "+20 111 111 1111",
  });

  assert.equal(result.success, true);
});

test("update supplier accepts notes being cleared", () => {
  const result = updateSupplierSchema.safeParse({
    notes: undefined,
  });

  assert.equal(result.success, true);
});
