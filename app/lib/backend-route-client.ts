import { NextRequest, NextResponse } from "next/server";
import {
  attachBackendAuthCookies,
  clearBackendAuthCookies,
  readBackendAuthCookies,
} from "@/app/lib/backend-auth-cookies";
import { adaptCreatedUserResponse } from "@/app/lib/backend-contract-adapters";
import { validateBackendTokenPairPayload, type ValidationIssue } from "@/app/lib/api-validation";
import {
  attachSessionCookie,
  clearSessionCookie,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/app/lib/session";
import { readTokenClaims } from "@/app/lib/token-claims";

const FORWARDED_HEADER_ALLOWLIST = [
  "accept",
  "content-type",
  "if-match",
  "if-none-match",
  "x-request-id",
] as const;

type BackendRouteOptions = {
  method?: string;
  body?: BodyInit | null;
  includeSearch?: boolean;
  allowUnauthenticated?: boolean;
  unavailableMessage?: string;
};

type BackendResponseSideEffects = {
  refreshedTokens?: {
    accessToken: string;
    refreshToken: string;
    permissions?: string[];
    userId?: number | null;
    email?: string | null;
    name?: string | null;
    role?: string | null;
  };
};

type BackendRouteSuccess = {
  ok: true;
  response: Response;
  applyTo: (response: NextResponse) => void;
};

type BackendRouteFailure = {
  ok: false;
  response: NextResponse;
};

export type BackendRouteResult = BackendRouteSuccess | BackendRouteFailure;

function getBackendOrigin() {
  return (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");
}

function buildBackendUrl(pathname: string, search = "") {
  return `${getBackendOrigin()}${pathname}${search}`;
}

function buildForwardHeaders(request: NextRequest, accessToken?: string | null) {
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

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function parseErrorPayload(response: Response) {
  const payload = await parseJsonResponse(response);
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const issues = Array.isArray(record.issues)
      ? record.issues.filter((issue): issue is ValidationIssue => {
          if (!issue || typeof issue !== "object") {
            return false;
          }
          const candidate = issue as Record<string, unknown>;
          return (
            typeof candidate.field === "string" &&
            typeof candidate.message === "string"
          );
        })
      : undefined;

    return {
      error:
        typeof record.error === "string"
          ? record.error
          : typeof record.message === "string"
          ? record.message
          : null,
      issues,
    };
  }

  return { error: null, issues: undefined };
}

async function parseRefreshError(response: Response) {
  const payload = await parseErrorPayload(response);
  return payload.error ?? "Unable to refresh backend session.";
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

  const rawPayload = await response.json();
  const payload = validateBackendTokenPairPayload(rawPayload);
  if (!payload.ok) {
    throw new Error("Backend refresh response was invalid.");
  }

  const authenticatedUser = (() => {
    try {
      return adaptCreatedUserResponse(rawPayload);
    } catch {
      return null;
    }
  })();

  return {
    ...payload.value,
    authenticatedUser,
  };
}

async function executeBackendRequest(
  request: NextRequest,
  pathname: string,
  accessToken?: string | null,
  body?: BodyInit | null,
  includeSearch = true
) {
  return fetch(buildBackendUrl(pathname, includeSearch ? request.nextUrl.search : ""), {
    method: request.method,
    headers: buildForwardHeaders(request, accessToken),
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : body ?? undefined,
    cache: "no-store",
  });
}

function unauthorizedResponse() {
  const response = NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  clearBackendAuthCookies(response);
  clearSessionCookie(response);
  return response;
}

function applySessionCookieFromRefreshedTokens(
  request: NextRequest,
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  refreshedIdentity?: {
    permissions?: string[];
    userId?: number | null;
    email?: string | null;
    name?: string | null;
    role?: string | null;
  }
) {
  const accessClaims = readTokenClaims(accessToken);
  const refreshClaims = readTokenClaims(refreshToken);
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const existingSession = sessionToken ? verifySessionToken(sessionToken) : null;

  if (!existingSession || (!accessClaims.role && !refreshedIdentity?.role)) {
    return;
  }

  attachSessionCookie(
    response,
    {
      userId: accessClaims.userId ?? refreshedIdentity?.userId ?? existingSession.userId,
      role: (accessClaims.role ?? refreshedIdentity?.role ?? existingSession.role) as typeof existingSession.role,
      email: accessClaims.email ?? refreshedIdentity?.email ?? existingSession.email,
      name: accessClaims.name ?? refreshedIdentity?.name ?? existingSession.name,
      permissions:
        accessClaims.permissions.length > 0
          ? accessClaims.permissions
          : refreshedIdentity?.permissions?.length
            ? refreshedIdentity.permissions
            : existingSession.permissions,
    },
    {
      expiresAt: refreshClaims.exp ?? accessClaims.exp ?? undefined,
    }
  );
}

function applyBackendSideEffects(
  request: NextRequest,
  response: NextResponse,
  sideEffects: BackendResponseSideEffects
) {
  if (!sideEffects.refreshedTokens) {
    return;
  }

  const accessClaims = readTokenClaims(sideEffects.refreshedTokens.accessToken);
  const refreshClaims = readTokenClaims(sideEffects.refreshedTokens.refreshToken);

  attachBackendAuthCookies(
    response,
    {
      accessToken: sideEffects.refreshedTokens.accessToken,
      refreshToken: sideEffects.refreshedTokens.refreshToken,
    },
    {
      accessExpiresAt: accessClaims.exp,
      refreshExpiresAt: refreshClaims.exp,
    }
  );
  applySessionCookieFromRefreshedTokens(
    request,
    response,
    sideEffects.refreshedTokens.accessToken,
    sideEffects.refreshedTokens.refreshToken,
    sideEffects.refreshedTokens
  );
}

export async function callBackendRoute(
  request: NextRequest,
  pathname: string,
  options?: BackendRouteOptions
): Promise<BackendRouteResult> {
  const { accessToken, refreshToken } = readBackendAuthCookies(request);
  if (!options?.allowUnauthenticated && !accessToken) {
    return { ok: false, response: unauthorizedResponse() };
  }

  let backendResponse: Response;
  try {
    backendResponse = await executeBackendRequest(
      request,
      pathname,
      accessToken,
      options?.body ?? null,
      options?.includeSearch ?? true
    );
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: options?.unavailableMessage ?? "Backend service is unavailable." },
        { status: 503 }
      ),
    };
  }

  const sideEffects: BackendResponseSideEffects = {};

  if (backendResponse.status === 401 && refreshToken && !options?.allowUnauthenticated) {
    try {
      const refreshed = await refreshBackendTokens(refreshToken);
      backendResponse = await executeBackendRequest(
        request,
        pathname,
        refreshed.accessToken,
        options?.body ?? null,
        options?.includeSearch ?? true
      );
      sideEffects.refreshedTokens = {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        permissions: refreshed.authenticatedUser?.permissions,
        userId: refreshed.authenticatedUser?.id ?? null,
        email: refreshed.authenticatedUser?.email ?? null,
        name: refreshed.authenticatedUser?.name ?? null,
        role: refreshed.authenticatedUser?.role ?? null,
      };
    } catch {
      return { ok: false, response: unauthorizedResponse() };
    }
  }

  return {
    ok: true,
    response: backendResponse,
    applyTo(response) {
      applyBackendSideEffects(request, response, sideEffects);
    },
  };
}

export async function toFrontendErrorResponse(
  backendResponse: Response,
  fallbackMessage: string
) {
  const { error, issues } = await parseErrorPayload(backendResponse);

  if (backendResponse.status === 400 && issues && issues.length > 0) {
    return NextResponse.json(
      {
        error: error ?? "Validation failed.",
        issues,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: error ?? fallbackMessage,
    },
    { status: backendResponse.status }
  );
}
