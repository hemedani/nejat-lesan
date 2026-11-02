import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE,
  AUTH_MAX_AGE_DAYS,
  LEGACY_AUTH_COOKIE,
} from "@/utils/auth-constants";

const MAX_AGE_SECONDS = AUTH_MAX_AGE_DAYS * 24 * 60 * 60;

export function middleware(request: NextRequest) {
  const current = request.cookies.get(AUTH_COOKIE)?.value;
  const legacy = request.cookies.get(LEGACY_AUTH_COOKIE)?.value;

  if (current || !legacy) return NextResponse.next();

  const headers = new Headers(request.headers);
  const existing = headers.get("cookie");
  headers.set(
    "cookie",
    existing ? `${existing}; ${AUTH_COOKIE}=${legacy}` : `${AUTH_COOKIE}=${legacy}`,
  );

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(AUTH_COOKIE, legacy, {
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  response.cookies.delete(LEGACY_AUTH_COOKIE);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
