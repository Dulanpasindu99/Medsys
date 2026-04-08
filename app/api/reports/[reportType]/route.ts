import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/app/lib/api-auth";
import {
  callBackendRoute,
  toFrontendErrorResponse,
} from "@/app/lib/backend-route-client";

const ALLOWED_REPORT_TYPES = new Set([
  "clinic-overview",
  "doctor-performance",
  "assistant-performance",
  "inventory-usage",
  "patient-followup",
]);

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the reports route." },
    { status: 502 }
  );
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

  if (!backend.response.ok) {
    return toFrontendErrorResponse(
      backend.response,
      "Unable to load report data."
    );
  }

  let payload: unknown;
  try {
    payload = await backend.response.json();
  } catch {
    return contractMismatchResponse();
  }

  const response = NextResponse.json(payload);
  backend.applyTo(response);
  return response;
}
