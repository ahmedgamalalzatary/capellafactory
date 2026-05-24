import type { Express } from "express";
import { suppliersRouter } from "../modules/suppliers/suppliers.routes.js";

export function registerRoutes(app: Express) {
  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/suppliers", suppliersRouter);
}
