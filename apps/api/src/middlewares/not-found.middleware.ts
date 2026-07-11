import type { Request, Response } from "express";

export function notFoundMiddleware(_request: Request, response: Response) {
  response.status(404).json({ message: "المسار غير موجود" });
}
