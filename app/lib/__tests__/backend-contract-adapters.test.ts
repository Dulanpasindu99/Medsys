import { describe, expect, it } from "vitest";
import {
  adaptAuthStatusResponse,
  adaptCreatedUserResponse,
  adaptPatientCollectionResponse,
  adaptPatientDetailResponse,
  adaptPatientWriteRequest,
  adaptSessionIdentity,
  adaptUserWriteRequest,
} from "../backend-contract-adapters";

describe("backend contract adapters", () => {
  it("normalizes backend-native patient rows into frontend-friendly patient objects", () => {
    expect(
      adaptPatientCollectionResponse({
        patients: [
          {
            id: 7,
            firstName: "Jane",
            lastName: "Doe",
            phone: "555-2222",
            createdAt: "2026-03-09T00:00:00.000Z",
          },
        ],
      })
    ).toEqual([
      expect.objectContaining({
        id: 7,
        name: "Jane Doe",
        fullName: "Jane Doe",
        phone: "555-2222",
        mobile: "555-2222",
        createdAt: "2026-03-09T00:00:00.000Z",
        created_at: "2026-03-09T00:00:00.000Z",
      }),
    ]);
  });

  it("normalizes patient detail payloads with embedded history", () => {
    expect(
      adaptPatientDetailResponse({
        patient: {
          id: 4,
          firstName: "John",
          lastName: "Smith",
        },
        history: [
          {
            id: 3,
            note: "Observed for 24 hours",
            createdAt: "2026-03-09T00:00:00.000Z",
            actorUserId: 8,
            createdByName: "Dr. House",
            createdByRole: "doctor",
          },
        ],
      })
    ).toEqual({
      patient: expect.objectContaining({
        id: 4,
        name: "John Smith",
      }),
      history: [
        expect.objectContaining({
          id: 3,
          note: "Observed for 24 hours",
          created_by_user_id: 8,
          created_by_name: "Dr. House",
          created_by_role: "doctor",
        }),
      ],
    });
  });

  it("maps frontend patient create payloads to the backend-native request shape", () => {
    expect(
      adaptPatientWriteRequest({
        name: "Jane Doe",
        nic: "991234567V",
        age: 27,
        gender: "female",
        mobile: "555-2222",
        priority: "high",
      })
    ).toEqual({
      firstName: "Jane",
      lastName: "Doe",
      gender: "female",
      nic: "991234567V",
      age: 27,
      mobile: "555-2222",
      priority: "high",
      phone: "555-2222",
      dateOfBirth: undefined,
      address: undefined,
    });
  });

  it("maps frontend user create payloads to split backend name fields", () => {
    expect(
      adaptUserWriteRequest({
        name: "Dr. Jane Doe",
        email: "Doctor@Example.com",
        password: "strong-pass-123",
        role: "doctor",
      })
    ).toEqual({
      firstName: "Dr.",
      lastName: "Jane Doe",
      email: "doctor@example.com",
      password: "strong-pass-123",
      role: "doctor",
    });
  });

  it("ignores extra backend identity fields and preserves the frontend identity contract", () => {
    expect(
      adaptSessionIdentity({
        id: 42,
        role: "doctor",
        email: "doctor@example.com",
        name: "Dr. Jane Doe",
        organizationId: "org-1",
      })
    ).toEqual({
      id: 42,
      role: "doctor",
      email: "doctor@example.com",
      name: "Dr. Jane Doe",
    });
  });

  it("normalizes auth status responses for the frontend contract", () => {
    expect(
      adaptAuthStatusResponse({
        bootstrapping: false,
        users: 3,
        organizationId: "org-1",
      })
    ).toEqual({
      bootstrapping: false,
      users: 3,
    });
  });

  it("normalizes created user responses from wrapper payloads", () => {
    expect(
      adaptCreatedUserResponse({
        user: {
          id: 10,
          firstName: "Jane",
          lastName: "Doe",
          email: "doctor@example.com",
          role: "doctor",
          created_at: "2026-03-09T00:00:00.000Z",
        },
      })
    ).toEqual(
      expect.objectContaining({
        id: 10,
        name: "Jane Doe",
        email: "doctor@example.com",
        role: "doctor",
        created_at: "2026-03-09T00:00:00.000Z",
      })
    );
  });
});
