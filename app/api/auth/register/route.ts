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

function getBackendLoginUrl() {
  const origin = process.env.BACKEND_URL ?? "http://localhost:4000";
  return `${origin.replace(/\/+$/, "")}/v1/auth/login`;
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

async function loginAfterBootstrap(email: string, password: string, organizationId?: string) {
  const loginPayload = validateAuthLoginPayload({
    email,
    password,
    organizationId,
  });
  if (!loginPayload.ok) {
    return { ok: false as const, response: validationErrorResponse(loginPayload.issues) };
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(getBackendLoginUrl(), {
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

  const tokenPair = validateBackendTokenPairPayload(await backendResponse.json());
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

  return { ok: true as const, value: tokenPair.value };
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
        process.env.NEXT_PUBLIC_ORGANIZATION_ID
      );
      if (!loginResult.ok) {
        return loginResult.response;
      }

      const accessClaims = readTokenClaims(loginResult.value.accessToken);
      const refreshClaims = readTokenClaims(loginResult.value.refreshToken);
      const role = accessClaims.role ?? created.role;
      const email = accessClaims.email ?? created.email;
      const name = accessClaims.name ?? created.name;

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
