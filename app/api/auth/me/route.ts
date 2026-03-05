import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = requireSession(request);
  if (auth.error) {
    return auth.error;
  }

  return NextResponse.json({
    id: auth.session.userId,
    role: auth.session.role,
    email: auth.session.email,
    name: auth.session.name,
  });
}
