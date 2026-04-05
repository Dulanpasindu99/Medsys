import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET as listInventoryRoute, POST as createInventoryRoute } from "../route";
import { PATCH as updateInventoryRoute } from "../[id]/route";
import { GET as listInventoryAlertsRoute } from "../alerts/route";
import {
  GET as listMovementRoute,
  POST as createMovementRoute,
} from "../[id]/movements/route";

function buildRequest(
  url: string,
  method = "GET",
  body?: unknown,
  role: "owner" | "doctor" | "assistant" = "assistant"
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
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("/api/inventory BFF routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads inventory through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([{ id: 1, name: "Paracetamol", quantity: 24 }]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await listInventoryRoute(buildRequest("http://localhost/api/inventory"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/inventory");
    expect(body).toEqual([{ id: 1, name: "Paracetamol", quantity: 24 }]);
  });

  it("creates inventory items through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ id: 2, name: "Ibuprofen", quantity: 10 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = {
      name: "Ibuprofen",
      category: "medicine",
      quantity: 10,
      unit: "units",
    };
    const response = await createInventoryRoute(
      buildRequest("http://localhost/api/inventory", "POST", payload)
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/inventory");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
    expect(body).toEqual({ id: 2, name: "Ibuprofen", quantity: 10 });
  });

  it("blocks unauthenticated inventory item creation", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await createInventoryRoute(
      buildUnauthedRequest(
        "http://localhost/api/inventory",
        "POST",
        { name: "Ibuprofen", category: "medicine", quantity: 10, unit: "units" }
      )
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates inventory ids before update", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await updateInventoryRoute(
      buildRequest("http://localhost/api/inventory/not-a-number", "PATCH", { quantity: 5 }),
      { params: Promise.resolve({ id: "not-a-number" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: [{ field: "id", message: "Must be a positive integer." }],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("updates inventory items through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ id: 2, name: "Ibuprofen", quantity: 15 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = { quantity: 15 };
    const response = await updateInventoryRoute(
      buildRequest("http://localhost/api/inventory/2", "PATCH", payload),
      { params: Promise.resolve({ id: "2" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/inventory/2");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
    expect(body).toEqual({ id: 2, name: "Ibuprofen", quantity: 15 });
  });

  it("loads inventory movement history through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([{ id: 99, type: "in", quantity: 1 }]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await listMovementRoute(
      buildRequest("http://localhost/api/inventory/2/movements"),
      { params: Promise.resolve({ id: "2" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/inventory/2/movements");
    expect(body).toEqual([{ id: 99, type: "in", quantity: 1 }]);
  });

  it("loads inventory alerts through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ lowStockCount: 2, recommendedReorders: [{ itemName: "Paracetamol" }] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await listInventoryAlertsRoute(
      buildRequest("http://localhost/api/inventory/alerts?days=30")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/inventory/alerts?days=30");
    expect(body).toEqual({
      lowStockCount: 2,
      recommendedReorders: [{ itemName: "Paracetamol" }],
    });
  });

  it("creates inventory movements through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ id: 100, type: "out", quantity: 1 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = { type: "out", quantity: 1, note: "Quick out" };
    const response = await createMovementRoute(
      buildRequest("http://localhost/api/inventory/2/movements", "POST", payload),
      { params: Promise.resolve({ id: "2" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/inventory/2/movements");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
    expect(body).toEqual({ id: 100, type: "out", quantity: 1 });
  });

  it("blocks unauthenticated inventory movement creation", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await createMovementRoute(
      buildUnauthedRequest("http://localhost/api/inventory/2/movements", "POST", { type: "out", quantity: 1 }),
      { params: Promise.resolve({ id: "2" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized." });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
