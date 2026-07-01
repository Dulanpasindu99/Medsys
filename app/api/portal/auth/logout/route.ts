import { NextRequest, NextResponse } from "next/server";
import { clearPortalAuthCookies, readPortalAuthCookies } from "@/app/lib/portal-auth-cookies";
import { getBackendOrigin } from "@/app/lib/backend-origin";

export async function POST(request: NextRequest) {
  const { accessToken } = readPortalAuthCookies(request);
  if (accessToken) {
    await fetch(`${getBackendOrigin()}/v1/portal/auth/logout`, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store"
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ ok: true });
  clearPortalAuthCookies(response);
  return response;
}
