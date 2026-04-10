import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { adaptCreatedUserResponse } from "@/app/lib/backend-contract-adapters";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import { serializeUser } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  parsePositiveInteger,
  validateUserPermissionUpdatePayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the user detail route." },
    { status: 502 }
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "user.write");
  if (auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const parsedId = parsePositiveInteger(id, "id");
  if (!parsedId.ok) {
    return validationErrorResponse(parsedId.issues);
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return validationErrorResponse(parsedBody.issues);
  }

  const validated = validateUserPermissionUpdatePayload(parsedBody.value);
  if (!validated.ok) {
    return validationErrorResponse(validated.issues);
  }

  const backend = await callBackendRoute(request, `/v1/users/${parsedId.value}`, {
    body: JSON.stringify(validated.value),
    includeSearch: false,
    method: "PATCH",
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to update user permissions.");
  }

  try {
    const updated = adaptCreatedUserResponse(await backend.response.json());
    const response = NextResponse.json({ user: serializeUser(updated) });
    backend.applyTo(response);
    return response;
  } catch {
    return contractMismatchResponse();
  }
}
