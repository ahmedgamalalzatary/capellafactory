import { expect, test } from "vitest";
import {
  filterIngredientsByUnitFamily,
  normalizeIngredientUnitFilter,
} from "../src/lib/inventory.js";

const ingredients = [
  {
    id: 1,
    name: "Sugar",
    unitFamily: "weight",
    baseUnit: "g",
    stockQuantity: 10,
    averageUnitCost: 0,
    hasHistory: false,
    isArchived: false,
    createdAt: "2026-05-24T10:00:00.000Z",
    updatedAt: "2026-05-24T10:00:00.000Z",
  },
  {
    id: 2,
    name: "Water",
    unitFamily: "volume",
    baseUnit: "ml",
    stockQuantity: 10,
    averageUnitCost: 0,
    hasHistory: false,
    isArchived: false,
    createdAt: "2026-05-24T10:00:00.000Z",
    updatedAt: "2026-05-24T10:00:00.000Z",
  },
  {
    id: 3,
    name: "Bottles",
    unitFamily: "count",
    baseUnit: "piece",
    stockQuantity: 10,
    averageUnitCost: 0,
    hasHistory: false,
    isArchived: false,
    createdAt: "2026-05-24T10:00:00.000Z",
    updatedAt: "2026-05-24T10:00:00.000Z",
  },
] as const;

test("normalizeIngredientUnitFilter falls back to all", () => {
  expect(normalizeIngredientUnitFilter(undefined)).toBe("all");
  expect(normalizeIngredientUnitFilter("unknown")).toBe("all");
});

test("normalizeIngredientUnitFilter accepts supported unit families", () => {
  expect(normalizeIngredientUnitFilter("weight")).toBe("weight");
  expect(normalizeIngredientUnitFilter("volume")).toBe("volume");
  expect(normalizeIngredientUnitFilter("count")).toBe("count");
});

test("filterIngredientsByUnitFamily returns all ingredients for all filter", () => {
  expect(filterIngredientsByUnitFamily([...ingredients], "all")).toHaveLength(3);
});

test("filterIngredientsByUnitFamily filters by weight, volume, and count", () => {
  expect(filterIngredientsByUnitFamily([...ingredients], "weight").map((item) => item.name)).toEqual([
    "Sugar",
  ]);
  expect(filterIngredientsByUnitFamily([...ingredients], "volume").map((item) => item.name)).toEqual([
    "Water",
  ]);
  expect(filterIngredientsByUnitFamily([...ingredients], "count").map((item) => item.name)).toEqual([
    "Bottles",
  ]);
});
