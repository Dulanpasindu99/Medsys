import { NextResponse } from "next/server";
import { clearBackendAuthCookies } from "@/app/lib/backend-auth-cookies";
import { clearSessionCookie } from "@/app/lib/session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearBackendAuthCookies(response);
  clearSessionCookie(response);
  return response;
}
