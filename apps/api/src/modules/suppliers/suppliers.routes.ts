import { Router, type Router as ExpressRouter } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  createSupplierHandler,
  deleteSupplierHandler,
  getSupplierHandler,
  listSuppliersHandler,
  updateSupplierHandler,
} from "./suppliers.controller.js";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./suppliers.validation.js";

export const suppliersRouter: ExpressRouter = Router();

suppliersRouter.get("/", listSuppliersHandler);
suppliersRouter.get("/:id", getSupplierHandler);
suppliersRouter.post("/", validateBody(createSupplierSchema), createSupplierHandler);
suppliersRouter.patch("/:id", validateBody(updateSupplierSchema), updateSupplierHandler);
suppliersRouter.delete("/:id", deleteSupplierHandler);
