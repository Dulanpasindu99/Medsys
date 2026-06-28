import { NextRequest, NextResponse } from "next/server";
import { getBackendOrigin } from "@/app/lib/backend-origin";

const ADMIN_COOKIE = "medsys_admin_token";
const ADMIN_TTL_SECONDS = 60 * 30;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { username, password } = (body ?? {}) as { username?: string; password?: string };
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${getBackendOrigin()}/v1/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Super admin service is unavailable." }, { status: 503 });
  }

  const payload = (await backendRes.json().catch(() => null)) as
    | { accessToken?: string; admin?: unknown; message?: string; error?: string }
    | null;

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: payload?.message ?? payload?.error ?? "Invalid username or password." },
      { status: backendRes.status },
    );
  }

  if (!payload?.accessToken) {
    return NextResponse.json({ error: "Super admin login returned no token." }, { status: 502 });
  }

  const response = NextResponse.json({ admin: payload.admin ?? null });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: payload.accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_TTL_SECONDS,
  });
  return response;
}
