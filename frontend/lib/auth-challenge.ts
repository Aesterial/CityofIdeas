import type { AuthChallenge } from "@/lib/api";

const STORAGE_KEY = "authChallenge";

const isAuthChallenge = (value: unknown): value is AuthChallenge => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.type === "string";
};

export const saveAuthChallenge = (challenge: AuthChallenge) => {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
};

export const loadAuthChallenge = (): AuthChallenge | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isAuthChallenge(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const clearAuthChallenge = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(STORAGE_KEY);
};
