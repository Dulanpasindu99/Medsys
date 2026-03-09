import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { adaptCreatedUserResponse, adaptUserCollectionResponse } from "@/app/lib/backend-contract-adapters";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import { serializeUser } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  validateUserRoleQuery,
  validateUserWritePayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the user route." },
    { status: 502 }
  );
}

export async function GET(request: NextRequest) {
  const auth = requirePermission(request, "user.read");
  if (auth.error) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const role = validateUserRoleQuery(searchParams.get("role"));
  if (!role.ok) {
    return validationErrorResponse(role.issues);
  }

  const backend = await callBackendRoute(request, "/v1/users");
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load users.");
  }

  try {
    const users = adaptUserCollectionResponse(await backend.response.json()).map(serializeUser);
    const response = NextResponse.json({ users });
    backend.applyTo(response);
    return response;
  } catch {
    return contractMismatchResponse();
  }
}

export async function POST(request: NextRequest) {
  const auth = requirePermission(request, "user.write");
  if (auth.error) {
    return auth.error;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return validationErrorResponse(parsedBody.issues);
  }

  const validated = validateUserWritePayload(parsedBody.value);
  if (!validated.ok) {
    return validationErrorResponse(validated.issues);
  }

  const backend = await callBackendRoute(request, "/v1/users", {
    body: JSON.stringify(validated.value),
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to create user.");
  }

  try {
    const created = adaptCreatedUserResponse(await backend.response.json());
    const response = NextResponse.json({ user: serializeUser(created) });
    backend.applyTo(response);
    return response;
  } catch {
    return contractMismatchResponse();
  }
}
