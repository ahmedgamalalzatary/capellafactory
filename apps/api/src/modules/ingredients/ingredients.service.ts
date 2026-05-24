import type { IngredientInput } from "@capella/shared/ingredients/ingredient.types";
import {
  archiveIngredient,
  createIngredient,
  deleteIngredient,
  getIngredientById,
  listIngredients,
  reactivateIngredient,
  updateIngredient,
} from "./ingredients.repository.js";

export async function getIngredients(query?: string, includeArchived = false) {
  return listIngredients(query, includeArchived);
}

export async function getIngredient(id: number) {
  return getIngredientById(id);
}

export async function addIngredient(input: IngredientInput) {
  return createIngredient(input);
}

export async function editIngredient(id: number, input: Partial<IngredientInput>) {
  return updateIngredient(id, input);
}

export async function archiveIngredientRecord(id: number) {
  return archiveIngredient(id);
}

export async function reactivateIngredientRecord(id: number) {
  return reactivateIngredient(id);
}

export async function removeIngredient(id: number) {
  return deleteIngredient(id);
}
