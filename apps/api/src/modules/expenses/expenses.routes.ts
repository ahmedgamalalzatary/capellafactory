import { Router, type Router as ExpressRouter } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  addExpensePaymentHandler,
  createExpenseHandler,
  getExpenseHandler,
  listExpensesHandler,
} from "./expenses.controller.js";
import { addExpensePaymentSchema, createExpenseSchema } from "./expenses.validation.js";

export const expensesRouter: ExpressRouter = Router();

expensesRouter.get("/", listExpensesHandler);
expensesRouter.get("/:id", getExpenseHandler);
expensesRouter.post("/:id/payments", validateBody(addExpensePaymentSchema), addExpensePaymentHandler);
expensesRouter.post("/", validateBody(createExpenseSchema), createExpenseHandler);
