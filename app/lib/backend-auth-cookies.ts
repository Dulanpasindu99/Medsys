import type { NextRequest, NextResponse } from "next/server";

export const BACKEND_ACCESS_COOKIE_NAME = "medsys_backend_access";
export const BACKEND_REFRESH_COOKIE_NAME = "medsys_backend_refresh";

type BackendTokenOptions = {
  accessExpiresAt?: number | null;
  refreshExpiresAt?: number | null;
};

function resolveMaxAge(expiresAt?: number | null) {
  const now = Math.floor(Date.now() / 1000);
  if (!expiresAt || expiresAt <= now) {
    return undefined;
  }
  return expiresAt - now;
}

function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  expiresAt?: number | null
) {
  response.cookies.set({
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: resolveMaxAge(expiresAt),
  });
}

export function attachBackendAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
  options?: BackendTokenOptions
) {
  setCookie(
    response,
    BACKEND_ACCESS_COOKIE_NAME,
    tokens.accessToken,
    options?.accessExpiresAt
  );
  setCookie(
    response,
    BACKEND_REFRESH_COOKIE_NAME,
    tokens.refreshToken,
    options?.refreshExpiresAt
  );
}

export function clearBackendAuthCookies(response: NextResponse) {
  response.cookies.set({
    name: BACKEND_ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: BACKEND_REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function readBackendAuthCookies(request: NextRequest) {
  return {
    accessToken: request.cookies.get(BACKEND_ACCESS_COOKIE_NAME)?.value ?? null,
    refreshToken: request.cookies.get(BACKEND_REFRESH_COOKIE_NAME)?.value ?? null,
  };
}
