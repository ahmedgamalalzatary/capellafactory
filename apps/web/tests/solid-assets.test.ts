import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

describe("solid assets page", () => {
  test("defines a dedicated route with its table and dialog", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/(app)/solid-assets/page.tsx"),
      "utf8",
    );

    expect(page).toContain("SolidAssetsTable");
    expect(page).toContain("SolidAssetDialog");
    expect(page).toContain("getSolidAssets");
  });

  test("solid assets table shows derived total price column", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/solid-assets/solid-assets-table.tsx"),
      "utf8",
    );

    expect(source).toContain("totalPrice");
    expect(source).toContain("سعر الواحدة");
    expect(source).toContain("الإجمالي");
  });

  test("api client uses a derived response type for total price", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/lib/api/solid-assets.ts"),
      "utf8",
    );

    expect(source).toContain("SolidAssetWithTotalPrice");
  });
});
