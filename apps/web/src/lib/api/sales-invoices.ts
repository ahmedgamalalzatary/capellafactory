import type {
  SalesInvoice,
  SalesInvoiceInput,
} from "@capella/shared/sales-invoices/sales-invoice.types";
import type { AdditionalPaymentInput } from "@capella/shared/payments/payment.types";

import {
  API_URL,
  CLIENT_API_URL,
  handleApiResponse,
  withApiCredentials,
} from "./request";

export function buildSalesInvoicesUrl(baseUrl: string, query?: string) {
  const url = new URL("/sales-invoices", baseUrl);
  const normalizedQuery = query?.trim();

  if (normalizedQuery) {
    url.searchParams.set("q", normalizedQuery);
  }

  return url.toString();
}

export function buildSalesInvoiceDetailUrl(baseUrl: string, id: number) {
  return new URL(`/sales-invoices/${id}`, baseUrl).toString();
}

export function mergeJsonHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function getSalesInvoices(query?: string, options?: { cookieHeader?: string }) {
  const response = await fetch(
    buildSalesInvoicesUrl(API_URL, query),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch sales invoices");

  return (await response.json()) as SalesInvoice[];
}

export async function getSalesInvoice(id: number, options?: { cookieHeader?: string }) {
  const response = await fetch(
    buildSalesInvoiceDetailUrl(API_URL, id),
    withApiCredentials(
      {
        cache: "no-store",
      },
      options?.cookieHeader,
    ),
  );

  await handleApiResponse(response, "Failed to fetch sales invoice");

  return (await response.json()) as SalesInvoice;
}

export async function createSalesInvoice(input: SalesInvoiceInput) {
  const response = await fetch(
    `${CLIENT_API_URL}/sales-invoices`,
    withApiCredentials({
      method: "POST",
      headers: mergeJsonHeaders(),
      body: JSON.stringify(input),
    }),
  );

  await handleApiResponse(response, "Sales invoice request failed");

  return (await response.json()) as SalesInvoice;
}

export async function addSalesInvoicePayment(id: number, input: AdditionalPaymentInput) {
  const response = await fetch(
    `${CLIENT_API_URL}/sales-invoices/${id}/payments`,
    withApiCredentials({
      method: "POST",
      headers: mergeJsonHeaders(),
      body: JSON.stringify(input),
    }),
  );

  await handleApiResponse(response, "Sales invoice payment request failed");

  return (await response.json()) as SalesInvoice;
}
