import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, listUsers } from "@/app/lib/store";
import { hashPassword } from "@/app/lib/auth";
import { requirePermission } from "@/app/lib/api-auth";
import { serializeUser } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  validateUserRoleQuery,
  validateUserWritePayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, "user.read");
  if (auth.error) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const role = validateUserRoleQuery(searchParams.get("role"));
  if (!role.ok) {
    return validationErrorResponse(role.issues);
  }

  const users = listUsers(role.value).map(serializeUser);

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const auth = requirePermission(request, "user.write");
  if (auth.error) {
    return auth.error;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return validationErrorResponse(parsedBody.issues);
  }

  const validated = validateUserWritePayload(parsedBody.value);
  if (!validated.ok) {
    return validationErrorResponse(validated.issues);
  }

  const existing = findUserByEmail(validated.value.email);
  if (existing) {
    return NextResponse.json({ error: "Email already exists." }, { status: 409 });
  }

  const passwordHash = hashPassword(validated.value.password);
  const created = createUser({
    name: validated.value.name,
    email: validated.value.email,
    passwordHash,
    role: validated.value.role,
  });

  return NextResponse.json({ user: serializeUser(created) });
}
