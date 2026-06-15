import type {
  Product,
  ProductInput,
} from "@capella/shared/products/product.types";

import {
  API_URL,
  CLIENT_API_URL,
  handleApiResponse,
  withApiCredentials,
} from "./request";

export function buildProductsUrl(
  baseUrl: string,
  query?: string,
  archived = false,
) {
  const url = new URL("/products", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  if (archived) {
    url.searchParams.set("archived", "true");
  }

  return url.toString();
}

export function buildProductActionUrl(
  baseUrl: string,
  id: number,
  action: "archive" | "reactivate",
) {
  return new URL(`/products/${id}/${action}`, baseUrl).toString();
}

export async function getProducts(
  query?: string,
  archived = false,
  options?: { cookieHeader?: string },
): Promise<Product[]> {
  const response = await fetch(
    buildProductsUrl(API_URL, query, archived),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch products");

  return (await response.json()) as Product[];
}

export async function createProduct(input: ProductInput) {
  return mutateProduct(`${CLIENT_API_URL}/products`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProduct(id: number, input: Partial<ProductInput>) {
  return mutateProduct(`${CLIENT_API_URL}/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function archiveProduct(id: number) {
  return mutateProduct(buildProductActionUrl(CLIENT_API_URL, id, "archive"), {
    method: "PATCH",
  });
}

export async function reactivateProduct(id: number) {
  return mutateProduct(
    buildProductActionUrl(CLIENT_API_URL, id, "reactivate"),
    {
      method: "PATCH",
    },
  );
}

export async function deleteProduct(id: number) {
  const response = await fetch(
    `${CLIENT_API_URL}/products/${id}`,
    withApiCredentials({
      method: "DELETE",
    }),
  );

  await handleApiResponse(response, "Failed to delete product");
}

export function mergeJsonHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function mutateProduct(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...withApiCredentials({
      headers: mergeJsonHeaders(init.headers),
      ...init,
    }),
  });

  await handleApiResponse(response, "Product request failed");

  return (await response.json()) as Product;
}
