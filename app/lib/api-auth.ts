import { NextResponse, type NextRequest } from "next/server";
import { readSessionFromRequest, type SessionPayload } from "@/app/lib/session";
import type { Role } from "@/app/lib/store";

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

export function requireRole(
  request: NextRequest,
  roles: Role[]
): { session: SessionPayload | null; error: NextResponse | null } {
  const auth = requireSession(request);
  if (auth.error) {
    return auth;
  }

  if (!roles.includes(auth.session.role)) {
    return { session: null, error: forbidden() };
  }

  return auth;
}
