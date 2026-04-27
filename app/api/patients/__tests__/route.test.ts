import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { BACKEND_ACCESS_COOKIE_NAME, BACKEND_REFRESH_COOKIE_NAME } from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET as listPatientsRoute, POST as createPatientRoute } from "../route";
import {
  DELETE as deletePatientRoute,
  GET as getPatientRoute,
  PATCH as updatePatientRoute,
} from "../[id]/route";
import {
  GET as listPatientHistoryRoute,
  POST as createPatientHistoryRoute,
} from "../[id]/history/route";

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
      cookie: [
        `${SESSION_COOKIE_NAME}=${sessionToken}`,
        `${BACKEND_ACCESS_COOKIE_NAME}=backend-access-token`,
        `${BACKEND_REFRESH_COOKIE_NAME}=backend-refresh-token`,
      ].join("; "),
      "Content-Type": "application/json",
    },
  });
}

describe("/api/patients BFF routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows assistants to read the patient list through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          patients: [
            {
              id: 7,
              first_name: "Jane",
              last_name: "Doe",
              nic: "990011223V",
              age: 31,
              gender: "female",
              phone: "555-0000",
              created_at: "2026-03-09T00:00:00.000Z",
              family_name: "Doe Family",
              visit_count: 3,
              last_visit_at: "2026-03-09T00:00:00.000Z",
              next_appointment: {
                id: 11,
                scheduled_at: "2026-03-10T09:00:00.000Z",
                status: "waiting",
              },
              allergy_highlights: ["Dust", "Mist"],
              major_active_condition: "Asthma",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await listPatientsRoute(
      buildRequest("http://localhost/api/patients", "assistant")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/patients");
    expect(body).toEqual({
      patients: [
        {
          id: 7,
          name: "Jane Doe",
          first_name: "Jane",
          last_name: "Doe",
          date_of_birth: null,
          phone: "555-0000",
          address: null,
          created_at: "2026-03-09T00:00:00.000Z",
          nic: "990011223V",
          age: 31,
          gender: "female",
          family_name: "Doe Family",
          visit_count: 3,
          last_visit_at: "2026-03-09T00:00:00.000Z",
          next_appointment: {
            id: 11,
            scheduled_at: "2026-03-10T09:00:00.000Z",
            status: "waiting",
          },
          allergy_highlights: ["Dust", "Mist"],
          major_active_condition: "Asthma",
        },
      ],
    });
  });

  it("forwards patient scope query params to the backend list route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ patients: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await listPatientsRoute(
      buildRequest(
        "http://localhost/api/patients?scope=my_patients&doctorId=8",
        "owner"
      )
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:4000/v1/patients?scope=my_patients&doctorId=8"
    );
  });

  it("serializes patient detail responses from backend payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            patient: {
              id: 7,
              first_name: "Jane",
              last_name: "Doe",
              nic: "990011223V",
              age: 31,
              gender: "female",
              created_at: "2026-03-09T00:00:00.000Z",
            },
            history: [
              {
                id: 3,
                note: "Observed for 24 hours",
                created_at: "2026-03-09T00:00:00.000Z",
                createdByUserId: 1,
                createdByName: "Doctor User",
                createdByRole: "doctor",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const response = await getPatientRoute(
      buildRequest("http://localhost/api/patients/7", "doctor"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      patient: expect.objectContaining({
        id: 7,
        name: "Jane Doe",
        first_name: "Jane",
        last_name: "Doe",
        created_at: "2026-03-09T00:00:00.000Z",
        nic: "990011223V",
        age: 31,
        gender: "female",
      }),
      history: [
        expect.objectContaining({
          id: 3,
          note: "Observed for 24 hours",
          created_at: "2026-03-09T00:00:00.000Z",
          created_by_user_id: 1,
          created_by_name: "Doctor User",
          created_by_role: "doctor",
        }),
      ],
    });
  });

  it("allows doctors to delete patients when patient.delete is granted", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await deletePatientRoute(
      buildRequest("http://localhost/api/patients/7", "doctor", "DELETE"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid patient create payloads with a validation envelope", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await createPatientRoute(
      buildRequest("http://localhost/api/patients", "assistant", "POST", {
        firstName: "",
        lastName: "",
        dob: "09-03-2026",
        phone: 12345,
        gender: "unknown",
        extra: "field",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: expect.arrayContaining([
        { field: "firstName", message: "Is required." },
        { field: "lastName", message: "Is required." },
        { field: "dob", message: "Must use YYYY-MM-DD format." },
        { field: "phone", message: "Must be a string." },
        { field: "gender", message: "Must be one of male, female, other." },
        { field: "extra", message: "Unknown field." },
      ]),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid Sri Lankan NIC values for patient create payloads", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await createPatientRoute(
      buildRequest("http://localhost/api/patients", "assistant", "POST", {
        firstName: "Harini",
        lastName: "Silva",
        dob: "1996-11-20",
        nic: "19961120000",
        gender: "female",
        phone: "+94715678900",
        address: "Panadura, Sri Lanka",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: [
        {
          field: "nic",
          message: "Must be a valid Sri Lankan NIC: 12 digits or 9 digits followed by V/X.",
        },
      ],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the current frontend patient payload shape through the BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          patient: {
            id: 9,
            name: "Jane Doe",
            nic: "991234567V",
            age: 27,
            gender: "female",
            phone: "555-2222",
            created_at: "2026-03-09T00:00:00.000Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await createPatientRoute(
      buildRequest("http://localhost/api/patients", "assistant", "POST", {
        firstName: " Jane ",
        lastName: " Doe ",
        dob: "1999-03-09",
        nic: "991234567V",
        gender: "female",
        phone: "555-2222",
        bloodGroup: "B+",
        priority: "high",
        allergies: [
          { allergyName: "Penicillin", severity: "high", isActive: true },
        ],
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      firstName: "Jane",
      lastName: "Doe",
      dob: "1999-03-09",
      phone: "555-2222",
      address: null,
      bloodGroup: "B+",
      allergies: [
        { allergyName: "Penicillin", severity: "high", isActive: true },
      ],
      priority: "high",
      nic: "991234567V",
      gender: "female",
    });
    expect(body).toEqual({
      patient: expect.objectContaining({
        id: 9,
        name: "Jane Doe",
        phone: "555-2222",
        created_at: "2026-03-09T00:00:00.000Z",
        nic: "991234567V",
        age: 27,
        gender: "female",
      }),
    });
  });

  it("rejects empty patient patch payloads", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

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
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes blood group through the patient patch BFF validator", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          patient: {
            id: 41,
            first_name: "Dulan",
            last_name: "Nishthunga",
            nic: "992970375V",
            age: 27,
            gender: "male",
            phone: "0776347519",
            blood_group: "O+",
            created_at: "2026-03-31T11:54:41.562Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await updatePatientRoute(
      buildRequest("http://localhost/api/patients/41", "doctor", "PATCH", {
        bloodGroup: "O+",
      }),
      { params: Promise.resolve({ id: "41" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      bloodGroup: "O+",
      blood_group: "O+",
    });
    expect(body).toEqual({
      patient: expect.objectContaining({
        id: 41,
        name: "Dulan Nishthunga",
        phone: "0776347519",
        created_at: "2026-03-31T11:54:41.562Z",
        nic: "992970375V",
        age: 27,
        gender: "male",
      }),
    });
  });

  it("retries patient patch with legacy aliases when identity fields come back stale", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            patient: {
              id: 41,
              first_name: "Dulan",
              last_name: "Nis",
              nic: "992970375V",
              dob: "1999-03-15",
              age: 27,
              gender: "male",
              phone: "0776347519",
              blood_group: "O+",
              created_at: "2026-03-31T11:54:41.562Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            patient: {
              id: 41,
              first_name: "Dulan",
              last_name: "Nishthunga",
              nic: "992970375V",
              dob: "2000-10-23",
              age: 25,
              gender: "male",
              phone: "0776347519",
              blood_group: "O+",
              created_at: "2026-03-31T11:54:41.562Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await updatePatientRoute(
      buildRequest("http://localhost/api/patients/41", "doctor", "PATCH", {
        firstName: "Dulan",
        lastName: "Nishthunga",
        dob: "2000-10-23",
        gender: "male",
        nic: "992970375V",
        phone: "0776347519",
        address: null,
        bloodGroup: "O+",
        familyId: 16,
      }),
      { params: Promise.resolve({ id: "41" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      first_name: "Dulan",
      last_name: "Nishthunga",
      full_name: "Dulan Nishthunga",
      name: "Dulan Nishthunga",
      date_of_birth: "2000-10-23",
      blood_group: "O+",
      family_id: 16,
    });
    expect(body).toEqual({
      patient: expect.objectContaining({
        id: 41,
        name: "Dulan Nishthunga",
        first_name: "Dulan",
        last_name: "Nishthunga",
        date_of_birth: "2000-10-23",
        phone: "0776347519",
        created_at: "2026-03-31T11:54:41.562Z",
        nic: "992970375V",
        age: 25,
        gender: "male",
      }),
    });
  });

  it("rejects invalid patient history payloads", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

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
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serializes patient history reads consistently", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            history: [
              {
                id: 3,
                note: "Observed for 24 hours",
                created_at: "2026-03-09T00:00:00.000Z",
                createdByUserId: 1,
                createdByName: "Doctor User",
                createdByRole: "doctor",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

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

  it("returns 502 when the patient detail wrapper drifts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 7,
            first_name: "Jane",
            last_name: "Doe",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const response = await getPatientRoute(
      buildRequest("http://localhost/api/patients/7", "doctor"),
      { params: Promise.resolve({ id: "7" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: "Backend contract mismatch for the patient detail route.",
    });
  });
});
