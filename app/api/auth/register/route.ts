import { NextResponse } from "next/server";
import { getDb } from "@/app/lib/db";
import { hashPassword } from "@/app/lib/auth";

const ALLOWED_ROLES = ["owner", "doctor", "assistant"] as const;

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password, role } = body ?? {};

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json({ error: "Email already exists." }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
    .run(name, email, passwordHash, role);

  return NextResponse.json({
    id: result.lastInsertRowid,
    name,
    email,
    role,
  });
}
