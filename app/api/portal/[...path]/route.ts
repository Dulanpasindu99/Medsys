import { NextRequest, NextResponse } from "next/server";
import {
  attachPortalAuthCookies,
  clearPortalAuthCookies,
  readPortalAuthCookies
} from "@/app/lib/portal-auth-cookies";
import { getBackendOrigin } from "@/app/lib/backend-origin";
import { generateRequestId } from "@/app/lib/request-id";

const FORWARDED_HEADER_ALLOWLIST = ["accept", "content-type", "if-match", "if-none-match", "x-request-id"] as const;

function buildForwardHeaders(request: NextRequest, accessToken: string) {
  const headers = new Headers();
  for (const key of FORWARDED_HEADER_ALLOWLIST) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  if (!headers.has("content-type") && request.method !== "GET" && request.method !== "HEAD") {
    headers.set("content-type", "application/json");
  }
  if (!headers.has("x-request-id")) headers.set("x-request-id", generateRequestId());
  headers.set("authorization", `Bearer ${accessToken}`);
  return headers;
}

function buildResponseHeaders(source: Headers) {
  const headers = new Headers();
  for (const key of ["content-type", "cache-control", "etag", "last-modified"] as const) {
    const value = source.get(key);
    if (value) headers.set(key, value);
  }
  return headers;
}

async function refreshPortalTokens(refreshToken: string) {
  const response = await fetch(`${getBackendOrigin()}/v1/portal/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Unable to refresh portal session.");
  const payload = (await response.json()) as { accessToken?: string; refreshToken?: string };
  if (!payload.accessToken || !payload.refreshToken) throw new Error("Invalid portal refresh response.");
  return { accessToken: payload.accessToken, refreshToken: payload.refreshToken };
}

async function proxyRequest(request: NextRequest, backendPath: string, accessToken: string, body?: ArrayBuffer) {
  return fetch(`${getBackendOrigin()}${backendPath}${request.nextUrl.search}`, {
    method: request.method,
    headers: buildForwardHeaders(request, accessToken),
    body: body && body.byteLength > 0 ? body : undefined,
    cache: "no-store"
  });
}

async function handle(request: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const backendPath = `/v1/portal/${path.join("/")}`;
  const { accessToken, refreshToken, deadlineMs } = readPortalAuthCookies(request);

  if (!accessToken) {
    const response = NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    clearPortalAuthCookies(response);
    return response;
  }

  // Hard 15-minute session cap: past the deadline we refuse the request and end the session,
  // so a long-idle window (or one reopened before the browser fully closed) is logged out.
  if (deadlineMs !== null && Date.now() > deadlineMs) {
    const response = NextResponse.json({ error: "Session expired." }, { status: 401 });
    clearPortalAuthCookies(response);
    return response;
  }

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  let backendResponse = await proxyRequest(request, backendPath, accessToken, body);

  if (backendResponse.status === 401 && refreshToken) {
    try {
      const refreshed = await refreshPortalTokens(refreshToken);
      backendResponse = await proxyRequest(request, backendPath, refreshed.accessToken, body);
      const response = new NextResponse(backendResponse.body, {
        status: backendResponse.status,
        headers: buildResponseHeaders(backendResponse.headers)
      });
      // Preserve the original absolute deadline — refreshing the token must not extend the
      // 15-minute session (fall back to a fresh window only if the deadline cookie was lost).
      attachPortalAuthCookies(response, refreshed, { deadlineMs: deadlineMs ?? Date.now() });
      return response;
    } catch {
      const response = NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      clearPortalAuthCookies(response);
      return response;
    }
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: buildResponseHeaders(backendResponse.headers)
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context.params);
}
export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context.params);
}
export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context.params);
}
export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context.params);
}
export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context.params);
}
