import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/lib/api-auth";
import { serializeSessionIdentity } from "@/app/lib/api-serializers";

export async function GET(request: NextRequest) {
  const auth = requireSession(request);
  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json(
    serializeSessionIdentity({
      id: auth.session.userId,
      role: auth.session.role,
      email: auth.session.email,
      name: auth.session.name,
    })
  );
}
