"use client";

import { useEffect, useState } from "react";
import { fetchMaintenancePlanned } from "@/lib/api";

const BANNER_HEIGHT_PX = 32;

export function MaintenanceBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const planned = await fetchMaintenancePlanned({
          signal: controller.signal,
        });
        setVisible(planned);
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
