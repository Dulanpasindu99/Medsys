import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  BACKEND_ACCESS_COOKIE_NAME,
  BACKEND_REFRESH_COOKIE_NAME,
} from "../../../lib/backend-auth-cookies";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../../lib/session";
import { GET as inventoryDetailRoute } from "../[id]/route";
import { POST as adjustStockRoute } from "../[id]/adjust-stock/route";
import { GET as listBatchesRoute, POST as createBatchRoute } from "../[id]/batches/route";
import { GET as inventoryReportsRoute } from "../reports/route";

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

describe("/api/inventory advanced BFF routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads inventory item detail through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 2, name: "Ibuprofen", stock: 18 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await inventoryDetailRoute(buildRequest("http://localhost/api/inventory/2"), {
      params: Promise.resolve({ id: "2" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/inventory/2");
    expect(body).toEqual({ id: 2, name: "Ibuprofen", stock: 18 });
  });

  it("creates stock adjustment through the backend-backed BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, itemId: 2 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const payload = { actualStock: 30, note: "Cycle count correction" };
    const response = await adjustStockRoute(
      buildRequest("http://localhost/api/inventory/2/adjust-stock", "POST", payload),
      { params: Promise.resolve({ id: "2" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/inventory/2/adjust-stock");
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify(payload));
    expect(body).toEqual({ success: true, itemId: 2 });
  });

  it("validates inventory id for stock adjustment route", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await adjustStockRoute(
      buildRequest("http://localhost/api/inventory/nope/adjust-stock", "POST", {
        actualStock: 30,
      }),
      { params: Promise.resolve({ id: "nope" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Validation failed.",
      issues: [{ field: "id", message: "Must be a positive integer." }],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads and creates inventory batches through backend-backed BFF routes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 1, batchNo: "B-001", quantity: 50 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 2, batchNo: "B-002", quantity: 100 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const listResponse = await listBatchesRoute(
      buildRequest("http://localhost/api/inventory/2/batches"),
      { params: Promise.resolve({ id: "2" }) }
    );
    const listBody = await listResponse.json();

    const payload = { batchNo: "B-002", quantity: 100, supplierName: "ABC Pharma" };
    const createResponse = await createBatchRoute(
      buildRequest("http://localhost/api/inventory/2/batches", "POST", payload),
      { params: Promise.resolve({ id: "2" }) }
    );
    const createBody = await createResponse.json();

    expect(listResponse.status).toBe(200);
    expect(listBody).toEqual([{ id: 1, batchNo: "B-001", quantity: 50 }]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/inventory/2/batches");
    expect(createResponse.status).toBe(200);
    expect(createBody).toEqual({ id: 2, batchNo: "B-002", quantity: 100 });
    expect(fetchMock.mock.calls[1]?.[0]).toBe("http://localhost:4000/v1/inventory/2/batches");
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(JSON.stringify(payload));
  });

  it("loads inventory reports through backend-backed BFF with days query", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ summary: { lowStockCount: 2 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await inventoryReportsRoute(
      buildRequest("http://localhost/api/inventory/reports?days=30")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:4000/v1/inventory/reports?days=30");
    expect(body).toEqual({ summary: { lowStockCount: 2 } });
  });
});
