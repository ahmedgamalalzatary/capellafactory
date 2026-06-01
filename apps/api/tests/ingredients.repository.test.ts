import test from "node:test";
import assert from "node:assert/strict";
import {
  DuplicateIngredientNameError,
  mapIngredientRowToIngredient,
  normalizeIngredientSearchQuery,
  toIngredientDatabaseError,
} from "../src/modules/ingredients/ingredients.repository.js";

test("maps ingredient rows into shared ingredient shape", () => {
  const ingredient = mapIngredientRowToIngredient({
    id: 4,
    name: "Sugar",
    unitFamily: "weight",
    baseUnit: "g",
    stockQuantity: "2500.500",
    averageUnitCost: "0.000000",
    hasHistory: true,
    isArchived: false,
    createdAt: new Date("2026-05-24T10:00:00.000Z"),
    updatedAt: new Date("2026-05-24T11:00:00.000Z"),
  });

  assert.deepEqual(ingredient, {
    id: 4,
    name: "Sugar",
    unitFamily: "weight",
    baseUnit: "g",
    stockQuantity: 2500.5,
    hasHistory: true,
    isArchived: false,
    createdAt: "2026-05-24T10:00:00.000Z",
    updatedAt: "2026-05-24T11:00:00.000Z",
  });
});

test("maps count-based ingredient rows to piece base unit", () => {
  const ingredient = mapIngredientRowToIngredient({
    id: 8,
    name: "Bottle",
    unitFamily: "count",
    baseUnit: "piece",
    stockQuantity: "1200.000",
    averageUnitCost: "0.000000",
    hasHistory: false,
    isArchived: false,
    createdAt: new Date("2026-05-24T10:00:00.000Z"),
    updatedAt: new Date("2026-05-24T11:00:00.000Z"),
  });

  assert.deepEqual(ingredient, {
    id: 8,
    name: "Bottle",
    unitFamily: "count",
    baseUnit: "piece",
    stockQuantity: 1200,
    hasHistory: false,
    isArchived: false,
    createdAt: "2026-05-24T10:00:00.000Z",
    updatedAt: "2026-05-24T11:00:00.000Z",
  });
});

test("maps mysql duplicate key errors to DuplicateIngredientNameError", () => {
  const mysqlError = {
    code: "ER_DUP_ENTRY",
    sqlMessage: "Duplicate entry 'Sugar' for key 'ingredients.name'",
  } as unknown as NodeJS.ErrnoException;

  const error = toIngredientDatabaseError(mysqlError);

  assert.ok(error instanceof DuplicateIngredientNameError);
  assert.equal(error.message, "Ingredient name must be unique");
});

test("normalizes ingredient search query", () => {
  assert.equal(normalizeIngredientSearchQuery(undefined), undefined);
  assert.equal(normalizeIngredientSearchQuery(""), undefined);
  assert.equal(normalizeIngredientSearchQuery("   "), undefined);
  assert.equal(normalizeIngredientSearchQuery("  Sugar  "), "Sugar");
});
