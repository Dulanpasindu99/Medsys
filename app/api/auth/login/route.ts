import { NextRequest, NextResponse } from "next/server";
import { attachBackendAuthCookies } from "@/app/lib/backend-auth-cookies";
import { attachSessionCookie } from "@/app/lib/session";
import { readTokenClaims } from "@/app/lib/token-claims";

type BackendLoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

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
  const body = await request.json();
  const { email, password, roleHint, organizationId } = body ?? {};

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

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

  const payload = (await backendResponse.json()) as BackendLoginResponse;
  const claims = readTokenClaims(payload.accessToken);
  const refreshClaims = readTokenClaims(payload.refreshToken);
  const role = claims.role ?? roleHint ?? null;
  const name = claims.name ?? email.split("@")[0] ?? "User";
  const resolvedEmail = claims.email ?? email;

  if (!role) {
    return NextResponse.json(
      { error: "Authenticated token did not contain a valid role." },
      { status: 502 }
    );
  }

  const response = NextResponse.json({
    id: claims.userId,
    name,
    email: resolvedEmail,
    role,
  });

  attachBackendAuthCookies(
    response,
    {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    },
    {
      accessExpiresAt: claims.exp,
      refreshExpiresAt: refreshClaims.exp,
    }
  );

  attachSessionCookie(response, {
    userId: claims.userId,
    role,
    email: resolvedEmail,
    name,
  }, {
    expiresAt: refreshClaims.exp ?? claims.exp ?? undefined,
  });

  return response;
}
