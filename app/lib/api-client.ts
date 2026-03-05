export type ApiClientError = {
  message: string;
  status: number;
};

async function parseErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw { message, status: response.status } satisfies ApiClientError;
  }

  return (await response.json()) as T;
}

export type LoginResponse = {
  id: number;
  name: string;
  email: string;
  role: "owner" | "doctor" | "assistant";
};

export async function loginUser(email: string, password: string) {
  return requestJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: "owner" | "doctor" | "assistant";
}) {
  return requestJson<LoginResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logoutUser() {
  return requestJson<{ success: true }>("/api/auth/logout", { method: "POST" });
}

export async function getCurrentUser() {
  return requestJson<LoginResponse>("/api/auth/me", { method: "GET" });
}

export async function getAuthStatus() {
  return requestJson<{ bootstrapping: boolean; users: number }>("/api/auth/status", {
    method: "GET",
  });
}
