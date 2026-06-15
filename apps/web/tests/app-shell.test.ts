import { afterEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  isSidebarItemActive,
  sidebarItems,
} from "../src/components/shell/sidebar-nav.js";
import { middleware } from "../src/middleware.js";

test("all navigation items are real routes", () => {
  expect(sidebarItems).toEqual([
    { label: "الموردون", href: "/suppliers" },
    { label: "المشترون", href: "/buyers" },
    { label: "المخزون", href: "/inventory" },
    { label: "المشتريات", href: "/purchases" },
    { label: "التصنيع", href: "/products" },
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

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

test("middleware allows the login page even when a session cookie exists", async () => {
  const request = new NextRequest("http://localhost:3000/login", {
    headers: { Cookie: "capella_session=stale-token" },
  });

  const response = await middleware(request);

  expect(response.status).toBe(200);
});

test("middleware redirects stale session cookies to login", async () => {
  global.fetch = vi.fn().mockResolvedValue(
    new Response(null, {
      status: 401,
    }),
  );

  const request = new NextRequest("http://localhost:3000/products", {
    headers: { Cookie: "capella_session=stale-token" },
  });

  const response = await middleware(request);

  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:4000/auth/me",
    expect.objectContaining({
      credentials: "include",
      headers: expect.objectContaining({
        Cookie: "capella_session=stale-token",
      }),
    }),
  );
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("http://localhost:3000/login");
});
