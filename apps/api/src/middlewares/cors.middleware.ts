import type { NextFunction, Request, Response } from "express";

const DEFAULT_ALLOWED_HEADERS = "Content-Type";
const DEFAULT_ALLOWED_METHODS = "GET,HEAD,POST,PATCH,DELETE,OPTIONS";

export function corsMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const allowedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  const requestOrigin = request.headers.origin;

  if (requestOrigin === allowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Methods", DEFAULT_ALLOWED_METHODS);
  response.setHeader(
    "Access-Control-Allow-Headers",
    request.headers["access-control-request-headers"] ?? DEFAULT_ALLOWED_HEADERS,
  );

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  next();
}
