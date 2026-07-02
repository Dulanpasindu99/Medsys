import { NextRequest, NextResponse } from "next/server";
import { attachPortalAuthCookies, freshPortalDeadline } from "@/app/lib/portal-auth-cookies";
import { getBackendOrigin } from "@/app/lib/backend-origin";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const backend = await fetch(`${getBackendOrigin()}/v1/portal/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const payload = (await backend.json().catch(() => null)) as
    | { accessToken?: string; refreshToken?: string; account?: unknown; message?: string }
    | null;

  if (!backend.ok || !payload?.accessToken || !payload?.refreshToken) {
    return NextResponse.json(
      { error: payload?.message ?? "Unable to sign in." },
      { status: backend.status === 200 ? 502 : backend.status }
    );
  }

  const response = NextResponse.json({ account: payload.account });
  attachPortalAuthCookies(
    response,
    { accessToken: payload.accessToken, refreshToken: payload.refreshToken },
    { deadlineMs: freshPortalDeadline() }
  );
  return response;
}
