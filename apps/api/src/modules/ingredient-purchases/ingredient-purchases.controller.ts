import type { Request, Response } from "express";
import {
  addIngredientPurchase,
  getIngredientPurchase,
  getIngredientPurchases,
} from "./ingredient-purchases.service.js";
import { IngredientPurchaseValidationError } from "./ingredient-purchases.validators.js";

export async function listIngredientPurchasesHandler(request: Request, response: Response) {
  const query = typeof request.query.q === "string" ? request.query.q : undefined;
  response.json(await getIngredientPurchases(query));
}

export async function getIngredientPurchaseHandler(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ message: "Invalid ingredient purchase id" });
    return;
  }

  const purchase = await getIngredientPurchase(id);

  if (!purchase) {
    response.status(404).json({ message: "Ingredient purchase not found" });
    return;
  }

  response.json(purchase);
}

export async function createIngredientPurchaseHandler(request: Request, response: Response) {
  try {
    const purchase = await addIngredientPurchase(request.body);
    response.status(201).json(purchase);
  } catch (error) {
    if (error instanceof IngredientPurchaseValidationError) {
      response.status(400).json({ message: error.message });
      return;
    }

    throw error;
  }
}
