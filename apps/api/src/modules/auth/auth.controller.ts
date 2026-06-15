import type { Request, Response } from "express";
import { authRepository } from "./auth.repository.js";
import { createAuthService } from "./auth.service.js";
import { getAuthEnvironment } from "./auth.env.js";
import { clearSessionCookie, getSessionToken, setSessionCookie } from "./auth.cookies.js";

const INVALID_LOGIN_MESSAGE = "بيانات الدخول غير صحيحة";

export async function loginHandler(request: Request, response: Response) {
  const username = typeof request.body?.username === "string" ? request.body.username : "";
  const password = typeof request.body?.password === "string" ? request.body.password : "";
  const service = createAuthService(authRepository, getAuthEnvironment());
  const result = await service.login({ username, password });

  if (!result.ok) {
    response.status(401).json({ message: INVALID_LOGIN_MESSAGE });
    return;
  }

  setSessionCookie(response, result.token, result.expiresAt);
  response.json({ ok: true, user: result.user });
}

export async function meHandler(request: Request, response: Response) {
  const service = createAuthService(authRepository, getAuthEnvironment());
  const session = await service.getSession(getSessionToken(request));

  if (!session) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  response.json(session);
}

export async function logoutHandler(request: Request, response: Response) {
  const service = createAuthService(authRepository, getAuthEnvironment());
  await service.logout(getSessionToken(request));
  clearSessionCookie(response);
  response.status(204).send();
}
