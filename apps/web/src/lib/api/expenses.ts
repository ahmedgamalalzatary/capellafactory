import type { Expense, ExpenseInput } from "@capella/shared/expenses/expense.types";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const CLIENT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4000";

export function buildExpensesUrl(baseUrl: string, query?: string) {
  const url = new URL("/expenses", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return url.toString();
}

export async function getExpenses(query?: string): Promise<Expense[]> {
  const response = await fetch(buildExpensesUrl(API_URL, query), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch expenses");
  }

  return (await response.json()) as Expense[];
}

export async function createExpense(input: ExpenseInput) {
  const response = await fetch(`${CLIENT_API_URL}/expenses`, {
    method: "POST",
    headers: mergeJsonHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string; issues?: Array<{ message?: string }> }
      | null;
    const issueMessage = payload?.issues?.[0]?.message;
    throw new Error(issueMessage ?? payload?.message ?? "Expense request failed");
  }

  return (await response.json()) as Expense;
}

export function mergeJsonHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}
