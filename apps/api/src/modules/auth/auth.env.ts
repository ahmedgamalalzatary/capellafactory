import type { AuthEnvironment } from "./auth.service.js";

export function getAuthEnvironment(): AuthEnvironment {
  const username = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!username || !password || !secret) {
    throw new Error("AUTH_USERNAME, AUTH_PASSWORD, and AUTH_SECRET must be set");
  }

  return { username, password, secret };
}
