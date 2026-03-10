import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canAccessRoute, getDefaultRouteForRole, type AppRouteId } from "@/app/lib/authorization";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "@/app/lib/session";

export async function getPageSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function requirePageSession(): Promise<SessionPayload> {
  const session = await getPageSession();
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requirePageRoute(routeId: AppRouteId): Promise<SessionPayload> {
  const session = await requirePageSession();
  if (!canAccessRoute(session.role, routeId)) {
    redirect(getDefaultRouteForRole(session.role));
  }

  return session;
}

export async function redirectAuthenticated() {
  const session = await getPageSession();
  if (!session) {
    return;
  }

  redirect(getDefaultRouteForRole(session.role));
}
