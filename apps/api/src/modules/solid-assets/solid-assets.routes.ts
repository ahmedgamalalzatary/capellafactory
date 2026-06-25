import { Router, type Router as ExpressRouter } from "express";
import { validateBody } from "../../middlewares/validate.middleware.js";
import {
  createSolidAssetHandler,
  deleteSolidAssetHandler,
  getSolidAssetHandler,
  listSolidAssetsHandler,
  updateSolidAssetHandler,
} from "./solid-assets.controller.js";
import { createSolidAssetSchema, updateSolidAssetSchema } from "./solid-assets.validation.js";

export const solidAssetsRouter: ExpressRouter = Router();

solidAssetsRouter.get("/", listSolidAssetsHandler);
solidAssetsRouter.get("/:id", getSolidAssetHandler);
solidAssetsRouter.post("/", validateBody(createSolidAssetSchema), createSolidAssetHandler);
solidAssetsRouter.patch("/:id", validateBody(updateSolidAssetSchema), updateSolidAssetHandler);
solidAssetsRouter.delete("/:id", deleteSolidAssetHandler);
