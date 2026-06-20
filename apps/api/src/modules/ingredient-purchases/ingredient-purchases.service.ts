import type { IngredientPurchaseInput } from "@capella/shared/ingredient-purchases/ingredient-purchase.types";
import type { AdditionalPaymentInput } from "@capella/shared/payments/payment.types";
import {
  addIngredientPurchasePayment,
  createIngredientPurchase,
  getIngredientPurchaseById,
  listIngredientPurchases,
} from "./ingredient-purchases.repository.js";

export async function getIngredientPurchases(query?: string) {
  return listIngredientPurchases(query);
}

export async function getIngredientPurchase(id: number) {
  return getIngredientPurchaseById(id);
}

export async function addIngredientPurchase(input: IngredientPurchaseInput) {
  return createIngredientPurchase(input);
}

export async function recordIngredientPurchasePayment(id: number, input: AdditionalPaymentInput) {
  return addIngredientPurchasePayment(id, input);
}
