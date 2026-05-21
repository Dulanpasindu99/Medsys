const DEFAULT_BACKEND_ORIGIN = "http://localhost:4000";

export function getBackendOrigin() {
  const configuredOrigin =
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    DEFAULT_BACKEND_ORIGIN;

  return configuredOrigin.replace(/\/+$/, "");
}
