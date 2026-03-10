type BackendAvailability =
  | { ok: true }
  | { ok: false; reason: "backend_unreachable" | "backend_unhealthy" };

function getBackendHealthUrl() {
  const backendOrigin = process.env.BACKEND_URL ?? "http://localhost:4000";
  return `${backendOrigin.replace(/\/+$/, "")}/healthz`;
}

export async function getBackendAvailability(): Promise<BackendAvailability> {
  try {
    const response = await fetch(getBackendHealthUrl(), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, reason: "backend_unhealthy" };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "backend_unreachable" };
  }
}
