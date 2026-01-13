const DEV_API_BASE_URL = "http://127.0.0.1:8080";

const stripTrailingSlash = (value: string) => value.replace(/\/$/, "");

const ensureHttps = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }
  if (trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }
  if (trimmed.startsWith("http://")) {
    return `https://${trimmed.slice("http://".length)}`;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
};

const resolveApiBaseUrl = () => {
  const envBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (envBase) {
    return envBase;
  }
  if (process.env.NODE_ENV === "development") {
    return DEV_API_BASE_URL;
  }
  if (typeof window !== "undefined" && window.location?.host) {
    return `https://${window.location.host}`;
  }
  return "";
};

const rawBaseUrl = resolveApiBaseUrl();
const normalizedBaseUrl =
  process.env.NODE_ENV === "production" ? ensureHttps(rawBaseUrl) : rawBaseUrl;

export const API_BASE_URL = stripTrailingSlash(normalizedBaseUrl);
