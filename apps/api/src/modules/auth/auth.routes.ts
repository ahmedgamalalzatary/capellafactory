import { Router, type Router as ExpressRouter } from "express";
import { loginHandler, logoutHandler, meHandler } from "./auth.controller.js";

export const authRouter: ExpressRouter = Router();

authRouter.post("/login", loginHandler);
authRouter.get("/me", meHandler);
authRouter.post("/logout", logoutHandler);
