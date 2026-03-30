import { NextRequest, NextResponse } from "next/server";
import { attachBackendAuthCookies } from "@/app/lib/backend-auth-cookies";
import { adaptCreatedUserResponse } from "@/app/lib/backend-contract-adapters";
import { serializeSessionIdentity } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  validateAuthLoginPayload,
  validateBackendTokenPairPayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";
import { attachSessionCookie } from "@/app/lib/session";
import { readTokenClaims } from "@/app/lib/token-claims";

function getBackendLoginUrl() {
  const origin = process.env.BACKEND_URL ?? "http://localhost:4000";
  return `${origin.replace(/\/+$/, "")}/v1/auth/login`;
}

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error ?? "Unable to sign in.";
  } catch {
    return "Unable to sign in.";
  }
}

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return validationErrorResponse(parsedBody.issues);
  }

  const validated = validateAuthLoginPayload(parsedBody.value);
  if (!validated.ok) {
    return validationErrorResponse(validated.issues);
  }

  const { email, password, roleHint, organizationId } = validated.value;

  let backendResponse: Response;
  try {
    backendResponse = await fetch(getBackendLoginUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        organizationId,
      }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication service is unavailable." },
      { status: 503 }
    );
  }

  if (!backendResponse.ok) {
    const message = await parseErrorMessage(backendResponse);
    return NextResponse.json({ error: message }, { status: backendResponse.status });
  }

  const rawPayload = await backendResponse.json();
  const payload = validateBackendTokenPairPayload(rawPayload);
  if (!payload.ok) {
    return NextResponse.json(
      {
        error: "Authentication service returned an invalid token payload.",
        issues: payload.issues,
      },
      { status: 502 }
    );
  }

  const tokenPair = payload.value;
  const backendUser = (() => {
    try {
      return adaptCreatedUserResponse(rawPayload);
    } catch {
      return null;
    }
  })();
  const claims = readTokenClaims(tokenPair.accessToken);
  const refreshClaims = readTokenClaims(tokenPair.refreshToken);
  const role = claims.role ?? backendUser?.role ?? roleHint ?? null;
  const name = claims.name ?? backendUser?.name ?? email.split("@")[0] ?? "User";
  const resolvedEmail = claims.email ?? backendUser?.email ?? email;
  const resolvedPermissions =
    claims.permissions.length > 0 ? claims.permissions : backendUser?.permissions ?? [];

  if (!role) {
    return NextResponse.json(
      { error: "Authenticated token did not contain a valid role." },
      { status: 502 }
    );
  }

  const response = NextResponse.json(
    serializeSessionIdentity({
      id: claims.userId ?? backendUser?.id ?? null,
      name,
      email: resolvedEmail,
      role,
      permissions: resolvedPermissions,
      doctorWorkflowMode:
        claims.doctorWorkflowMode ?? backendUser?.doctorWorkflowMode ?? null,
    })
  );

  attachBackendAuthCookies(
    response,
    {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    },
    {
      accessExpiresAt: claims.exp,
      refreshExpiresAt: refreshClaims.exp,
    }
  );

  attachSessionCookie(response, {
    userId: claims.userId ?? backendUser?.id ?? null,
    role,
    email: resolvedEmail,
    name,
    permissions: resolvedPermissions,
    doctorWorkflowMode:
      claims.doctorWorkflowMode ?? backendUser?.doctorWorkflowMode ?? null,
  }, {
    expiresAt: refreshClaims.exp ?? claims.exp ?? undefined,
  });

  return response;
}
