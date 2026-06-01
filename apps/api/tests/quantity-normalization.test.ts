import test from "node:test";
import assert from "node:assert/strict";
import { normalizeIngredientQuantity } from "../src/utils/quantity-normalization.js";

test("normalizes kilograms to grams", () => {
  assert.equal(normalizeIngredientQuantity("weight", 2.5, "kg"), 2500);
});

test("normalizes grams as-is", () => {
  assert.equal(normalizeIngredientQuantity("weight", 250, "g"), 250);
});

test("normalizes liters to milliliters", () => {
  assert.equal(normalizeIngredientQuantity("volume", 1.75, "L"), 1750);
});

test("normalizes milliliters as-is", () => {
  assert.equal(normalizeIngredientQuantity("volume", 330, "ml"), 330);
});

test("normalizes count units as pieces", () => {
  assert.equal(normalizeIngredientQuantity("count", 24, "piece"), 24);
});

test("rejects incompatible unit families", () => {
  assert.throws(
    () => normalizeIngredientQuantity("weight", 1, "piece"),
    /Unit piece is not valid for ingredient family weight/,
  );
});
