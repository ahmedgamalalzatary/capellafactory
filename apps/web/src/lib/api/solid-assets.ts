import type {
  SolidAssetInput,
  SolidAssetWithTotalPrice,
} from "@capella/shared/solid-assets/solid-asset.types";
import {
  API_URL,
  CLIENT_API_URL,
  handleApiResponse,
  withApiCredentials,
} from "./request";
import { mergeJsonHeaders } from "./buyers";

function buildSolidAssetsUrl(baseUrl: string, query?: string) {
  const url = new URL("/solid-assets", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return url.toString();
}

export async function getSolidAssets(
  query?: string,
  options?: { cookieHeader?: string },
): Promise<SolidAssetWithTotalPrice[]> {
  const response = await fetch(
    buildSolidAssetsUrl(API_URL, query),
    withApiCredentials({ cache: "no-store" }, options?.cookieHeader),
  );

  await handleApiResponse(response, "Failed to fetch solid assets");

  return (await response.json()) as SolidAssetWithTotalPrice[];
}

export async function createSolidAsset(input: SolidAssetInput) {
  return mutateSolidAsset(`${CLIENT_API_URL}/solid-assets`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateSolidAsset(id: number, input: Partial<SolidAssetInput>) {
  return mutateSolidAsset(`${CLIENT_API_URL}/solid-assets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteSolidAsset(id: number) {
  const response = await fetch(
    `${CLIENT_API_URL}/solid-assets/${id}`,
    withApiCredentials({ method: "DELETE" }),
  );

  await handleApiResponse(response, "Failed to delete solid asset");
}

async function mutateSolidAsset(url: string, init: RequestInit) {
  const response = await fetch(
    url,
    withApiCredentials({
      ...init,
      headers: mergeJsonHeaders(init.headers),
    }),
  );

  await handleApiResponse(response, "Solid asset request failed");

  return (await response.json()) as SolidAssetWithTotalPrice;
}
