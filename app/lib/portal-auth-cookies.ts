import type { NextRequest, NextResponse } from "next/server";

// Patient-portal tokens live in their own cookies, fully separate from staff auth.
export const PORTAL_ACCESS_COOKIE_NAME = "medlink_portal_access";
export const PORTAL_REFRESH_COOKIE_NAME = "medlink_portal_refresh";

function resolveMaxAge(expiresAt?: number | null) {
  const now = Math.floor(Date.now() / 1000);
  if (!expiresAt || expiresAt <= now) {
    return undefined;
  }
  return expiresAt - now;
}

function setCookie(response: NextResponse, name: string, value: string, expiresAt?: number | null) {
  response.cookies.set({
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: resolveMaxAge(expiresAt)
  });
}

export function attachPortalAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
  options?: { accessExpiresAt?: number | null; refreshExpiresAt?: number | null }
) {
  setCookie(response, PORTAL_ACCESS_COOKIE_NAME, tokens.accessToken, options?.accessExpiresAt);
  setCookie(response, PORTAL_REFRESH_COOKIE_NAME, tokens.refreshToken, options?.refreshExpiresAt);
}

export function clearPortalAuthCookies(response: NextResponse) {
  for (const name of [PORTAL_ACCESS_COOKIE_NAME, PORTAL_REFRESH_COOKIE_NAME]) {
    response.cookies.set({
      name,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });
  }
}

export function readPortalAuthCookies(request: NextRequest) {
  return {
    accessToken: request.cookies.get(PORTAL_ACCESS_COOKIE_NAME)?.value ?? null,
    refreshToken: request.cookies.get(PORTAL_REFRESH_COOKIE_NAME)?.value ?? null
  };
}
