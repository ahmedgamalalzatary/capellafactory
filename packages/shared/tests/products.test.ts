import test from "node:test";
import assert from "node:assert/strict";
import { productInputSchema } from "../src/products/product.schema.js";

test("product input accepts a non-empty name", () => {
  const result = productInputSchema.safeParse({
    name: "Orange Syrup",
  });

  assert.equal(result.success, true);
});

test("product input rejects an empty name", () => {
  const result = productInputSchema.safeParse({
    name: "",
  });

  assert.equal(result.success, false);
});
