import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

export function validateBody(schema: ZodType) {
  return (request: Request, response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      response.status(400).json({
        message: "Validation failed",
        issues: result.error.issues,
      });
      return;
    }

    request.body = result.data;
    next();
  };
}
