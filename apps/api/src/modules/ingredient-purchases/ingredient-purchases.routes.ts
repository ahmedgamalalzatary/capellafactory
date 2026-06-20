import { Router, type Router as ExpressRouter } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  addIngredientPurchasePaymentHandler,
  createIngredientPurchaseHandler,
  getIngredientPurchaseHandler,
  listIngredientPurchasesHandler,
} from "./ingredient-purchases.controller.js";
import {
  addIngredientPurchasePaymentSchema,
  createIngredientPurchaseSchema,
} from "./ingredient-purchases.validation.js";

export const ingredientPurchasesRouter: ExpressRouter = Router();

ingredientPurchasesRouter.get("/", listIngredientPurchasesHandler);
ingredientPurchasesRouter.get("/:id", getIngredientPurchaseHandler);
ingredientPurchasesRouter.post(
  "/:id/payments",
  validateBody(addIngredientPurchasePaymentSchema),
  addIngredientPurchasePaymentHandler,
);
ingredientPurchasesRouter.post(
  "/",
  validateBody(createIngredientPurchaseSchema),
  createIngredientPurchaseHandler,
);
