import test from "node:test";
import assert from "node:assert/strict";
import { updateSupplierSchema } from "../src/modules/suppliers/suppliers.validation.js";

test("update supplier accepts notes being cleared", () => {
  const result = updateSupplierSchema.safeParse({
    notes: undefined,
  });

  assert.equal(result.success, true);
});
