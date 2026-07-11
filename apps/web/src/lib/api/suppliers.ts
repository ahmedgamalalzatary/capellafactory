import type {
  Supplier,
  SupplierInput,
} from "@capella/shared/suppliers/supplier.types";

import {
  API_URL,
  CLIENT_API_URL,
  handleApiResponse,
  withApiCredentials,
} from "./request";

export function buildSuppliersUrl(baseUrl: string, query?: string) {
  const url = new URL("/suppliers", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return url.toString();
}

export function buildSupplierDetailUrl(baseUrl: string, id: number) {
  return new URL(`/suppliers/${id}`, baseUrl).toString();
}

export async function getSuppliers(
  query?: string,
  options?: { cookieHeader?: string },
): Promise<Supplier[]> {
  const response = await fetch(
    buildSuppliersUrl(API_URL, query),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch suppliers");

  return (await response.json()) as Supplier[];
}

export async function getSupplier(id: number, options?: { cookieHeader?: string }): Promise<Supplier | null> {
  const response = await fetch(
    buildSupplierDetailUrl(API_URL, id),
    withApiCredentials({ cache: "no-store" }, options?.cookieHeader),
  );

  if (response.status === 404) {
    return null;
  }

  await handleApiResponse(response, "Failed to fetch supplier");

  return (await response.json()) as Supplier;
}

export async function createSupplier(input: SupplierInput) {
  return mutateSupplier(`${CLIENT_API_URL}/suppliers`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateSupplier(
  id: number,
  input: Partial<SupplierInput>,
) {
  return mutateSupplier(`${CLIENT_API_URL}/suppliers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteSupplier(id: number) {
  const response = await fetch(
    `${CLIENT_API_URL}/suppliers/${id}`,
    withApiCredentials({
      method: "DELETE",
    }),
  );

  await handleApiResponse(response, "Failed to delete supplier");
}

export function mergeJsonHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function mutateSupplier(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...withApiCredentials({
      ...init,
      headers: mergeJsonHeaders(init.headers),
    }),
  });

  await handleApiResponse(response, "Supplier request failed");

  return (await response.json()) as Supplier;
}
