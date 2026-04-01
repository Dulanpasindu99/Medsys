import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/lib/api-auth";
import { adaptPatientDetailResponse, adaptSinglePatientResponse } from "@/app/lib/backend-contract-adapters";
import { callBackendRoute, toFrontendErrorResponse } from "@/app/lib/backend-route-client";
import { serializePatient } from "@/app/lib/api-serializers";
import {
  parseJsonBody,
  parsePositiveInteger,
  validatePatientUpdatePayload,
  validationErrorResponse,
} from "@/app/lib/api-validation";

type PatientUpdateShape = {
  firstName?: string;
  lastName?: string;
  dob?: string | null;
  phone?: string | null;
  address?: string | null;
  bloodGroup?: string | null;
  nic?: string | null;
  gender?: "male" | "female" | "other";
  familyId?: number | null;
  familyCode?: string | null;
  guardianPatientId?: number | null;
  guardianName?: string | null;
  guardianNic?: string | null;
  guardianPhone?: string | null;
  guardianRelationship?: string | null;
};

function contractMismatchResponse() {
  return NextResponse.json(
    { error: "Backend contract mismatch for the patient detail route." },
    { status: 502 }
  );
}

function normalizeString(value: string | null | undefined) {
  return value?.trim() ?? "";
}

type IdentityComparableRecord = {
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  dateOfBirth?: string | null;
  date_of_birth?: string | null;
  dob?: string | null;
};

function shouldRetryIdentityPatch(input: PatientUpdateShape, updated: IdentityComparableRecord) {
  if (input.firstName && normalizeString(String(updated.firstName ?? updated.first_name ?? "")) !== normalizeString(input.firstName)) {
    return true;
  }

  if (input.lastName && normalizeString(String(updated.lastName ?? updated.last_name ?? "")) !== normalizeString(input.lastName)) {
    return true;
  }

  if (input.dob && normalizeString(String(updated.dateOfBirth ?? updated.date_of_birth ?? updated.dob ?? "")) !== normalizeString(input.dob)) {
    return true;
  }

  return false;
}

function buildLegacyPatientUpdatePayload(input: PatientUpdateShape) {
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    ...(firstName ? { first_name: firstName } : {}),
    ...(lastName ? { last_name: lastName } : {}),
    ...(fullName ? { full_name: fullName, fullName, name: fullName } : {}),
    ...("dob" in input ? { dob: input.dob ?? null, date_of_birth: input.dob ?? null } : {}),
    ...("phone" in input ? { phone: input.phone ?? null } : {}),
    ...("address" in input ? { address: input.address ?? null } : {}),
    ...("bloodGroup" in input ? { blood_group: input.bloodGroup ?? null, bloodGroup: input.bloodGroup ?? null } : {}),
    ...("nic" in input ? { nic: input.nic ?? null } : {}),
    ...("gender" in input ? { gender: input.gender } : {}),
    ...("familyId" in input ? { family_id: input.familyId ?? null, familyId: input.familyId ?? null } : {}),
    ...("familyCode" in input ? { family_code: input.familyCode ?? null, familyCode: input.familyCode ?? null } : {}),
    ...("guardianPatientId" in input
      ? { guardian_patient_id: input.guardianPatientId ?? null, guardianPatientId: input.guardianPatientId ?? null }
      : {}),
    ...("guardianName" in input ? { guardian_name: input.guardianName ?? null, guardianName: input.guardianName ?? null } : {}),
    ...("guardianNic" in input ? { guardian_nic: input.guardianNic ?? null, guardianNic: input.guardianNic ?? null } : {}),
    ...("guardianPhone" in input ? { guardian_phone: input.guardianPhone ?? null, guardianPhone: input.guardianPhone ?? null } : {}),
    ...("guardianRelationship" in input
      ? {
          guardian_relationship: input.guardianRelationship ?? null,
          guardianRelationship: input.guardianRelationship ?? null,
        }
      : {}),
  };
}

function buildForwardPatientUpdatePayload(input: PatientUpdateShape) {
  return {
    ...input,
    ...("dob" in input ? { date_of_birth: input.dob ?? null, dateOfBirth: input.dob ?? null } : {}),
    ...("bloodGroup" in input
      ? { blood_group: input.bloodGroup ?? null, bloodGroup: input.bloodGroup ?? null }
      : {}),
    ...("familyId" in input ? { family_id: input.familyId ?? null } : {}),
    ...("guardianName" in input ? { guardian_name: input.guardianName ?? null } : {}),
    ...("guardianNic" in input ? { guardian_nic: input.guardianNic ?? null } : {}),
    ...("guardianPhone" in input ? { guardian_phone: input.guardianPhone ?? null } : {}),
    ...("guardianRelationship" in input
      ? { guardian_relationship: input.guardianRelationship ?? null }
      : {}),
  };
}

function hasIdentityFields(input: PatientUpdateShape) {
  return Boolean(
    ("firstName" in input && input.firstName !== undefined) ||
      ("lastName" in input && input.lastName !== undefined) ||
      ("dob" in input && input.dob !== undefined)
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "patient.read");
  if (auth.error) {
    return auth.error;
  }

  const { id: idParam } = await params;
  const id = parsePositiveInteger(idParam, "id");
  if (!id.ok) {
    return validationErrorResponse(id.issues);
  }

  const backend = await callBackendRoute(request, `/v1/patients/${id.value}`, {
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to load patient.");
  }

  try {
    const detail = adaptPatientDetailResponse(await backend.response.json());
    const response = NextResponse.json({
      patient: serializePatient(detail.patient),
      history: detail.history.map((entry) => ({
        id: entry.id,
        note: entry.note,
        created_at: entry.created_at,
        created_by_user_id: entry.created_by_user_id,
        created_by_name: entry.created_by_name,
        created_by_role: entry.created_by_role,
      })),
    });
    backend.applyTo(response);
    return response;
  } catch {
    return contractMismatchResponse();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "patient.write");
  if (auth.error) {
    return auth.error;
  }

  const { id: idParam } = await params;
  const id = parsePositiveInteger(idParam, "id");
  if (!id.ok) {
    return validationErrorResponse(id.issues);
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return validationErrorResponse(parsedBody.issues);
  }

  const validated = validatePatientUpdatePayload(parsedBody.value);
  if (!validated.ok) {
    return validationErrorResponse(validated.issues);
  }

  const backend = await callBackendRoute(request, `/v1/patients/${id.value}`, {
    body: JSON.stringify(buildForwardPatientUpdatePayload(validated.value as PatientUpdateShape)),
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to update patient.");
  }

  try {
    let updated = adaptSinglePatientResponse(await backend.response.json());
    const shouldRunLegacyFollowUp =
      hasIdentityFields(validated.value as PatientUpdateShape) ||
      shouldRetryIdentityPatch(validated.value as PatientUpdateShape, updated);

    if (shouldRunLegacyFollowUp) {
      const legacyBackend = await callBackendRoute(request, `/v1/patients/${id.value}`, {
        body: JSON.stringify(buildLegacyPatientUpdatePayload(validated.value as PatientUpdateShape)),
        includeSearch: false,
      });
      if (legacyBackend.ok && legacyBackend.response.ok) {
        updated = adaptSinglePatientResponse(await legacyBackend.response.json());
        const response = NextResponse.json({
          patient: serializePatient(updated),
        });
        legacyBackend.applyTo(response);
        return response;
      }
    }

    const response = NextResponse.json({
      patient: serializePatient(updated),
    });
    backend.applyTo(response);
    return response;
  } catch {
    return contractMismatchResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requirePermission(request, "patient.delete");
  if (auth.error) {
    return auth.error;
  }

  const { id: idParam } = await params;
  const id = parsePositiveInteger(idParam, "id");
  if (!id.ok) {
    return validationErrorResponse(id.issues);
  }

  const backend = await callBackendRoute(request, `/v1/patients/${id.value}`, {
    includeSearch: false,
  });
  if (!backend.ok) {
    return backend.response;
  }

  if (!backend.response.ok) {
    return toFrontendErrorResponse(backend.response, "Unable to delete patient.");
  }

  const response = NextResponse.json({ success: true });
  backend.applyTo(response);
  return response;
}
