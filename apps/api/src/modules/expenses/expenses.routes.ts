import { Router, type Router as ExpressRouter } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  createExpenseHandler,
  getExpenseHandler,
  listExpensesHandler,
} from "./expenses.controller.js";
import { createExpenseSchema } from "./expenses.validation.js";

export const expensesRouter: ExpressRouter = Router();

expensesRouter.get("/", listExpensesHandler);
expensesRouter.get("/:id", getExpenseHandler);
expensesRouter.post("/", validateBody(createExpenseSchema), createExpenseHandler);
