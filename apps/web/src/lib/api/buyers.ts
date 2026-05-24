import type { Buyer, BuyerInput } from "@capella/shared/buyers/buyer.types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const CLIENT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4000";

export function buildBuyersUrl(baseUrl: string, query?: string) {
  const url = new URL("/buyers", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return url.toString();
}

export async function getBuyers(query?: string): Promise<Buyer[]> {
  const response = await fetch(buildBuyersUrl(API_URL, query), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch buyers");
  }

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
  const response = await fetch(`${CLIENT_API_URL}/buyers/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(payload?.message ?? "Failed to delete buyer");
  }
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
    headers: mergeJsonHeaders(init.headers),
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(payload?.message ?? "Buyer request failed");
  }

  return (await response.json()) as Buyer;
}
