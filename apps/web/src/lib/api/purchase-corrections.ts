import {
  API_URL,
  CLIENT_API_URL,
  handleApiResponse,
  withApiCredentials,
} from "./request";
import { mergeJsonHeaders } from "./ingredient-purchases";
import type {
  PurchaseCorrection,
  PurchaseCorrectionInput,
} from "@capella/shared/purchase-corrections/purchase-correction.types";

export function buildPurchaseCorrectionsUrl(baseUrl: string, query?: string) {
  const url = new URL("/purchase-corrections", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return url.toString();
}

export function buildPurchaseCorrectionDetailUrl(baseUrl: string, id: number) {
  return new URL(`/purchase-corrections/${id}`, baseUrl).toString();
}

export async function getPurchaseCorrections(
  query?: string,
  options?: { cookieHeader?: string },
) {
  const response = await fetch(
    buildPurchaseCorrectionsUrl(API_URL, query),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch purchase corrections");

  return (await response.json()) as PurchaseCorrection[];
}

export async function getPurchaseCorrection(
  id: number,
  options?: { cookieHeader?: string },
) {
  const response = await fetch(
    buildPurchaseCorrectionDetailUrl(API_URL, id),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch purchase correction");

  return (await response.json()) as PurchaseCorrection;
}

export async function createPurchaseCorrection(input: PurchaseCorrectionInput) {
  const response = await fetch(
    `${CLIENT_API_URL}/purchase-corrections`,
    withApiCredentials({
      method: "POST",
      headers: mergeJsonHeaders(),
      body: JSON.stringify(input),
    }),
  );

  await handleApiResponse(response, "Purchase correction request failed");

  return (await response.json()) as PurchaseCorrection;
}
