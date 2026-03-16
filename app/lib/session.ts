import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { AppRole } from "@/app/lib/roles";
import type { AppPermission } from "@/app/lib/authorization";

export const SESSION_COOKIE_NAME = "medsys_session";

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const HMAC_ALGORITHM = "sha256";

export type SessionPayload = {
  userId: number | null;
  role: AppRole;
  email: string;
  name: string;
  permissions?: AppPermission[];
  iat: number;
  exp: number;
};

type SessionOptions = {
  expiresAt?: number;
};

const DEV_FALLBACK_SESSION_SECRET = "dev-insecure-session-secret-change-me";
const DISALLOWED_SESSION_SECRETS = new Set([
  "",
  "change-me",
  "changeme",
  "dev-insecure-session-secret-change-me",
  "replace-me",
  "replace-with-a-long-random-secret",
]);

function getSessionSecret() {
  const configuredSecret = process.env.MEDSYS_SESSION_SECRET?.trim() ?? "";
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (!configuredSecret) {
    if (isDevelopment) {
      return DEV_FALLBACK_SESSION_SECRET;
    }

    throw new Error(
      "MEDSYS_SESSION_SECRET must be set to a non-placeholder value before running in production."
    );
  }

  if (!isDevelopment && DISALLOWED_SESSION_SECRETS.has(configuredSecret.toLowerCase())) {
    throw new Error(
      "MEDSYS_SESSION_SECRET must be replaced with a strong random secret before running in production."
    );
  }

  return configuredSecret;
}

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url");
}

function sign(rawPayload: string) {
  return crypto.createHmac(HMAC_ALGORITHM, getSessionSecret()).update(rawPayload).digest("base64url");
}

export function createSessionToken(
  data: Omit<SessionPayload, "iat" | "exp">,
  options?: SessionOptions
) {
  const now = Math.floor(Date.now() / 1000);
  const exp = options?.expiresAt && options.expiresAt > now
    ? options.expiresAt
    : now + SESSION_TTL_SECONDS;
  const payload: SessionPayload = {
    ...data,
    iat: now,
    exp,
  };

  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

function timingSafeEqual(a: string, b: string) {
  const aBuffer = fromBase64Url(a);
  const bBuffer = fromBase64Url(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) {
    return null;
  }

  const expected = sign(payloadEncoded);
  if (!timingSafeEqual(signature, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payloadEncoded).toString("utf8")) as SessionPayload;
    if (!parsed?.role || !parsed?.exp) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp <= now) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function readSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export function attachSessionCookie(
  response: NextResponse,
  payload: Omit<SessionPayload, "iat" | "exp">,
  options?: SessionOptions
) {
  const token = createSessionToken(payload, options);
  const now = Math.floor(Date.now() / 1000);
  const maxAge = options?.expiresAt && options.expiresAt > now
    ? options.expiresAt - now
    : SESSION_TTL_SECONDS;
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
