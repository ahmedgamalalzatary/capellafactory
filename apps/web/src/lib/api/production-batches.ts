import type {
  ProductionBatch,
  ProductionBatchInput,
} from "@capella/shared/production-batches/production-batch.types";

import {
  API_URL,
  CLIENT_API_URL,
  handleApiResponse,
  withApiCredentials,
} from "./request";

export function buildProductionBatchesUrl(baseUrl: string, query?: string) {
  const url = new URL("/production-batches", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return url.toString();
}

export function buildProductionBatchDetailUrl(baseUrl: string, id: number) {
  return new URL(`/production-batches/${id}`, baseUrl).toString();
}

export function mergeJsonHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function getProductionBatches(
  query?: string,
  options?: { cookieHeader?: string },
) {
  const response = await fetch(
    buildProductionBatchesUrl(API_URL, query),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch production batches");

  return (await response.json()) as ProductionBatch[];
}

export async function getProductionBatch(
  id: number,
  options?: { cookieHeader?: string },
) {
  const response = await fetch(
    buildProductionBatchDetailUrl(API_URL, id),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch production batch");

  return (await response.json()) as ProductionBatch;
}

export async function createProductionBatch(input: ProductionBatchInput) {
  const response = await fetch(
    `${CLIENT_API_URL}/production-batches`,
    withApiCredentials({
      method: "POST",
      headers: mergeJsonHeaders(),
      body: JSON.stringify(input),
    }),
  );

  await handleApiResponse(response, "Production batch request failed");

  return (await response.json()) as ProductionBatch;
}
