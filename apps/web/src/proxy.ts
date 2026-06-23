import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "capella_session";
const AUTH_ME_URL = `${process.env.API_URL ?? "http://localhost:4000"}/auth/me`;

export async function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const cookieHeader = request.headers.get("cookie");

  if (cookieHeader) {
    try {
      const response = await fetch(AUTH_ME_URL, {
        credentials: "include",
        headers: {
          Cookie: cookieHeader,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch {
      // Allow the request through when the auth API is temporarily unreachable.
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
