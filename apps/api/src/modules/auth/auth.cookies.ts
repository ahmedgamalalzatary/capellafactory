import type { Request, Response } from "express";

export const SESSION_COOKIE_NAME = "capella_session";

export function getSessionToken(request: Request) {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (name === SESSION_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return undefined;
}

export function setSessionCookie(response: Response, token: string, expiresAt: Date) {
  response.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, token, {
      expires: expiresAt,
      maxAge: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
    }),
  );
}

export function clearSessionCookie(response: Response) {
  response.setHeader(
    "Set-Cookie",
    serializeCookie(SESSION_COOKIE_NAME, "", {
      expires: new Date(0),
      maxAge: 0,
    }),
  );
}

function serializeCookie(
  name: string,
  value: string,
  options: { expires: Date; maxAge: number },
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${options.expires.toUTCString()}`,
    `Max-Age=${options.maxAge}`,
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}
