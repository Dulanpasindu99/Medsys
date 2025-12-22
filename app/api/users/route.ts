import { NextResponse } from "next/server";
import { createUser, findUserByEmail, listUsers } from "@/app/lib/store";
import { hashPassword } from "@/app/lib/auth";

const ALLOWED_ROLES = ["owner", "doctor", "assistant"] as const;

type Role = (typeof ALLOWED_ROLES)[number];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  if (role && !ALLOWED_ROLES.includes(role as Role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const users = listUsers(role as Role | undefined).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.createdAt,
  }));

  return NextResponse.json({ users });
}

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
