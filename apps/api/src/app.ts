import express, { type Express } from "express";
import { registerRoutes } from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";

export function createApp(): Express {
  const app = express();

  app.use(express.json());
  registerRoutes(app);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
