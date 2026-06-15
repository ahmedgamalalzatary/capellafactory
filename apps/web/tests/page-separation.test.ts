import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readAppFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), "src", relativePath), "utf8");
}

test("inventory page keeps props, constants, and href helpers out of the route file", () => {
  const source = readAppFile("app/(app)/inventory/page.tsx");

  expect(source).not.toContain("type InventoryPageProps =");
  expect(source).not.toContain("const tabs = [");
  expect(source).not.toContain("const ingredientUnitFilters:");
  expect(source).not.toContain("function buildInventoryHref(");
});

test("products page keeps props, formatting, and metric card helpers out of the route file", () => {
  const source = readAppFile("app/(app)/products/page.tsx");

  expect(source).not.toContain("type ProductsPageProps =");
  expect(source).not.toContain("function MetricCard(");
  expect(source).not.toContain("function formatAmount(");
});

test("purchases page keeps props, formatting, href, and metric card helpers out of the route file", () => {
  const source = readAppFile("app/(app)/purchases/page.tsx");

  expect(source).not.toContain("type PurchasesPageProps =");
  expect(source).not.toContain("function MetricCard(");
  expect(source).not.toContain("function formatAmount(");
  expect(source).not.toContain("function buildPurchasesHref(");
});
