import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/lib/api-auth";
import { callBackendRoute } from "@/app/lib/backend-route-client";

const ALLOWED_REPORT_TYPES = new Set([
  "clinic-overview",
  "doctor-performance",
  "assistant-performance",
  "inventory-usage",
  "patient-followup",
]);

function buildPassthroughHeaders(source: Headers) {
  const headers = new Headers();
  const allowlist = [
    "content-type",
    "cache-control",
    "etag",
    "last-modified",
  ] as const;

  for (const key of allowlist) {
    const value = source.get(key);
    if (value) {
      headers.set(key, value);
    }
  }

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return headers;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reportType: string }> }
) {
  const auth = requireSession(request);
  if (auth.error) {
    return auth.error;
  }

  const { reportType } = await context.params;
  if (!ALLOWED_REPORT_TYPES.has(reportType)) {
    return NextResponse.json({ error: "Unknown report type." }, { status: 404 });
  }

  const backend = await callBackendRoute(request, `/v1/reports/${reportType}`, {
    includeSearch: true,
  });
  if (!backend.ok) {
    return backend.response;
  }

  const response = new NextResponse(await backend.response.text(), {
    status: backend.response.status,
    headers: buildPassthroughHeaders(backend.response.headers),
  });
  backend.applyTo(response);
  return response;
}
