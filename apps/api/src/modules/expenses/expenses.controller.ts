import type { Request, Response } from "express";
import { addExpense, getExpense, getExpenses } from "./expenses.service.js";

export async function listExpensesHandler(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  response.json(await getExpenses(query));
}

export async function getExpenseHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "Invalid expense id" });
    return;
  }

  const expense = await getExpense(id);

  if (!expense) {
    response.status(404).json({ message: "Expense not found" });
    return;
  }

  response.json(expense);
}

export async function createExpenseHandler(request: Request, response: Response) {
  const expense = await addExpense(request.body);
  response.status(201).json(expense);
}
