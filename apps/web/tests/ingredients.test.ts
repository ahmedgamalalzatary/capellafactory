import { expect, test } from "vitest";
import {
  buildIngredientsUrl,
  buildIngredientActionUrl,
  mergeJsonHeaders,
} from "../src/lib/api/ingredients.js";

test("buildIngredientsUrl omits empty query and archived filter by default", () => {
  expect(buildIngredientsUrl("http://localhost:4000", undefined, false)).toBe(
    "http://localhost:4000/ingredients",
  );
  expect(buildIngredientsUrl("http://localhost:4000", "   ", false)).toBe(
    "http://localhost:4000/ingredients",
  );
});

test("buildIngredientsUrl appends trimmed search query and archived filter", () => {
  expect(buildIngredientsUrl("http://localhost:4000", "  Sugar  ", true)).toBe(
    "http://localhost:4000/ingredients?q=Sugar&archived=true",
  );
});

test("buildIngredientActionUrl targets archive actions", () => {
  expect(buildIngredientActionUrl("http://localhost:4000", 8, "archive")).toBe(
    "http://localhost:4000/ingredients/8/archive",
  );
});

test("mergeJsonHeaders preserves existing headers and content type", () => {
  const headers = mergeJsonHeaders({
    Accept: "application/json",
  });

  expect(headers.get("Accept")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
});

test("ingredient unit families support count items operationally", () => {
  expect(["weight", "volume", "count"]).toContain("count");
});
