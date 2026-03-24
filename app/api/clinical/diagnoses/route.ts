import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import { validateDiseaseSuggestionQuery, validationErrorResponse } from "@/app/lib/api-validation";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the diagnoses route." },
    { status: 502 }
  );
}

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, "clinical.icd10.read");
  if (auth.error) {
    return auth.error;
  }

  const terms = request.nextUrl.searchParams.get("terms")?.trim() ?? "";
  if (terms.length < 2) {
    return NextResponse.json({ diagnoses: [] });
  }

  const validatedQuery = validateDiseaseSuggestionQuery(terms);
  if (!validatedQuery.ok) {
    return validationErrorResponse(validatedQuery.issues);
  }

  const backend = await callBackendRoute(request, "/v1/clinical/diagnoses", {
    unavailableMessage: "Unable to fetch diagnosis suggestions right now.",
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(
      backend.response,
      "Unable to fetch diagnosis suggestions right now."
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
  const diagnoses = Array.isArray(record?.diagnoses)
    ? record.diagnoses.filter((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
        const candidate = entry as Record<string, unknown>;
        return (
          typeof candidate.code === "string" &&
          typeof candidate.codeSystem === "string" &&
          typeof candidate.display === "string"
        );
      })
    : null;

  if (!diagnoses) {
    return contractMismatchResponse();
  }

  const response = NextResponse.json({ diagnoses });
  backend.applyTo(response);
  return response;
}
