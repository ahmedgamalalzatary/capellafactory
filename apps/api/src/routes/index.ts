import type { Express } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { requireAuth } from "../modules/auth/auth.middleware.js";
import { buyersRouter } from "../modules/buyers/buyers.routes.js";
import { expensesRouter } from "../modules/expenses/expenses.routes.js";
import { ingredientPurchasesRouter } from "../modules/ingredient-purchases/ingredient-purchases.routes.js";
import { ingredientsRouter } from "../modules/ingredients/ingredients.routes.js";
import { productionBatchesRouter } from "../modules/production-batches/production-batches.routes.js";
import { productsRouter } from "../modules/products/products.routes.js";
import { suppliersRouter } from "../modules/suppliers/suppliers.routes.js";

export function registerRoutes(app: Express) {
  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use(requireAuth);

  app.use("/buyers", buyersRouter);
  app.use("/expenses", expensesRouter);
  app.use("/ingredient-purchases", ingredientPurchasesRouter);
  app.use("/ingredients", ingredientsRouter);
  app.use("/production-batches", productionBatchesRouter);
  app.use("/products", productsRouter);
  app.use("/suppliers", suppliersRouter);
}
