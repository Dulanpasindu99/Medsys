import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the recommended tests route." },
    { status: 502 }
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const auth = requirePermission(request, "clinical.tests.read");
  if (auth.error) {
    return auth.error;
  }

  const { code } = await context.params;
  const normalizedCode = decodeURIComponent(code ?? "").trim();
  if (!normalizedCode) {
    return NextResponse.json({ tests: [] });
  }

  const backend = await callBackendRoute(
    request,
    `/v1/clinical/diagnoses/${encodeURIComponent(normalizedCode)}/recommended-tests`,
    {
      unavailableMessage: "Unable to fetch recommended tests right now.",
      includeSearch: false,
    }
  );
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(
      backend.response,
      "Unable to fetch recommended tests right now."
    );
  }

  let payload: unknown;
  try {
    payload = await backend.response.json();
  } catch {
    return contractMismatchResponse();
  }

  const record =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  const tests = Array.isArray(record?.tests)
    ? record.tests.filter((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
        const candidate = entry as Record<string, unknown>;
        return (
          typeof candidate.code === "string" &&
          typeof candidate.codeSystem === "string" &&
          typeof candidate.display === "string"
        );
      })
    : null;

  if (!tests) {
    return contractMismatchResponse();
  }

  const response = NextResponse.json({
    diagnosis: record?.diagnosis ?? null,
    source: typeof record?.source === "string" ? record.source : null,
    tests,
  });
  backend.applyTo(response);
  return response;
}
