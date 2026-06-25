import { afterEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  isSidebarItemActive,
  sidebarItems,
} from "../src/components/shell/sidebar-nav.js";
import { config, proxy } from "../src/proxy.js";

test("all navigation items are real routes", () => {
  expect(sidebarItems).toEqual([
    { label: "الموردون", href: "/suppliers" },
    { label: "المشترون", href: "/buyers" },
    { label: "المخزون", href: "/inventory" },
    { label: "الأصول الثابتة", href: "/solid-assets" },
    { label: "المدفوعات", href: "/purchases" },
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

test("proxy allows the login page even when a session cookie exists", async () => {
  const request = new NextRequest("http://localhost:3000/login", {
    headers: { Cookie: "capella_session=stale-token" },
  });

  const response = await proxy(request);

  expect(response.status).toBe(200);
});

test("proxy redirects stale session cookies to login", async () => {
  global.fetch = vi.fn().mockResolvedValue(
    new Response(null, {
      status: 401,
    }),
  );

  const request = new NextRequest("http://localhost:3000/products", {
    headers: { Cookie: "capella_session=stale-token" },
  });

  const response = await proxy(request);

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

test("proxy redirects non-ok auth responses to login", async () => {
  global.fetch = vi.fn().mockResolvedValue(
    new Response(null, {
      status: 403,
    }),
  );

  const request = new NextRequest("http://localhost:3000/products", {
    headers: { Cookie: "capella_session=stale-token" },
  });

  const response = await proxy(request);

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("http://localhost:3000/login");
});

test("proxy verifies auth with a timeout signal", async () => {
  global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

  const request = new NextRequest("http://localhost:3000/products", {
    headers: { Cookie: "capella_session=stale-token" },
  });

  await proxy(request);

  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:4000/auth/me",
    expect.objectContaining({
      signal: expect.any(AbortSignal),
    }),
  );
});

test("proxy matcher keeps dot-extension routes excluded via an escaped dot", () => {
  expect(config.matcher).toContain("/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)");
});
