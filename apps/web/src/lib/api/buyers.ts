import type { Buyer, BuyerInput } from "@capella/shared/buyers/buyer.types";
import {
  API_URL,
  CLIENT_API_URL,
  handleApiResponse,
  withApiCredentials,
} from "./request";

export function buildBuyersUrl(baseUrl: string, query?: string) {
  const url = new URL("/buyers", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return url.toString();
}

export async function getBuyers(
  query?: string,
  options?: { cookieHeader?: string },
): Promise<Buyer[]> {
  const response = await fetch(
    buildBuyersUrl(API_URL, query),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch buyers");

  return (await response.json()) as Buyer[];
}

export async function createBuyer(input: BuyerInput) {
  return mutateBuyer(`${CLIENT_API_URL}/buyers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBuyer(id: number, input: Partial<BuyerInput>) {
  return mutateBuyer(`${CLIENT_API_URL}/buyers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteBuyer(id: number) {
  const response = await fetch(
    `${CLIENT_API_URL}/buyers/${id}`,
    withApiCredentials({
      method: "DELETE",
    }),
  );

  await handleApiResponse(response, "Failed to delete buyer");
}

export function mergeJsonHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function mutateBuyer(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...withApiCredentials({
      headers: mergeJsonHeaders(init.headers),
      ...init,
    }),
  });

  await handleApiResponse(response, "Buyer request failed");

  return (await response.json()) as Buyer;
}
