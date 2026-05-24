import { Router, type Router as ExpressRouter } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  archiveProductHandler,
  createProductHandler,
  deleteProductHandler,
  getProductHandler,
  listProductsHandler,
  reactivateProductHandler,
  updateProductHandler,
} from "./products.controller.js";
import { createProductSchema, updateProductSchema } from "./products.validation.js";

export const productsRouter: ExpressRouter = Router();

productsRouter.get("/", listProductsHandler);
productsRouter.get("/:id", getProductHandler);
productsRouter.post("/", validateBody(createProductSchema), createProductHandler);
productsRouter.patch("/:id", validateBody(updateProductSchema), updateProductHandler);
productsRouter.patch("/:id/archive", archiveProductHandler);
productsRouter.patch("/:id/reactivate", reactivateProductHandler);
productsRouter.delete("/:id", deleteProductHandler);
