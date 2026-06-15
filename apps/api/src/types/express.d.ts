import type { createAuthService } from "../modules/auth/auth.service.js";

type AuthSession = NonNullable<
  Awaited<ReturnType<ReturnType<typeof createAuthService>["getSession"]>>
>;

declare global {
  namespace Express {
    interface Request {
      session?: AuthSession;
    }
  }
}

export {};
