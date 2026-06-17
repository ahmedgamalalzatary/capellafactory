import test from "node:test";
import assert from "node:assert/strict";
import { updateBuyerSchema } from "../src/modules/buyers/buyers.validation.js";

test("update buyer accepts notes being cleared", () => {
  const result = updateBuyerSchema.safeParse({
    notes: undefined,
  });

  assert.equal(result.success, true);
});
