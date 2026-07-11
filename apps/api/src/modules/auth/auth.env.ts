import type { AuthEnvironment } from "./auth.service.js";

export function getAuthEnvironment(): AuthEnvironment {
  const username = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!username || !password || !secret) {
    throw new Error("يجب ضبط إعدادات تسجيل الدخول");
  }

  return { username, password, secret };
}
