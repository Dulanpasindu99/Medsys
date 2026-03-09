import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, listUsers } from "@/app/lib/store";
import { hashPassword } from "@/app/lib/auth";
import { requirePermission } from "@/app/lib/api-auth";
import { attachSessionCookie } from "@/app/lib/session";
import { serializeUser } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  validateUserWritePayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";

export async function POST(request: NextRequest) {
  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return validationErrorResponse(parsedBody.issues);
  }

  const validated = validateUserWritePayload(parsedBody.value);
  if (!validated.ok) {
    return validationErrorResponse(validated.issues);
  }

  const { name, email, password, role } = validated.value;

  const userCount = listUsers().length;
  const isBootstrapping = userCount === 0;
  if (isBootstrapping && role !== "owner") {
    return NextResponse.json(
      { error: "First account must be an owner." },
      { status: 400 }
    );
  }

  if (!isBootstrapping) {
    const auth = requirePermission(request, "user.write");
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

  const response = NextResponse.json({ user: serializeUser(created) });

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
