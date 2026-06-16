import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  AuthRequiredError,
  handleApiResponse,
  withApiCredentials,
} from "@/lib/api/request";
import {
  buildBuyersUrl,
  createBuyer,
  deleteBuyer,
  getBuyers,
  mergeJsonHeaders,
  updateBuyer,
} from "@/lib/api/buyers";
import {
  buildProductActionUrl,
  buildProductsUrl,
  archiveProduct,
  createProduct,
  deleteProduct,
  getProducts,
  reactivateProduct,
  updateProduct,
} from "@/lib/api/products";
import {
  buildSuppliersUrl,
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "@/lib/api/suppliers";
import {
  buildIngredientActionUrl,
  buildIngredientsUrl,
  archiveIngredient,
  createIngredient,
  deleteIngredient,
  getIngredients,
  reactivateIngredient,
  updateIngredient,
} from "@/lib/api/ingredients";
import {
  buildExpenseDetailUrl,
  buildExpensesUrl,
  createExpense,
  getExpense,
  getExpenses,
} from "@/lib/api/expenses";
import {
  buildIngredientPurchaseDetailUrl,
  buildIngredientPurchasesUrl,
  createIngredientPurchase,
  getIngredientPurchase,
  getIngredientPurchases,
} from "@/lib/api/ingredient-purchases";
import {
  buildProductionBatchDetailUrl,
  buildProductionBatchesUrl,
  createProductionBatch,
  getProductionBatch,
  getProductionBatches,
} from "@/lib/api/production-batches";
import {
  buildPurchaseCorrectionDetailUrl,
  buildPurchaseCorrectionsUrl,
  createPurchaseCorrection,
  getPurchaseCorrection,
  getPurchaseCorrections,
} from "@/lib/api/purchase-corrections";
import {
  buildSalesInvoiceDetailUrl,
  buildSalesInvoicesUrl,
  createSalesInvoice,
  getSalesInvoice,
  getSalesInvoices,
} from "@/lib/api/sales-invoices";
import { login, logout } from "@/lib/api/auth";

// ---- fetch mock helpers ----------------------------------------------------
const fetchMock = vi.fn();

function jsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}) {
  const status = init.status ?? 200;
  return {
    ok: init.ok ?? (status >= 200 && status < 300),
    status,
    json: async () => body,
  } as unknown as Response;
}

/** The URL string passed to the most recent fetch call. */
function lastUrl() {
  return fetchMock.mock.calls.at(-1)?.[0] as string;
}
/** The RequestInit passed to the most recent fetch call. */
function lastInit() {
  return fetchMock.mock.calls.at(-1)?.[1] as RequestInit;
}

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(jsonResponse({}));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---- request.ts (the shared core) -----------------------------------------
describe("request core", () => {
  test("withApiCredentials always sets credentials:include and merges plain headers", () => {
    const init = withApiCredentials({ headers: { "X-A": "1" } });
    expect(init.credentials).toBe("include");
    expect(init.headers).toMatchObject({ "X-A": "1" });
  });

  test("withApiCredentials flattens a Headers instance", () => {
    const init = withApiCredentials({ headers: new Headers({ "X-B": "2" }) });
    expect(init.headers).toMatchObject({ "x-b": "2" });
  });

  test("withApiCredentials flattens an array of header tuples", () => {
    const init = withApiCredentials({ headers: [["X-C", "3"]] });
    expect(init.headers).toMatchObject({ "X-C": "3" });
  });

  test("withApiCredentials appends a Cookie header when provided", () => {
    const init = withApiCredentials({}, "session=abc");
    expect(init.headers).toMatchObject({ Cookie: "session=abc" });
  });

  test("handleApiResponse throws AuthRequiredError on 401", async () => {
    await expect(
      handleApiResponse(jsonResponse(null, { status: 401 }), "fallback"),
    ).rejects.toBeInstanceOf(AuthRequiredError);
  });

  test("handleApiResponse prefers the first issue message over message and fallback", async () => {
    const res = jsonResponse(
      { message: "generic", issues: [{ message: "field is required" }] },
      { status: 400 },
    );
    await expect(handleApiResponse(res, "fallback")).rejects.toThrow(
      "field is required",
    );
  });

  test("handleApiResponse falls back to payload.message then the fallback string", async () => {
    await expect(
      handleApiResponse(jsonResponse({ message: "boom" }, { status: 500 }), "fb"),
    ).rejects.toThrow("boom");

    await expect(
      handleApiResponse(jsonResponse({}, { status: 500 }), "fb"),
    ).rejects.toThrow("fb");
  });

  test("handleApiResponse uses the fallback when the error body is not JSON", async () => {
    const res = {
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response;
    await expect(handleApiResponse(res, "fallback message")).rejects.toThrow(
      "fallback message",
    );
  });

  test("handleApiResponse resolves silently on a 2xx response", async () => {
    await expect(
      handleApiResponse(jsonResponse({}, { status: 200 }), "fb"),
    ).resolves.toBeUndefined();
  });
});

// ---- URL builders ----------------------------------------------------------
describe("URL builders", () => {
  test("list builders omit q when blank and trim+set it otherwise", () => {
    expect(buildBuyersUrl("http://x")).toBe("http://x/buyers");
    expect(buildBuyersUrl("http://x", "  ")).toBe("http://x/buyers");
    expect(buildBuyersUrl("http://x", "  ali ")).toBe("http://x/buyers?q=ali");
    expect(buildSuppliersUrl("http://x", "acme")).toBe("http://x/suppliers?q=acme");
    expect(buildExpensesUrl("http://x", "rent")).toBe("http://x/expenses?q=rent");
    expect(buildIngredientPurchasesUrl("http://x", "p")).toBe(
      "http://x/ingredient-purchases?q=p",
    );
    expect(buildProductionBatchesUrl("http://x", "b")).toBe(
      "http://x/production-batches?q=b",
    );
    expect(buildPurchaseCorrectionsUrl("http://x", "c")).toBe(
      "http://x/purchase-corrections?q=c",
    );
    expect(buildSalesInvoicesUrl("http://x", "s")).toBe(
      "http://x/sales-invoices?q=s",
    );
  });

  test("products/ingredients builders add archived=true only when requested", () => {
    expect(buildProductsUrl("http://x")).toBe("http://x/products");
    expect(buildProductsUrl("http://x", "cake", true)).toBe(
      "http://x/products?q=cake&archived=true",
    );
    expect(buildIngredientsUrl("http://x", undefined, true)).toBe(
      "http://x/ingredients?archived=true",
    );
  });

  test("action and detail builders compose the right path", () => {
    expect(buildProductActionUrl("http://x", 5, "archive")).toBe(
      "http://x/products/5/archive",
    );
    expect(buildIngredientActionUrl("http://x", 9, "reactivate")).toBe(
      "http://x/ingredients/9/reactivate",
    );
    expect(buildExpenseDetailUrl("http://x", 3)).toBe("http://x/expenses/3");
    expect(buildIngredientPurchaseDetailUrl("http://x", 4)).toBe(
      "http://x/ingredient-purchases/4",
    );
    expect(buildProductionBatchDetailUrl("http://x", 7)).toBe(
      "http://x/production-batches/7",
    );
    expect(buildPurchaseCorrectionDetailUrl("http://x", 8)).toBe(
      "http://x/purchase-corrections/8",
    );
    expect(buildSalesInvoiceDetailUrl("http://x", 9)).toBe(
      "http://x/sales-invoices/9",
    );
  });
});

describe("mergeJsonHeaders", () => {
  test("sets Content-Type when absent and preserves an existing one", () => {
    expect(mergeJsonHeaders().get("Content-Type")).toBe("application/json");
    const existing = mergeJsonHeaders({ "Content-Type": "text/csv" });
    expect(existing.get("Content-Type")).toBe("text/csv");
  });
});

// ---- GET helpers forward query + cookie, return parsed json ----------------
describe("list/detail fetchers", () => {
  test("getBuyers passes the query and cookie and returns parsed rows", async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 1 }]));
    const rows = await getBuyers("ali", { cookieHeader: "s=1" });
    expect(rows).toEqual([{ id: 1 }]);
    expect(lastUrl()).toContain("/buyers?q=ali");
    expect(lastInit().headers).toMatchObject({ Cookie: "s=1" });
    expect(lastInit()).toMatchObject({ cache: "no-store", credentials: "include" });
  });

  test("each list fetcher hits its own endpoint", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await getSuppliers();
    expect(lastUrl()).toContain("/suppliers");
    await getProducts();
    expect(lastUrl()).toContain("/products");
    await getIngredients();
    expect(lastUrl()).toContain("/ingredients");
    await getExpenses();
    expect(lastUrl()).toContain("/expenses");
    await getIngredientPurchases();
    expect(lastUrl()).toContain("/ingredient-purchases");
    await getProductionBatches();
    expect(lastUrl()).toContain("/production-batches");
    await getPurchaseCorrections();
    expect(lastUrl()).toContain("/purchase-corrections");
    await getSalesInvoices();
    expect(lastUrl()).toContain("/sales-invoices");
  });

  test("detail fetchers request the id path", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 42 }));
    expect(await getExpense(42)).toEqual({ id: 42 });
    expect(lastUrl()).toContain("/expenses/42");
    await getIngredientPurchase(42);
    expect(lastUrl()).toContain("/ingredient-purchases/42");
    await getProductionBatch(42);
    expect(lastUrl()).toContain("/production-batches/42");
    await getPurchaseCorrection(42);
    expect(lastUrl()).toContain("/purchase-corrections/42");
    await getSalesInvoice(42);
    expect(lastUrl()).toContain("/sales-invoices/42");
  });

  test("a fetcher surfaces the api error message", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "nope" }, { status: 500 }),
    );
    await expect(getBuyers()).rejects.toThrow("nope");
  });
});

// ---- mutations send method + JSON body, return the created entity ----------
describe("mutations", () => {
  test("createBuyer POSTs the serialized input with JSON headers", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1, name: "Ali" }));
    const created = await createBuyer({ name: "Ali", phone: "1" } as never);
    expect(created).toEqual({ id: 1, name: "Ali" });
    const init = lastInit();
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({ name: "Ali" });
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  test("updateBuyer PATCHes the id path", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 2 }));
    await updateBuyer(2, { name: "X" });
    expect(lastUrl()).toContain("/buyers/2");
    expect(lastInit().method).toBe("PATCH");
  });

  test("deleteBuyer issues DELETE and resolves on ok", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 200 }));
    await expect(deleteBuyer(3)).resolves.toBeUndefined();
    expect(lastUrl()).toContain("/buyers/3");
    expect(lastInit().method).toBe("DELETE");
  });

  test("supplier/product mutations route correctly", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));
    await createSupplier({ name: "S" } as never);
    expect(lastInit().method).toBe("POST");
    await updateSupplier(5, { name: "S2" });
    expect(lastUrl()).toContain("/suppliers/5");
    await deleteSupplier(6);
    expect(lastInit().method).toBe("DELETE");

    await createProduct({ name: "P" } as never);
    await updateProduct(7, { name: "P2" });
    expect(lastUrl()).toContain("/products/7");
    await archiveProduct(8);
    expect(lastUrl()).toContain("/products/8/archive");
    await reactivateProduct(9);
    expect(lastUrl()).toContain("/products/9/reactivate");
    await deleteProduct(10);
    expect(lastInit().method).toBe("DELETE");
  });

  test("ingredient mutations route correctly and surface delete errors", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));
    await createIngredient({ name: "I" } as never);
    await updateIngredient(2, { name: "I2" });
    expect(lastUrl()).toContain("/ingredients/2");
    await archiveIngredient(3);
    expect(lastUrl()).toContain("/ingredients/3/archive");
    await reactivateIngredient(4);
    expect(lastUrl()).toContain("/ingredients/4/reactivate");

    fetchMock.mockResolvedValue(
      jsonResponse({ message: "in use" }, { status: 409 }),
    );
    await expect(deleteIngredient(5)).rejects.toThrow("in use");
  });

  test("createIngredient surfaces a mutate error message", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "dup name" }, { status: 409 }),
    );
    await expect(createIngredient({ name: "I" } as never)).rejects.toThrow(
      "dup name",
    );
  });

  test("expense/purchase/batch/correction creators POST and return the entity", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 99 }));
    expect(await createExpense({ amount: 1 } as never)).toEqual({ id: 99 });
    expect(lastUrl()).toContain("/expenses");
    expect(await createIngredientPurchase({ supplierId: 1 } as never)).toEqual({
      id: 99,
    });
    expect(lastUrl()).toContain("/ingredient-purchases");
    await createProductionBatch({ productId: 1 } as never);
    expect(lastUrl()).toContain("/production-batches");
    await createPurchaseCorrection({ sourcePurchaseId: 1 } as never);
    expect(lastUrl()).toContain("/purchase-corrections");
    await createSalesInvoice({ buyerId: 1 } as never);
    expect(lastUrl()).toContain("/sales-invoices");
    expect(lastInit().method).toBe("POST");
  });
});

// ---- auth ------------------------------------------------------------------
describe("auth", () => {
  test("login POSTs credentials and returns the user payload", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, user: { username: "a" } }));
    const result = await login({ username: "a", password: "p" });
    expect(result).toMatchObject({ ok: true, user: { username: "a" } });
    expect(lastUrl()).toContain("/auth/login");
    expect(JSON.parse(lastInit().body as string)).toEqual({
      username: "a",
      password: "p",
    });
  });

  test("login throws the api message on failure", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "bad creds" }, { status: 401 }),
    );
    await expect(login({ username: "a", password: "x" })).rejects.toBeInstanceOf(
      AuthRequiredError,
    );
  });

  test("logout treats 204 and 401 as success and POSTs to /auth/logout", async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, { status: 204 }));
    await expect(logout()).resolves.toBeUndefined();
    expect(lastUrl()).toContain("/auth/logout");

    fetchMock.mockResolvedValue(jsonResponse(null, { status: 401 }));
    await expect(logout()).resolves.toBeUndefined();
  });

  test("logout throws on an unexpected error status", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "boom" }, { status: 500 }));
    await expect(logout()).rejects.toThrow("boom");
  });
});
