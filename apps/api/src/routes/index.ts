import type { Express } from "express";
import { buyersRouter } from "../modules/buyers/buyers.routes.js";
import { expensesRouter } from "../modules/expenses/expenses.routes.js";
import { ingredientsRouter } from "../modules/ingredients/ingredients.routes.js";
import { productsRouter } from "../modules/products/products.routes.js";
import { suppliersRouter } from "../modules/suppliers/suppliers.routes.js";

export function registerRoutes(app: Express) {
  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/buyers", buyersRouter);
  app.use("/expenses", expensesRouter);
  app.use("/ingredients", ingredientsRouter);
  app.use("/products", productsRouter);
  app.use("/suppliers", suppliersRouter);
}
