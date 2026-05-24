import { expect, test } from "vitest";
import {
  isSidebarItemActive,
  sidebarItems,
} from "../src/components/shell/sidebar-nav.js";

test("all navigation items are real routes", () => {
  expect(sidebarItems).toEqual([
    { label: "الموردون", href: "/suppliers" },
    { label: "المشترون", href: "/buyers" },
    { label: "المخزون", href: "/inventory" },
    { label: "المشتريات", href: "/purchases" },
    { label: "المبيعات", href: "/sales" },
    { label: "التقارير", href: "/reports" },
  ]);
});

test("marks suppliers navigation item active on its route", () => {
  expect(isSidebarItemActive(sidebarItems[0], "/suppliers")).toBe(true);
});

test("marks placeholder route item active on its route", () => {
  expect(isSidebarItemActive(sidebarItems[1], "/buyers/12")).toBe(true);
});

test("does not mark routed item active on a different route", () => {
  expect(isSidebarItemActive(sidebarItems[0], "/buyers")).toBe(false);
});
