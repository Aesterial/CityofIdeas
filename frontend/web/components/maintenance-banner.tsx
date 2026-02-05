"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api-base";
import { emitMfaRequired, isMfaRequiredMessage } from "@/lib/mfa-required";

const BANNER_HEIGHT_PX = 32;

const readFlag = (payload: unknown): boolean | null => {
  if (typeof payload === "boolean") {
    return payload;
  }
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const candidates = ["has", "active", "data", "maintenance", "enabled"];
  for (const key of candidates) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value > 0;
    }
  }
  return null;
};

export function MaintenanceBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/maintenance/planned`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          if (response.status === 403) {
            const payload = (await response.json().catch(() => null)) as {
              message?: unknown;
            } | null;
            const message =
              payload && typeof payload === "object" ? payload.message : null;
            if (
              isMfaRequiredMessage(message) ||
              isMfaRequiredMessage(payload)
            ) {
              emitMfaRequired({
                reason: typeof message === "string" ? message : undefined,
              });
            }
          }
          setVisible(false);
          return;
        }

        const payload = (await response.json().catch(() => null)) as unknown;
        const planned = readFlag(payload);
        setVisible(Boolean(planned));
      } catch {
        if (!controller.signal.aborted) {
          setVisible(false);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const height = visible ? `${BANNER_HEIGHT_PX}px` : "0px";
    document.documentElement.style.setProperty(
      "--maintenance-banner-height",
      height,
    );
    return () => {
      document.documentElement.style.setProperty(
        "--maintenance-banner-height",
        "0px",
      );
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed left-0 right-0 top-0 z-[60] h-8 bg-amber-300 text-amber-950">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center gap-2 px-4 text-[11px] font-semibold uppercase tracking-[0.25em] sm:text-xs">
        <span className="h-2 w-2 rounded-full bg-amber-700" />
        Скоро будут технические работы
      </div>
    </div>
  );
}
