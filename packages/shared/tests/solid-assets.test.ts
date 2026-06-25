import test from "node:test";
import assert from "node:assert/strict";
import { createSolidAssetSchema, updateSolidAssetSchema } from "../src/solid-assets/solid-asset.schema.js";

test("accepts valid solid asset input with integer qty", () => {
  const result = createSolidAssetSchema.safeParse({
    name: "Office Desk",
    qty: 4,
    priceOfOne: 2500.75,
  });

  assert.equal(result.success, true);
});

test("rejects non-integer qty for solid asset input", () => {
  const result = createSolidAssetSchema.safeParse({
    name: "Office Desk",
    qty: 1.5,
    priceOfOne: 2500.75,
  });

  assert.equal(result.success, false);
});

test("accepts partial updates for solid asset input", () => {
  const result = updateSolidAssetSchema.safeParse({
    qty: 2,
  });

  assert.equal(result.success, true);
});

test("rejects empty solid asset updates", () => {
  const result = updateSolidAssetSchema.safeParse({});

  assert.equal(result.success, false);
});
