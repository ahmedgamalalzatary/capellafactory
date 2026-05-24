import test from "node:test";
import assert from "node:assert/strict";
import {
  createBuyerSchema,
  updateBuyerSchema,
} from "../src/modules/buyers/buyers.validation.js";

test("create buyer accepts missing notes", () => {
  const result = createBuyerSchema.safeParse({
    name: "Nile Trading",
    phone: "+20 111 111 1111",
  });

  assert.equal(result.success, true);
});

test("update buyer accepts notes being cleared", () => {
  const result = updateBuyerSchema.safeParse({
    notes: undefined,
  });

  assert.equal(result.success, true);
});
