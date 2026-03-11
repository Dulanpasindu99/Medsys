import type { UserRole } from "@/app/lib/types";

const ACCESS_TOKEN_KEY = "medsys.access_token";
const REFRESH_TOKEN_KEY = "medsys.refresh_token";
const USER_ROLE_KEY = "medsys.user_role";

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let memoryUserRole: UserRole | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

export function setTokens(accessToken: string, refreshToken: string) {
  memoryAccessToken = accessToken;
  memoryRefreshToken = refreshToken;

  if (isBrowser()) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function setUserRole(role: UserRole | null) {
  memoryUserRole = role;

  if (isBrowser()) {
    if (role) {
      window.localStorage.setItem(USER_ROLE_KEY, role);
    } else {
      window.localStorage.removeItem(USER_ROLE_KEY);
    }
  }
}

export function getAccessToken() {
  if (memoryAccessToken) {
    return memoryAccessToken;
  }
  if (isBrowser()) {
    const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    memoryAccessToken = token;
    return token;
  }
  return null;
}

export function getRefreshToken() {
  if (memoryRefreshToken) {
    return memoryRefreshToken;
  }
  if (isBrowser()) {
    const token = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    memoryRefreshToken = token;
    return token;
  }
  return null;
}

export function getUserRole(): UserRole | null {
  if (memoryUserRole) {
    return memoryUserRole;
  }
  if (isBrowser()) {
    const role = window.localStorage.getItem(USER_ROLE_KEY) as UserRole | null;
    memoryUserRole = role;
    return role;
  }
  return null;
}

export function clearSession() {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  memoryUserRole = null;

  if (isBrowser()) {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(USER_ROLE_KEY);
  }
}
