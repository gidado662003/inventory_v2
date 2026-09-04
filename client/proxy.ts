import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "./lib/api/http/cookies";

const PUBLIC_PATHS = ["/login", "/register"];

// Cheap, no-network-call check: decode the JWT payload and read `exp`.
// This does NOT verify the signature — it's an optimistic check only.
// Real enforcement still happens at the data layer (server.ts / client.ts
// getting a 401 back from the actual API).
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // unreadable token, treat as expired
  }
}

// TODO: implement once the refresh endpoint exists.
// Should call the refresh endpoint, forwarding the refresh token cookie,
// and return the new access token string on success.
async function refreshAccessToken(
  refreshToken: string,
): Promise<string | null> {
  try {
    // const res = await fetch(`${process.env.API_INTERNAL_URL}/auth/refresh`, {
    //   method: 'POST',
    //   headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}` },
    // })
    // if (!res.ok) return null
    // const { accessToken } = await res.json()
    // return accessToken
    return null; // placeholder until the endpoint exists
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken && !isExpired(accessToken)) {
    return NextResponse.next();
  }

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const newAccessToken = await refreshAccessToken(refreshToken);

  if (!newAccessToken) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  const response = NextResponse.next();
  response.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets, images, and Next internals.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
