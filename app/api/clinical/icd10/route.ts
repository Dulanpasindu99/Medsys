import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/lib/api-auth";

const MAX_LIST = 10;
const BASE_URL = "https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ["owner", "doctor", "assistant"]);
  if (auth.error) {
    return auth.error;
  }

  const terms = request.nextUrl.searchParams.get("terms")?.trim() ?? "";
  if (terms.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const upstream = await fetch(
      `${BASE_URL}?sf=code,name&maxList=${MAX_LIST}&terms=${encodeURIComponent(terms)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      }
    );

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Failed to fetch ICD-10 suggestions." },
        { status: upstream.status }
      );
    }

    const payload = (await upstream.json()) as unknown;
    const entries =
      Array.isArray(payload) && Array.isArray(payload[3]) ? (payload[3] as [string, string][]) : [];
    const suggestions = entries.map(([code, name]) => `${code} - ${name}`);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("ICD-10 proxy error", error);
    return NextResponse.json(
      { error: "Unable to fetch ICD-10 suggestions right now." },
      { status: 502 }
    );
  }
}
