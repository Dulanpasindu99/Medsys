import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import { validateDiseaseSuggestionQuery, validationErrorResponse } from "@/app/lib/api-validation";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the tests route." },
    { status: 502 }
  );
}

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, "clinical.tests.read");
  if (auth.error) {
    return auth.error;
  }

  const terms = request.nextUrl.searchParams.get("terms")?.trim() ?? "";
  if (terms.length < 2) {
    return NextResponse.json({ tests: [] });
  }

  const validatedQuery = validateDiseaseSuggestionQuery(terms);
  if (!validatedQuery.ok) {
    return validationErrorResponse(validatedQuery.issues);
  }

  const backend = await callBackendRoute(request, "/v1/clinical/tests", {
    unavailableMessage: "Unable to fetch medical test suggestions right now.",
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(
      backend.response,
      "Unable to fetch medical test suggestions right now."
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

  const response = NextResponse.json({ tests });
  backend.applyTo(response);
  return response;
}
