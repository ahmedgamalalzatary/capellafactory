import type { ExpenseType } from "./expense.types.js";

export const expenseTypeLabels: Record<ExpenseType, string> = {
  rent: "إيجار",
  food: "أكل",
  water: "مياه",
  gas: "غاز",
  electricity: "كهرباء",
  internet: "إنترنت",
  salary: "مرتبات",
  other: "أخرى",
};

export function findExpenseTypesByLabelQuery(query?: string) {
  const normalizedQuery = query?.trim();

  if (!normalizedQuery) {
    return [] as ExpenseType[];
  }

  return (Object.entries(expenseTypeLabels) as Array<[ExpenseType, string]>)
    .filter(([, label]) => label.includes(normalizedQuery))
    .map(([type]) => type);
}
