import test from "node:test";
import assert from "node:assert/strict";
import {
  createIngredientSchema,
  updateIngredientSchema,
} from "../src/modules/ingredients/ingredients.validation.js";

test("create ingredient accepts weight unit family", () => {
  const result = createIngredientSchema.safeParse({
    name: "Sugar",
    unitFamily: "weight",
  });

  assert.equal(result.success, true);
});

test("create ingredient accepts count unit family", () => {
  const result = createIngredientSchema.safeParse({
    name: "Bottle",
    unitFamily: "count",
  });

  assert.equal(result.success, true);
});

test("create ingredient rejects unsupported unit family", () => {
  const result = createIngredientSchema.safeParse({
    name: "Sugar",
    unitFamily: "pieces",
  });

  assert.equal(result.success, false);
});

test("update ingredient accepts archive flag changes", () => {
  const result = updateIngredientSchema.safeParse({
    isArchived: true,
  });

  assert.equal(result.success, true);
});
