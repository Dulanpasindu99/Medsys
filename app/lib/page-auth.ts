import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/app/lib/store";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "@/app/lib/session";

export async function requirePageSession(roles?: Role[]): Promise<SessionPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    redirect("/login");
  }

  const session = verifySessionToken(token);
  if (!session) {
    redirect("/login");
  }

  if (roles && !roles.includes(session.role)) {
    redirect("/");
  }

  return session;
}
