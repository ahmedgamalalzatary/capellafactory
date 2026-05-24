import { expect, test } from "vitest";
import { buildBuyersUrl, mergeJsonHeaders } from "../src/lib/api/buyers.js";

test("buildBuyersUrl omits empty query", () => {
  expect(buildBuyersUrl("http://localhost:4000", undefined)).toBe(
    "http://localhost:4000/buyers",
  );
  expect(buildBuyersUrl("http://localhost:4000", "   ")).toBe(
    "http://localhost:4000/buyers",
  );
});

test("buildBuyersUrl appends trimmed search query", () => {
  expect(buildBuyersUrl("http://localhost:4000", "  Nile Trading  ")).toBe(
    "http://localhost:4000/buyers?q=Nile+Trading",
  );
});

test("mergeJsonHeaders preserves existing headers and content type", () => {
  const headers = mergeJsonHeaders({
    Accept: "application/json",
  });

  expect(headers.get("Accept")).toBe("application/json");
  expect(headers.get("Content-Type")).toBe("application/json");
});
