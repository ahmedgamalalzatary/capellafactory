import type { NextFunction, Request, Response } from "express";
import { authRepository } from "./auth.repository.js";
import { createAuthService } from "./auth.service.js";
import { getAuthEnvironment } from "./auth.env.js";
import { getSessionToken } from "./auth.cookies.js";

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const token = getSessionToken(request);

  if (!token) {
    response.status(401).json({ message: "غير مصرح لك" });
    return;
  }

  const service = createAuthService(authRepository, getAuthEnvironment());
  const session = await service.getSession(token);

  if (!session) {
    response.status(401).json({ message: "غير مصرح لك" });
    return;
  }

  request.session = session;
  next();
}
