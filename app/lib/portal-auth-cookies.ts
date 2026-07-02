import type { NextRequest, NextResponse } from "next/server";

// Patient-portal tokens live in their own cookies, fully separate from staff auth.
export const PORTAL_ACCESS_COOKIE_NAME = "medlink_portal_access";
export const PORTAL_REFRESH_COOKIE_NAME = "medlink_portal_refresh";
// Absolute session deadline (epoch ms). Session-scoped like the token cookies.
export const PORTAL_DEADLINE_COOKIE_NAME = "medlink_portal_deadline";

// A portal session lasts at most 15 minutes and is dropped entirely when the browser closes
// (the cookies below carry no maxAge, so they are session cookies). After the deadline the
// proxy refuses to refresh and clears the session, forcing a fresh login.
export const PORTAL_SESSION_MAX_MS = 15 * 60 * 1000;

export function freshPortalDeadline() {
  return Date.now() + PORTAL_SESSION_MAX_MS;
}

// Session cookie: no maxAge/expires, so the browser discards it when it fully closes.
function setSessionCookie(response: NextResponse, name: string, value: string) {
  response.cookies.set({
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
}

export function attachPortalAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
  options: { deadlineMs: number }
) {
  setSessionCookie(response, PORTAL_ACCESS_COOKIE_NAME, tokens.accessToken);
  setSessionCookie(response, PORTAL_REFRESH_COOKIE_NAME, tokens.refreshToken);
  setSessionCookie(response, PORTAL_DEADLINE_COOKIE_NAME, String(options.deadlineMs));
}

export function clearPortalAuthCookies(response: NextResponse) {
  for (const name of [PORTAL_ACCESS_COOKIE_NAME, PORTAL_REFRESH_COOKIE_NAME, PORTAL_DEADLINE_COOKIE_NAME]) {
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
  const deadlineRaw = request.cookies.get(PORTAL_DEADLINE_COOKIE_NAME)?.value;
  const deadlineMs = deadlineRaw ? Number(deadlineRaw) : null;
  return {
    accessToken: request.cookies.get(PORTAL_ACCESS_COOKIE_NAME)?.value ?? null,
    refreshToken: request.cookies.get(PORTAL_REFRESH_COOKIE_NAME)?.value ?? null,
    deadlineMs: deadlineMs && Number.isFinite(deadlineMs) ? deadlineMs : null
  };
}
