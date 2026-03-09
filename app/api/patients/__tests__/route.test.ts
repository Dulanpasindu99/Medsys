import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET as listPatientsRoute, POST as createPatientRoute } from "../route";
import {
  DELETE as deletePatientRoute,
  PATCH as updatePatientRoute,
} from "../[id]/route";
import { GET as listPatientHistoryRoute, POST as createPatientHistoryRoute } from "../[id]/history/route";
import {
  createPatient,
  createPatientHistory,
  deletePatient,
  findPatientById,
  findUserById,
  listPatientHistory,
  listPatients,
  updatePatient,
} from "../../../lib/store";

vi.mock("../../../lib/store", () => ({
  listPatients: vi.fn(),
  deletePatient: vi.fn(),
  findPatientById: vi.fn(),
  findUserById: vi.fn(),
  listPatientHistory: vi.fn(),
  updatePatient: vi.fn(),
  createPatient: vi.fn(),
  createPatientHistory: vi.fn(),
}));

const mockedListPatients = vi.mocked(listPatients);
const mockedCreatePatient = vi.mocked(createPatient);
const mockedFindPatientById = vi.mocked(findPatientById);
const mockedUpdatePatient = vi.mocked(updatePatient);
const mockedDeletePatient = vi.mocked(deletePatient);
const mockedListPatientHistory = vi.mocked(listPatientHistory);
const mockedCreatePatientHistory = vi.mocked(createPatientHistory);
const mockedFindUserById = vi.mocked(findUserById);

function buildRequest(
  url: string,
  role: "owner" | "doctor" | "assistant",
  method = "GET",
  body?: unknown
) {
  const sessionToken = createSessionToken({
    userId: 1,
    role,
    email: `${role}@example.com`,
    name: role,
  });

  return new NextRequest(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
      "Content-Type": "application/json",
    },
  });
}

describe("/api/patients permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFindUserById.mockReturnValue({
      id: 1,
      name: "Doctor User",
      email: "doctor@example.com",
      passwordHash: "hashed",
      role: "doctor",
      createdAt: "2026-03-09T00:00:00.000Z",
    });
  });

  it("allows assistants to read the patient list", async () => {
    mockedListPatients.mockReturnValue([
      {
        id: 7,
        name: "Jane Doe",
        dateOfBirth: null,
        phone: "555-0000",
        address: null,
        createdAt: "2026-03-09T00:00:00.000Z",
      },
    ]);

    const response = await listPatientsRoute(
      buildRequest("http://localhost/api/patients", "assistant")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      patients: [
        {
          id: 7,
          name: "Jane Doe",
          date_of_birth: null,
          phone: "555-0000",
          address: null,
          created_at: "2026-03-09T00:00:00.000Z",
        },
      ],
    });
  });

  it("blocks doctors from deleting patients", async () => {
    const response = await deletePatientRoute(
      buildRequest("http://localhost/api/patients/7", "doctor", "DELETE"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden." });
    expect(mockedDeletePatient).not.toHaveBeenCalled();
  });

  it("rejects invalid patient create payloads with a validation envelope", async () => {
    const response = await createPatientRoute(
      buildRequest("http://localhost/api/patients", "assistant", "POST", {
        name: "",
        dateOfBirth: "09-03-2026",
        phone: 12345,
        extra: "field",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: expect.arrayContaining([
        { field: "name", message: "Is required." },
        { field: "dateOfBirth", message: "Must use YYYY-MM-DD format." },
        { field: "phone", message: "Must be a string." },
        { field: "extra", message: "Unknown field." },
      ]),
    });
    expect(mockedCreatePatient).not.toHaveBeenCalled();
  });

  it("serializes validated patient create responses consistently", async () => {
    mockedCreatePatient.mockReturnValue({
      id: 9,
      name: "Jane Doe",
      dateOfBirth: "1990-06-01",
      phone: "555-2222",
      address: "42 Main Street",
      createdAt: "2026-03-09T00:00:00.000Z",
    });

    const response = await createPatientRoute(
      buildRequest("http://localhost/api/patients", "assistant", "POST", {
        name: " Jane Doe ",
        dateOfBirth: "1990-06-01",
        phone: "555-2222",
        address: "42 Main Street",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      patient: {
        id: 9,
        name: "Jane Doe",
        date_of_birth: "1990-06-01",
        phone: "555-2222",
        address: "42 Main Street",
        created_at: "2026-03-09T00:00:00.000Z",
      },
    });
  });

  it("rejects empty patient patch payloads", async () => {
    const response = await updatePatientRoute(
      buildRequest("http://localhost/api/patients/7", "doctor", "PATCH", {}),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: [{ field: "body", message: "At least one updatable field is required." }],
    });
    expect(mockedUpdatePatient).not.toHaveBeenCalled();
  });

  it("rejects invalid patient history payloads", async () => {
    mockedFindPatientById.mockReturnValue({
      id: 7,
      name: "Jane Doe",
      dateOfBirth: null,
      phone: null,
      address: null,
      createdAt: "2026-03-09T00:00:00.000Z",
    });

    const response = await createPatientHistoryRoute(
      buildRequest("http://localhost/api/patients/7/history", "doctor", "POST", {
        note: "",
        extra: true,
      }),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: expect.arrayContaining([
        { field: "note", message: "Is required." },
        { field: "extra", message: "Unknown field." },
      ]),
    });
    expect(mockedCreatePatientHistory).not.toHaveBeenCalled();
  });

  it("serializes patient history reads consistently", async () => {
    mockedListPatientHistory.mockReturnValue([
      {
        id: 3,
        patientId: 7,
        note: "Observed for 24 hours",
        createdAt: "2026-03-09T00:00:00.000Z",
        createdByUserId: 1,
      },
    ]);

    const response = await listPatientHistoryRoute(
      buildRequest("http://localhost/api/patients/7/history", "assistant"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      history: [
        {
          id: 3,
          note: "Observed for 24 hours",
          created_at: "2026-03-09T00:00:00.000Z",
          created_by_user_id: 1,
          created_by_name: "Doctor User",
          created_by_role: "doctor",
        },
      ],
    });
  });
});
