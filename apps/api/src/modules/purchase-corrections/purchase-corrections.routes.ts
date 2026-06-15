import { Router, type Router as ExpressRouter } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  createPurchaseCorrectionHandler,
  getPurchaseCorrectionHandler,
  listPurchaseCorrectionsHandler,
} from "./purchase-corrections.controller.js";
import { createPurchaseCorrectionSchema } from "./purchase-corrections.validation.js";

export const purchaseCorrectionsRouter: ExpressRouter = Router();

purchaseCorrectionsRouter.get("/", listPurchaseCorrectionsHandler);
purchaseCorrectionsRouter.get("/:id", getPurchaseCorrectionHandler);
purchaseCorrectionsRouter.post(
  "/",
  validateBody(createPurchaseCorrectionSchema),
  createPurchaseCorrectionHandler,
);
