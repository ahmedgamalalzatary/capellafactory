import { expect, test } from "vitest";
import { buildSuppliersUrl } from "../src/lib/api/suppliers.js";

test("buildSuppliersUrl omits empty query", () => {
  expect(
    buildSuppliersUrl("http://localhost:4000", undefined),
  ).toBe("http://localhost:4000/suppliers");
  expect(
    buildSuppliersUrl("http://localhost:4000", "   "),
  ).toBe("http://localhost:4000/suppliers");
});

test("buildSuppliersUrl appends trimmed search query", () => {
  expect(
    buildSuppliersUrl("http://localhost:4000", "  Cairo Plastics  "),
  ).toBe("http://localhost:4000/suppliers?q=Cairo+Plastics");
});
