import { Router, type Router as ExpressRouter } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  createBuyerHandler,
  deleteBuyerHandler,
  getBuyerHandler,
  listBuyersHandler,
  updateBuyerHandler,
} from "./buyers.controller.js";
import { createBuyerSchema, updateBuyerSchema } from "./buyers.validation.js";

export const buyersRouter: ExpressRouter = Router();

buyersRouter.get("/", listBuyersHandler);
buyersRouter.get("/:id", getBuyerHandler);
buyersRouter.post("/", validateBody(createBuyerSchema), createBuyerHandler);
buyersRouter.patch("/:id", validateBody(updateBuyerSchema), updateBuyerHandler);
buyersRouter.delete("/:id", deleteBuyerHandler);
