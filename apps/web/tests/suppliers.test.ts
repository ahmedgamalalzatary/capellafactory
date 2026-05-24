import test from "node:test";
import assert from "node:assert/strict";
import { buildSuppliersUrl } from "../src/lib/api/suppliers.js";

test("buildSuppliersUrl omits empty query", () => {
  assert.equal(
    buildSuppliersUrl("http://localhost:4000", undefined),
    "http://localhost:4000/suppliers",
  );
  assert.equal(
    buildSuppliersUrl("http://localhost:4000", "   "),
    "http://localhost:4000/suppliers",
  );
});

test("buildSuppliersUrl appends trimmed search query", () => {
  assert.equal(
    buildSuppliersUrl("http://localhost:4000", "  Cairo Plastics  "),
    "http://localhost:4000/suppliers?q=Cairo+Plastics",
  );
});
