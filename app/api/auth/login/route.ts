import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/app/lib/store";
import { verifyPassword } from "@/app/lib/auth";
import { attachSessionCookie } from "@/app/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  attachSessionCookie(response, {
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  return response;
}
