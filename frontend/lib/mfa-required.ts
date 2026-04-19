export const MFA_REQUIRED_EVENT = "mfa-required";

const normalizeMfaValue = (value: string) =>
  value.toLowerCase().replace(/[\s_-]+/g, "");

export const isMfaRequiredMessage = (value: unknown): boolean => {
  if (typeof value !== "string") {
    return false;
  }
  return normalizeMfaValue(value).includes("mfarequired");
};

export const emitMfaRequired = (detail?: { reason?: string }) => {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(MFA_REQUIRED_EVENT, { detail: detail ?? {} }),
  );
};
