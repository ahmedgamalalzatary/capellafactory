const API_URL = process.env.API_URL ?? "http://localhost:4000";
const CLIENT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4000";
import type {
  IngredientPurchase,
  IngredientPurchaseInput,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";

export function buildIngredientPurchasesUrl(baseUrl: string, query?: string) {
  const url = new URL("/ingredient-purchases", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return url.toString();
}

export function buildIngredientPurchaseDetailUrl(baseUrl: string, id: number) {
  return new URL(`/ingredient-purchases/${id}`, baseUrl).toString();
}

export function mergeJsonHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function getIngredientPurchases(query?: string) {
  const response = await fetch(buildIngredientPurchasesUrl(API_URL, query), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch ingredient purchases");
  }

  return (await response.json()) as IngredientPurchase[];
}

export async function getIngredientPurchase(id: number) {
  const response = await fetch(buildIngredientPurchaseDetailUrl(API_URL, id), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch ingredient purchase");
  }

  return (await response.json()) as IngredientPurchase;
}

export async function createIngredientPurchase(input: IngredientPurchaseInput) {
  const response = await fetch(`${CLIENT_API_URL}/ingredient-purchases`, {
    method: "POST",
    headers: mergeJsonHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(payload?.message ?? "Ingredient purchase request failed");
  }

  return (await response.json()) as IngredientPurchase;
}
