import { NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { verifyPassword } from "@/app/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body ?? {};

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const db = getDb();
  const user = db
    .prepare("SELECT id, name, email, password_hash, role FROM users WHERE email = ?")
    .get(email) as { id: number; name: string; email: string; password_hash: string; role: string } | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
