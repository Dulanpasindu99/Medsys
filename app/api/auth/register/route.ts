import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/app/lib/store";
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

  const existing = findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "Email already exists." }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const created = createUser({ name, email, passwordHash, role });

  return NextResponse.json({
    id: created.id,
    name,
    email,
    role,
  });
}
