import type { Express } from "express";
import { buyersRouter } from "../modules/buyers/buyers.routes.js";
import { suppliersRouter } from "../modules/suppliers/suppliers.routes.js";

export function registerRoutes(app: Express) {
  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/buyers", buyersRouter);
  app.use("/suppliers", suppliersRouter);
}
