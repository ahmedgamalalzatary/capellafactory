export const API_URL = process.env.API_URL ?? "http://localhost:4000";
export const CLIENT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:4000";

export type ApiRequestOptions = {
  cookieHeader?: string;
  init?: RequestInit;
};

export function withApiCredentials(
  init: RequestInit = {},
  cookieHeader?: string,
): RequestInit {
  return {
    ...init,
    credentials: "include",
    headers: {
      ...(init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : Array.isArray(init.headers)
          ? Object.fromEntries(init.headers)
          : init.headers),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  };
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
  }
}

export async function handleApiResponse(
  response: Response,
  fallbackMessage: string,
) {
  if (response.status === 401) {
    throw new AuthRequiredError();
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      issues?: Array<{ message?: string }>;
    } | null;
    throw new Error(
      payload?.issues?.[0]?.message ?? payload?.message ?? fallbackMessage,
    );
  }
}
