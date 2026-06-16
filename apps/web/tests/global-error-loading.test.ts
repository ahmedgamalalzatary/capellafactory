import { expect, test } from "vitest";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function appPath(relativePath: string) {
  return resolve(process.cwd(), "src", "app", "(app)", relativePath);
}

function readApp(relativePath: string) {
  return readFileSync(appPath(relativePath), "utf8");
}

test("global error and loading boundaries exist at the (app) route-group level", () => {
  expect(existsSync(appPath("error.tsx"))).toBe(true);
  expect(existsSync(appPath("loading.tsx"))).toBe(true);
});

test("per-page error and loading files are removed from buyers and suppliers", () => {
  for (const segment of ["buyers", "suppliers"]) {
    expect(existsSync(appPath(`${segment}/error.tsx`))).toBe(false);
    expect(existsSync(appPath(`${segment}/loading.tsx`))).toBe(false);
  }
});

test("global error is a client boundary with reset and retry affordances", () => {
  const source = readApp("error.tsx");
  expect(source).toContain('"use client"');
  expect(source).toContain("reset");
  // wording must be generic, not hard-coded to suppliers
  expect(source).not.toContain("الموردين");
});

test("global loading uses a generic skeleton without page-specific column grids", () => {
  const source = readApp("loading.tsx");
  expect(source).toContain("animate-pulse");
  expect(source).not.toContain("grid-cols-[40px_1.5fr_1fr_1fr_2fr_40px]");
});
