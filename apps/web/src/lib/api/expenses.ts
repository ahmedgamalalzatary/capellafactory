import type {
  Expense,
  ExpenseInput,
} from "@capella/shared/expenses/expense.types";

import {
  API_URL,
  CLIENT_API_URL,
  handleApiResponse,
  withApiCredentials,
} from "./request";

export function buildExpensesUrl(baseUrl: string, query?: string) {
  const url = new URL("/expenses", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return url.toString();
}

export function buildExpenseDetailUrl(baseUrl: string, id: number) {
  return new URL(`/expenses/${id}`, baseUrl).toString();
}

export async function getExpenses(
  query?: string,
  options?: { cookieHeader?: string },
): Promise<Expense[]> {
  const response = await fetch(
    buildExpensesUrl(API_URL, query),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch expenses");

  return (await response.json()) as Expense[];
}

export async function getExpense(
  id: number,
  options?: { cookieHeader?: string },
): Promise<Expense> {
  const response = await fetch(
    buildExpenseDetailUrl(API_URL, id),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch expense");

  return (await response.json()) as Expense;
}

export async function createExpense(input: ExpenseInput) {
  const response = await fetch(
    `${CLIENT_API_URL}/expenses`,
    withApiCredentials({
      method: "POST",
      headers: mergeJsonHeaders(),
      body: JSON.stringify(input),
    }),
  );

  await handleApiResponse(response, "Expense request failed");

  return (await response.json()) as Expense;
}

export function mergeJsonHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}
