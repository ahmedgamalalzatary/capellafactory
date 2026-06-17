import test from "node:test";
import assert from "node:assert/strict";
import {
  ingredientBaseUnitSchema,
  ingredientInputSchema,
  ingredientUnitFamilySchema,
} from "../src/ingredients/ingredient.schema.js";

test("ingredient input accepts supported unit families", () => {
  assert.equal(ingredientInputSchema.safeParse({ name: "Sugar", unitFamily: "weight" }).success, true);
  assert.equal(ingredientInputSchema.safeParse({ name: "Milk", unitFamily: "volume" }).success, true);
  assert.equal(ingredientInputSchema.safeParse({ name: "Bottle", unitFamily: "count" }).success, true);
});

test("ingredient input rejects unsupported unit families", () => {
  const result = ingredientInputSchema.safeParse({
    name: "Sugar",
    unitFamily: "pieces",
  });

  assert.equal(result.success, false);
});

test("ingredient unit schemas expose supported base units", () => {
  assert.equal(ingredientUnitFamilySchema.safeParse("weight").success, true);
  assert.equal(ingredientBaseUnitSchema.safeParse("piece").success, true);
  assert.equal(ingredientBaseUnitSchema.safeParse("kg").success, false);
});
