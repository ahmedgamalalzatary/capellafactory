import { Router, type Router as ExpressRouter } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  createSalesInvoiceHandler,
  getSalesInvoiceHandler,
  listSalesInvoicesHandler,
} from "./sales-invoices.controller.js";
import { createSalesInvoiceSchema } from "./sales-invoices.validation.js";

export const salesInvoicesRouter: ExpressRouter = Router();

salesInvoicesRouter.get("/", listSalesInvoicesHandler);
salesInvoicesRouter.get("/:id", getSalesInvoiceHandler);
salesInvoicesRouter.post("/", validateBody(createSalesInvoiceSchema), createSalesInvoiceHandler);
