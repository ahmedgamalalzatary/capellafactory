import type {
  ProductionBatch,
  ProductionBatchInput,
} from "@capella/shared/production-batches/production-batch.types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const CLIENT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4000";

export function buildProductionBatchesUrl(baseUrl: string, query?: string) {
  const url = new URL("/production-batches", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return url.toString();
}

export function mergeJsonHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function getProductionBatches(query?: string) {
  const response = await fetch(buildProductionBatchesUrl(API_URL, query), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch production batches");
  }

  return (await response.json()) as ProductionBatch[];
}

export async function createProductionBatch(input: ProductionBatchInput) {
  const response = await fetch(`${CLIENT_API_URL}/production-batches`, {
    method: "POST",
    headers: mergeJsonHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(payload?.message ?? "Production batch request failed");
  }

  return (await response.json()) as ProductionBatch;
}
