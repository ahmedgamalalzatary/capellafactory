import { Router, type Router as ExpressRouter } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  createProductionBatchHandler,
  getProductionBatchHandler,
  listProductionBatchesHandler,
} from "./production-batches.controller.js";
import { createProductionBatchSchema } from "./production-batches.validation.js";

export const productionBatchesRouter: ExpressRouter = Router();

productionBatchesRouter.get("/", listProductionBatchesHandler);
productionBatchesRouter.get("/:id", getProductionBatchHandler);
productionBatchesRouter.post(
  "/",
  validateBody(createProductionBatchSchema),
  createProductionBatchHandler,
);
