import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { AppRole } from "@/app/lib/roles";
import type { AppPermission } from "@/app/lib/authorization";
import type { DoctorWorkflowMode, OperatingMode, WorkflowProfiles } from "@/app/lib/api-client";

export const SESSION_COOKIE_NAME = "medsys_session";

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const HMAC_ALGORITHM = "sha256";

export type SessionPayload = {
  userId: number | null;
  role: AppRole;
  roles?: AppRole[];
  activeRole?: AppRole;
  email: string;
  name: string;
  permissions?: AppPermission[];
  extraPermissions?: AppPermission[];
  doctorWorkflowMode?: DoctorWorkflowMode;
  workflowProfiles?: WorkflowProfiles | null;
  operatingMode?: OperatingMode;
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

type SessionSecretConfig = {
  signingSecret: string;
  verificationSecrets: string[];
};

function parseAdditionalSecrets(raw: string | undefined) {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function getSessionSecretConfig(): SessionSecretConfig {
  const configuredSecret = process.env.MEDSYS_SESSION_SECRET?.trim() ?? "";
  const additionalSecrets = parseAdditionalSecrets(
    process.env.MEDSYS_SESSION_SECRET_PREVIOUS
  );
  const isDevelopment = process.env.NODE_ENV !== "production";
  const verificationSecrets: string[] = [];

  if (!configuredSecret) {
    if (isDevelopment) {
      verificationSecrets.push(DEV_FALLBACK_SESSION_SECRET);
      return {
        signingSecret: DEV_FALLBACK_SESSION_SECRET,
        verificationSecrets,
      };
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

  verificationSecrets.push(configuredSecret);
  for (const candidate of additionalSecrets) {
    if (!isDevelopment && DISALLOWED_SESSION_SECRETS.has(candidate.toLowerCase())) {
      continue;
    }

    if (candidate === configuredSecret || verificationSecrets.includes(candidate)) {
      continue;
    }

    verificationSecrets.push(candidate);
  }

  return {
    signingSecret: configuredSecret,
    verificationSecrets,
  };
}

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url");
}

function sign(rawPayload: string, secret: string) {
  return crypto.createHmac(HMAC_ALGORITHM, secret).update(rawPayload).digest("base64url");
}

export function createSessionToken(
  data: Omit<SessionPayload, "iat" | "exp">,
  options?: SessionOptions
) {
  const { signingSecret } = getSessionSecretConfig();
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
  const signature = sign(payloadEncoded, signingSecret);
  return `${payloadEncoded}.${signature}`;
}

function timingSafeEqual(a: string, b: string) {
  try {
    const aBuffer = fromBase64Url(a);
    const bBuffer = fromBase64Url(b);
    if (aBuffer.length !== bBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(aBuffer, bBuffer);
  } catch {
    return false;
  }
}

export function verifySessionToken(token: string): SessionPayload | null {
  const { verificationSecrets } = getSessionSecretConfig();
  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) {
    return null;
  }

  const hasMatchingSignature = verificationSecrets.some((secret) => {
    const expected = sign(payloadEncoded, secret);
    return timingSafeEqual(signature, expected);
  });

  if (!hasMatchingSignature) {
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
