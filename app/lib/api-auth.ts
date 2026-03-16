import { NextResponse, type NextRequest } from "next/server";
import { hasAnyPermission, hasPermission, type AppPermission } from "@/app/lib/authorization";
import { readSessionFromRequest, type SessionPayload } from "@/app/lib/session";

export function unauthorized(message = "Unauthorized.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function requireSession(request: NextRequest):
  | { session: SessionPayload; error: null }
  | { session: null; error: NextResponse } {
  const session = readSessionFromRequest(request);
  if (!session) {
    return { session: null, error: unauthorized() };
  }

  return { session, error: null };
}

export function requirePermission(
  request: NextRequest,
  permission: AppPermission
): { session: SessionPayload | null; error: NextResponse | null } {
  const auth = requireSession(request);
  if (auth.error) {
    return auth;
  }

  if (!hasPermission(auth.session, permission)) {
    return { session: null, error: forbidden() };
  }

  return auth;
}

export function requireAnyPermission(
  request: NextRequest,
  permissions: readonly AppPermission[]
): { session: SessionPayload | null; error: NextResponse | null } {
  const auth = requireSession(request);
  if (auth.error) {
    return auth;
  }

  if (!hasAnyPermission(auth.session, permissions)) {
    return { session: null, error: forbidden() };
  }

  return auth;
}
