import { NextResponse } from "next/server";
import { listUsers } from "@/app/lib/store";

export async function GET() {
  const count = listUsers().length;
  return NextResponse.json({
    bootstrapping: count === 0,
    users: count,
  });
}
