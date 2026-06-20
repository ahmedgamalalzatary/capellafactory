import type { Request, Response } from "express";
import {
  addSalesInvoice,
  getSalesInvoice,
  getSalesInvoices,
  recordSalesInvoicePayment,
} from "./sales-invoices.service.js";
import { SalesInvoiceValidationError } from "./sales-invoices.validators.js";

export async function listSalesInvoicesHandler(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  response.json(await getSalesInvoices(query));
}

export async function getSalesInvoiceHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "Invalid sales invoice id" });
    return;
  }

  const invoice = await getSalesInvoice(id);

  if (!invoice) {
    response.status(404).json({ message: "Sales invoice not found" });
    return;
  }

  response.json(invoice);
}

export async function createSalesInvoiceHandler(request: Request, response: Response) {
  try {
    const invoice = await addSalesInvoice(request.body);
    response.status(201).json(invoice);
  } catch (error) {
    if (error instanceof SalesInvoiceValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }

    throw error;
  }
}

export async function addSalesInvoicePaymentHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "Invalid sales invoice id" });
    return;
  }

  try {
    const invoice = await recordSalesInvoicePayment(id, request.body);

    if (!invoice) {
      response.status(404).json({ message: "Sales invoice not found" });
      return;
    }

    response.status(201).json(invoice);
  } catch (error) {
    if (error instanceof SalesInvoiceValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }

    throw error;
  }
}
