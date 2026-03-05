import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, listUsers } from "@/app/lib/store";
import { hashPassword } from "@/app/lib/auth";
import { requireRole } from "@/app/lib/api-auth";
import { attachSessionCookie } from "@/app/lib/session";

const ALLOWED_ROLES = ["owner", "doctor", "assistant"] as const;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password, role } = body ?? {};

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const userCount = listUsers().length;
  const isBootstrapping = userCount === 0;
  if (isBootstrapping && role !== "owner") {
    return NextResponse.json(
      { error: "First account must be an owner." },
      { status: 400 }
    );
  }

  if (!isBootstrapping) {
    const auth = requireRole(request, ["owner"]);
    if (auth.error) {
      return auth.error;
    }
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "Email already exists." }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const created = createUser({ name, email, passwordHash, role });

  const response = NextResponse.json({
    id: created.id,
    name,
    email,
    role,
  });

  if (isBootstrapping) {
    attachSessionCookie(response, {
      userId: created.id,
      role: created.role,
      email: created.email,
      name: created.name,
    });
  }

  return response;
}
