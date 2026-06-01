import { expect, test } from "vitest";
import {
  buildProductionBatchesUrl,
  mergeJsonHeaders,
} from "../src/lib/api/production-batches.js";

test("buildProductionBatchesUrl omits empty query by default", () => {
  expect(buildProductionBatchesUrl("http://localhost:4000")).toBe(
    "http://localhost:4000/production-batches",
  );
  expect(buildProductionBatchesUrl("http://localhost:4000", "   ")).toBe(
    "http://localhost:4000/production-batches",
  );
});

test("buildProductionBatchesUrl appends trimmed search query", () => {
  expect(buildProductionBatchesUrl("http://localhost:4000", "  PRD  ")).toBe(
    "http://localhost:4000/production-batches?q=PRD",
  );
});

test("mergeJsonHeaders preserves existing headers and content type", () => {
  const headers = mergeJsonHeaders({
    Accept: "application/json",
  });

  expect(headers.get("Accept")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
});
