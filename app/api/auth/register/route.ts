import { NextRequest, NextResponse } from "next/server";
import { attachBackendAuthCookies } from "@/app/lib/backend-auth-cookies";
import { requirePermission } from "@/app/lib/api-auth";
import { adaptAuthStatusResponse, adaptCreatedUserResponse } from "@/app/lib/backend-contract-adapters";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import { serializeUser } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  validateAuthLoginPayload,
  validateBackendTokenPairPayload,
  validateUserWritePayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";
import { attachSessionCookie } from "@/app/lib/session";
import { readTokenClaims } from "@/app/lib/token-claims";
import { getBackendOrigin } from "@/app/lib/backend-origin";

function getBackendLoginUrl() {
  return `${getBackendOrigin()}/v1/auth/login`;
}

function getBackendLoginWithSlugUrl() {
  return `${getBackendOrigin()}/v1/auth/login-with-slug`;
}

type BootstrapOrganizationContext = {
  organizationId?: string;
  organizationSlug?: string;
};

function readServerEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function resolveBootstrapOrganizationContext(): BootstrapOrganizationContext {
  const organizationSlug =
    readServerEnv("MEDSYS_BOOTSTRAP_ORGANIZATION_SLUG") ??
    readServerEnv("MEDSYS_DEFAULT_ORGANIZATION_SLUG") ??
    readServerEnv("AUTH_ORGANIZATION_SLUG") ??
    readServerEnv("NEXT_PUBLIC_ORGANIZATION_SLUG");
  if (organizationSlug) {
    return { organizationSlug };
  }

  const organizationId =
    readServerEnv("MEDSYS_BOOTSTRAP_ORGANIZATION_ID") ??
    readServerEnv("AUTH_ORGANIZATION_ID");
  return organizationId ? { organizationId } : {};
}

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the auth register route." },
    { status: 502 }
  );
}

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error ?? "Unable to sign in.";
  } catch {
    return "Unable to sign in.";
  }
}

async function loginAfterBootstrap(
  email: string,
  password: string,
  organizationContext: BootstrapOrganizationContext
) {
  const loginPayload = validateAuthLoginPayload({
    email,
    password,
    ...organizationContext,
  });
  if (!loginPayload.ok) {
    return { ok: false as const, response: validationErrorResponse(loginPayload.issues) };
  }

  let backendResponse: Response;
  try {
    const loginUrl = loginPayload.value.organizationSlug
      ? getBackendLoginWithSlugUrl()
      : getBackendLoginUrl();
    backendResponse = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginPayload.value),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Authentication service is unavailable." },
        { status: 503 }
      ),
    };
  }

  if (!backendResponse.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: await parseErrorMessage(backendResponse) },
        { status: backendResponse.status }
      ),
    };
  }

  const rawPayload = await backendResponse.json();
  const tokenPair = validateBackendTokenPairPayload(rawPayload);
  if (!tokenPair.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: "Authentication service returned an invalid token payload.",
          issues: tokenPair.issues,
        },
        { status: 502 }
      ),
    };
  }

  const authenticatedUser = (() => {
    try {
      return adaptCreatedUserResponse(rawPayload);
    } catch {
      return null;
    }
  })();

  return { ok: true as const, value: { ...tokenPair.value, authenticatedUser } };
}

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return validationErrorResponse(parsedBody.issues);
  }

  const validated = validateUserWritePayload(parsedBody.value);
  if (!validated.ok) {
    return validationErrorResponse(validated.issues);
  }

  const authStatusBackend = await callBackendRoute(request, "/v1/auth/status", {
    allowUnauthenticated: true,
    includeSearch: false,
    unavailableMessage: "Authentication service is unavailable.",
  });
  if (!authStatusBackend.ok) {
    return authStatusBackend.response;
  }

  if (!authStatusBackend.response.ok) {
    return NextResponse.json(
      { error: "Unable to determine bootstrap status." },
      { status: authStatusBackend.response.status }
    );
  }

  let authStatus: { bootstrapping: boolean; users: number };
  try {
    authStatus = adaptAuthStatusResponse(await authStatusBackend.response.json());
  } catch {
    return contractMismatchResponse();
  }

  if (authStatus.bootstrapping && validated.value.role !== "owner") {
    return NextResponse.json(
      { error: "First account must be an owner." },
      { status: 400 }
    );
  }

  if (!authStatus.bootstrapping) {
    const auth = requirePermission(request, "user.write");
    if (auth.error) {
      return auth.error;
    }
  }

  const backend = await callBackendRoute(request, "/v1/auth/register", {
    allowUnauthenticated: authStatus.bootstrapping,
    body: JSON.stringify(validated.value),
    includeSearch: false,
    unavailableMessage: "Authentication service is unavailable.",
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to register user.");
  }

  try {
    const created = adaptCreatedUserResponse(await backend.response.json());
    const response = NextResponse.json({ user: serializeUser(created) });

    if (authStatus.bootstrapping) {
      const loginResult = await loginAfterBootstrap(
        validated.value.email,
        validated.value.password,
        resolveBootstrapOrganizationContext()
      );
      if (!loginResult.ok) {
        return loginResult.response;
      }

      const accessClaims = readTokenClaims(loginResult.value.accessToken);
      const refreshClaims = readTokenClaims(loginResult.value.refreshToken);
      const role = accessClaims.role ?? loginResult.value.authenticatedUser?.role ?? created.role;
      const email = accessClaims.email ?? loginResult.value.authenticatedUser?.email ?? created.email;
      const name = accessClaims.name ?? loginResult.value.authenticatedUser?.name ?? created.name;
      const permissions =
        accessClaims.permissions.length > 0
          ? accessClaims.permissions
          : loginResult.value.authenticatedUser?.permissions ?? [];

      attachBackendAuthCookies(
        response,
        {
          accessToken: loginResult.value.accessToken,
          refreshToken: loginResult.value.refreshToken,
        },
        {
          accessExpiresAt: accessClaims.exp,
          refreshExpiresAt: refreshClaims.exp,
        }
      );
      attachSessionCookie(
        response,
        {
          userId: accessClaims.userId ?? created.id,
          role,
          email,
          name,
          permissions,
        },
        {
          expiresAt: refreshClaims.exp ?? accessClaims.exp ?? undefined,
        }
      );
    } else {
      backend.applyTo(response);
    }

    return response;
  } catch {
    return contractMismatchResponse();
  }
}
