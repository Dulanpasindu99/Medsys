import { NextRequest, NextResponse } from "next/server";
import {
  attachBackendAuthCookies,
  clearBackendAuthCookies,
  readBackendAuthCookies,
} from "@/app/lib/backend-auth-cookies";
import {
  attachSessionCookie,
  clearSessionCookie,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/app/lib/session";
import { validateBackendTokenPairPayload } from "@/app/lib/api-validation";
import { readTokenClaims } from "@/app/lib/token-claims";

const FORWARDED_HEADER_ALLOWLIST = [
  "accept",
  "content-type",
  "if-match",
  "if-none-match",
  "x-request-id",
] as const;

function getBackendOrigin() {
  return (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");
}

function buildBackendUrl(pathname: string, search: string) {
  return `${getBackendOrigin()}${pathname}${search}`;
}

function buildForwardHeaders(request: NextRequest, accessToken: string) {
  const headers = new Headers();

  for (const key of FORWARDED_HEADER_ALLOWLIST) {
    const value = request.headers.get(key);
    if (value) {
      headers.set(key, value);
    }
  }

  if (!headers.has("content-type") && request.method !== "GET" && request.method !== "HEAD") {
    headers.set("content-type", "application/json");
  }
  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", crypto.randomUUID());
  }

  headers.set("authorization", `Bearer ${accessToken}`);
  return headers;
}

function buildResponseHeaders(source: Headers) {
  const headers = new Headers();
  const allowlist = ["content-type", "cache-control", "etag", "last-modified"] as const;

  for (const key of allowlist) {
    const value = source.get(key);
    if (value) {
      headers.set(key, value);
    }
  }

  return headers;
}

async function parseRefreshError(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error ?? "Unable to refresh backend session.";
  } catch {
    return "Unable to refresh backend session.";
  }
}

async function refreshBackendTokens(refreshToken: string) {
  const response = await fetch(`${getBackendOrigin()}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseRefreshError(response));
  }

  const payload = validateBackendTokenPairPayload(await response.json());
  if (!payload.ok) {
    throw new Error("Backend refresh response was invalid.");
  }

  return payload.value;
}

async function proxyRequest(
  request: NextRequest,
  backendPath: string,
  accessToken: string,
  body?: ArrayBuffer
) {
  return fetch(buildBackendUrl(backendPath, request.nextUrl.search), {
    method: request.method,
    headers: buildForwardHeaders(request, accessToken),
    body: body && body.byteLength > 0 ? body : undefined,
    cache: "no-store",
  });
}

function updateSessionCookie(
  request: NextRequest,
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  const claims = readTokenClaims(accessToken);
  const refreshClaims = readTokenClaims(refreshToken);
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const existingSession = sessionToken ? verifySessionToken(sessionToken) : null;

  if (!existingSession || !claims.role) {
    return;
  }

  attachSessionCookie(
    response,
    {
      userId: claims.userId,
      role: claims.role,
      roles: existingSession.roles ?? (claims.role ? [claims.role] : undefined),
      activeRole: existingSession.activeRole ?? claims.role ?? undefined,
      email: claims.email ?? existingSession.email,
      name: claims.name ?? existingSession.name,
      permissions: existingSession.permissions,
      extraPermissions: existingSession.extraPermissions,
      doctorWorkflowMode:
        claims.doctorWorkflowMode ?? existingSession.doctorWorkflowMode ?? null,
      workflowProfiles: existingSession.workflowProfiles ?? null,
    },
    { expiresAt: refreshClaims.exp ?? claims.exp ?? undefined }
  );
}

async function handle(request: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const backendPath = `/${path.join("/")}`;
  const { accessToken, refreshToken } = readBackendAuthCookies(request);

  if (!accessToken) {
    const response = NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    clearBackendAuthCookies(response);
    clearSessionCookie(response);
    return response;
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  let backendResponse = await proxyRequest(request, backendPath, accessToken, body);

  if (backendResponse.status === 401 && refreshToken) {
    try {
      const refreshed = await refreshBackendTokens(refreshToken);
      backendResponse = await proxyRequest(request, backendPath, refreshed.accessToken, body);

      const refreshedClaims = readTokenClaims(refreshed.accessToken);
      const refreshedRefreshClaims = readTokenClaims(refreshed.refreshToken);
      const response = new NextResponse(backendResponse.body, {
        status: backendResponse.status,
        headers: buildResponseHeaders(backendResponse.headers),
      });

      attachBackendAuthCookies(
        response,
        {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        },
        {
          accessExpiresAt: refreshedClaims.exp,
          refreshExpiresAt: refreshedRefreshClaims.exp,
        }
      );
      updateSessionCookie(request, response, refreshed.accessToken, refreshed.refreshToken);
      return response;
    } catch {
      const response = NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      clearBackendAuthCookies(response);
      clearSessionCookie(response);
      return response;
    }
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: buildResponseHeaders(backendResponse.headers),
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handle(request, context.params);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handle(request, context.params);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handle(request, context.params);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handle(request, context.params);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return handle(request, context.params);
}
