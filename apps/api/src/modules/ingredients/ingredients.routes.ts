import { Router, type Router as ExpressRouter } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  archiveIngredientHandler,
  createIngredientHandler,
  deleteIngredientHandler,
  getIngredientHandler,
  listIngredientsHandler,
  reactivateIngredientHandler,
  updateIngredientHandler,
} from "./ingredients.controller.js";
import {
  createIngredientSchema,
  updateIngredientSchema,
} from "./ingredients.validation.js";

export const ingredientsRouter: ExpressRouter = Router();

ingredientsRouter.get("/", listIngredientsHandler);
ingredientsRouter.get("/:id", getIngredientHandler);
ingredientsRouter.post("/", validateBody(createIngredientSchema), createIngredientHandler);
ingredientsRouter.patch("/:id", validateBody(updateIngredientSchema), updateIngredientHandler);
ingredientsRouter.patch("/:id/archive", archiveIngredientHandler);
ingredientsRouter.patch("/:id/reactivate", reactivateIngredientHandler);
ingredientsRouter.delete("/:id", deleteIngredientHandler);
