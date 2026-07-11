import type { Request, Response } from "express";
import {
  addExpense,
  getExpense,
  getExpenses,
  recordExpensePayment,
} from "./expenses.service.js";
import { ExpenseValidationError } from "./expenses.validators.js";

export async function listExpensesHandler(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  response.json(await getExpenses(query));
}

export async function getExpenseHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف المصروف غير صالح" });
    return;
  }

  const expense = await getExpense(id);

  if (!expense) {
    response.status(404).json({ message: "المصروف غير موجود" });
    return;
  }

  response.json(expense);
}

export async function createExpenseHandler(request: Request, response: Response) {
  const expense = await addExpense(request.body);
  response.status(201).json(expense);
}

export async function addExpensePaymentHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "معرّف المصروف غير صالح" });
    return;
  }

  try {
    const expense = await recordExpensePayment(id, request.body);

    if (!expense) {
      response.status(404).json({ message: "المصروف غير موجود" });
      return;
    }

    response.status(201).json(expense);
  } catch (error) {
    if (error instanceof ExpenseValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }

    throw error;
  }
}
