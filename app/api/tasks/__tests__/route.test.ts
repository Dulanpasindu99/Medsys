import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET as listTasksRoute, POST as createTaskRoute } from "../route";
import { PATCH as updateTaskRoute } from "../[id]/route";
import { POST as completeTaskRoute } from "../[id]/complete/route";

function buildRequest(
  url: string,
  method = "GET",
  body?: unknown,
  role: "owner" | "doctor" | "assistant" = "doctor"
) {
  const sessionToken = createSessionToken({
    userId: 42,
    role,
    email: `${role}@example.com`,
    name: `${role} user`,
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

function buildUnauthedRequest(url: string, method = "GET", body?: unknown) {
  return new NextRequest(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/tasks BFF routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads tasks through backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, title: "Follow-up due", status: "pending" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await listTasksRoute(buildRequest("http://localhost/api/tasks?status=pending"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/tasks?status=pending");
    expect(body).toEqual([{ id: 1, title: "Follow-up due", status: "pending" }]);
  });

  it("creates tasks through backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 2, title: "Review low stock", status: "pending" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      title: "Review low stock",
      taskType: "inventory",
      sourceType: "inventory_alert",
      assignedRole: "assistant",
    };
    const response = await createTaskRoute(buildRequest("http://localhost/api/tasks", "POST", payload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/tasks");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
    expect(body).toEqual({ id: 2, title: "Review low stock", status: "pending" });
  });

  it("updates and completes tasks through backend-backed BFF detail routes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 2, title: "Review low stock", status: "in_progress" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 2, title: "Review low stock", status: "completed" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const updatePayload = { status: "in_progress" };
    const updateResponse = await updateTaskRoute(
      buildRequest("http://localhost/api/tasks/2", "PATCH", updatePayload),
      { params: Promise.resolve({ id: "2" }) }
    );
    const updateBody = await updateResponse.json();

    const completePayload = { note: "Done" };
    const completeResponse = await completeTaskRoute(
      buildRequest("http://localhost/api/tasks/2/complete", "POST", completePayload),
      { params: Promise.resolve({ id: "2" }) }
    );
    const completeBody = await completeResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updateBody).toEqual({ id: 2, title: "Review low stock", status: "in_progress" });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/tasks/2");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(updatePayload));

    expect(completeResponse.status).toBe(200);
    expect(completeBody).toEqual({ id: 2, title: "Review low stock", status: "completed" });
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://localhost:4000/v1/tasks/2/complete");
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(JSON.stringify(completePayload));
  });

  it("blocks unauthenticated task list reads", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await listTasksRoute(buildUnauthedRequest("http://localhost/api/tasks"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
