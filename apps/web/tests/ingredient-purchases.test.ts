import { expect, test } from "vitest";
import {
  buildIngredientPurchasesUrl,
  mergeJsonHeaders,
} from "../src/lib/api/ingredient-purchases.js";

test("buildIngredientPurchasesUrl omits empty query by default", () => {
  expect(buildIngredientPurchasesUrl("http://localhost:4000")).toBe(
    "http://localhost:4000/ingredient-purchases",
  );
  expect(buildIngredientPurchasesUrl("http://localhost:4000", "   ")).toBe(
    "http://localhost:4000/ingredient-purchases",
  );
});

test("buildIngredientPurchasesUrl appends trimmed search query", () => {
  expect(buildIngredientPurchasesUrl("http://localhost:4000", "  sugar  ")).toBe(
    "http://localhost:4000/ingredient-purchases?q=sugar",
  );
});

test("mergeJsonHeaders preserves existing headers and content type", () => {
  const headers = mergeJsonHeaders({
    Accept: "application/json",
  });

  expect(headers.get("Accept")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
});
