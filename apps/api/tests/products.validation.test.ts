import test from "node:test";
import assert from "node:assert/strict";
import {
  createProductSchema,
  updateProductSchema,
} from "../src/modules/products/products.validation.js";

test("create product accepts a unique product name", () => {
  const result = createProductSchema.safeParse({
    name: "Orange Syrup",
  });

  assert.equal(result.success, true);
});

test("update product accepts archive flag changes", () => {
  const result = updateProductSchema.safeParse({
    isArchived: true,
  });

  assert.equal(result.success, true);
});
