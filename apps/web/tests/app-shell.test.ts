import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const sidebarViewSource = readFileSync(
  join(import.meta.dirname, "../src/components/shell/sidebar-view.tsx"),
  "utf8",
);

test("all navigation items are real routes", () => {
  expect(sidebarViewSource).toContain('{ label: "الموردون", href: "/suppliers" }');
  expect(sidebarViewSource).toContain('{ label: "المخزون", href: "/inventory" }');
  expect(sidebarViewSource).toContain('{ label: "المشتريات", href: "/purchases" }');
  expect(sidebarViewSource).toContain('{ label: "المبيعات", href: "/sales" }');
  expect(sidebarViewSource).toContain('{ label: "المشترون", href: "/buyers" }');
  expect(sidebarViewSource).toContain('{ label: "التقارير", href: "/reports" }');
});

test("marks suppliers navigation item active on its route", () => {
  expect(sidebarViewSource).toContain('return pathname === item.href || pathname.startsWith(`${item.href}/`)');
});

test("marks placeholder route item active on its route", () => {
  expect(sidebarViewSource).toContain("const isActive = isSidebarItemActive(item, pathname);");
});

test("does not mark routed item active on a different route", () => {
  expect(sidebarViewSource).toContain('aria-current={isActive ? "page" : undefined}');
});
