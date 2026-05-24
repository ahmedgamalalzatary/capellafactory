import type {
  Ingredient,
  IngredientInput,
} from "@capella/shared/ingredients/ingredient.types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const CLIENT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4000";

export function buildIngredientsUrl(baseUrl: string, query?: string, archived = false) {
  const url = new URL("/ingredients", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  if (archived) {
    url.searchParams.set("archived", "true");
  }

  return url.toString();
}

export function buildIngredientActionUrl(
  baseUrl: string,
  id: number,
  action: "archive" | "reactivate",
) {
  return new URL(`/ingredients/${id}/${action}`, baseUrl).toString();
}

export async function getIngredients(query?: string, archived = false): Promise<Ingredient[]> {
  const response = await fetch(buildIngredientsUrl(API_URL, query, archived), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch ingredients");
  }

  return (await response.json()) as Ingredient[];
}

export async function createIngredient(input: IngredientInput) {
  return mutateIngredient(`${CLIENT_API_URL}/ingredients`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateIngredient(id: number, input: Partial<IngredientInput>) {
  return mutateIngredient(`${CLIENT_API_URL}/ingredients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function archiveIngredient(id: number) {
  return mutateIngredient(buildIngredientActionUrl(CLIENT_API_URL, id, "archive"), {
    method: "PATCH",
  });
}

export async function reactivateIngredient(id: number) {
  return mutateIngredient(buildIngredientActionUrl(CLIENT_API_URL, id, "reactivate"), {
    method: "PATCH",
  });
}

export async function deleteIngredient(id: number) {
  const response = await fetch(`${CLIENT_API_URL}/ingredients/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(payload?.message ?? "Failed to delete ingredient");
  }
}

export function mergeJsonHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function mutateIngredient(url: string, init: RequestInit) {
  const response = await fetch(url, {
    headers: mergeJsonHeaders(init.headers),
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(payload?.message ?? "Ingredient request failed");
  }

  return (await response.json()) as Ingredient;
}
