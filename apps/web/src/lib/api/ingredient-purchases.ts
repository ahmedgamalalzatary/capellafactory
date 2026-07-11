import {
  API_URL,
  CLIENT_API_URL,
  handleApiResponse,
  withApiCredentials,
} from "./request";
import type {
  IngredientPurchase,
  IngredientPurchaseInput,
} from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { AdditionalPaymentInput } from "@capella/shared/payments/payment.types";

export function buildIngredientPurchasesUrl(baseUrl: string, query?: string, supplierId?: number) {
  const url = new URL("/ingredient-purchases", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  if (supplierId) {
    url.searchParams.set("supplierId", String(supplierId));
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

export async function getIngredientPurchases(
  query?: string,
  options?: { cookieHeader?: string; supplierId?: number },
) {
  const response = await fetch(
    buildIngredientPurchasesUrl(API_URL, query, options?.supplierId),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch ingredient purchases");

  return (await response.json()) as IngredientPurchase[];
}

export async function getIngredientPurchase(
  id: number,
  options?: { cookieHeader?: string },
) {
  const response = await fetch(
    buildIngredientPurchaseDetailUrl(API_URL, id),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch ingredient purchase");

  return (await response.json()) as IngredientPurchase;
}

export async function createIngredientPurchase(input: IngredientPurchaseInput) {
  const response = await fetch(
    `${CLIENT_API_URL}/ingredient-purchases`,
    withApiCredentials({
      method: "POST",
      headers: mergeJsonHeaders(),
      body: JSON.stringify(input),
    }),
  );

  await handleApiResponse(response, "Ingredient purchase request failed");

  return (await response.json()) as IngredientPurchase;
}

export async function addIngredientPurchasePayment(id: number, input: AdditionalPaymentInput) {
  const response = await fetch(
    `${CLIENT_API_URL}/ingredient-purchases/${id}/payments`,
    withApiCredentials({
      method: "POST",
      headers: mergeJsonHeaders(),
      body: JSON.stringify(input),
    }),
  );

  await handleApiResponse(response, "Ingredient purchase payment request failed");

  return (await response.json()) as IngredientPurchase;
}
