import test from "node:test";
import assert from "node:assert/strict";
import { updateProductSchema } from "../src/modules/products/products.validation.js";

test("update product rejects archive flag changes", () => {
  const result = updateProductSchema.safeParse({
    isArchived: true,
  });

  assert.equal(result.success, false);
});
