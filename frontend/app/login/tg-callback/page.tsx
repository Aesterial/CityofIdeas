"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { useLanguage } from "@/components/language-provider";
import { ApiError, completeTgAuth, setOAuthStateCookie } from "@/lib/api";
import { saveAuthChallenge } from "@/lib/auth-challenge";

export default function TgCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLanguage();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const tgAuthResult =
      hashParams.get("tgAuthResult")?.trim() ||
      params.get("tgAuthResult")?.trim() ||
      "";
    const state = params.get("state")?.trim() ?? "";

    if (!tgAuthResult) {
      setMessage(t("tgCallbackMissing"));
      return;
    }

    // Re-persist the state in the cookie so the gRPC handler can read it.
    if (state) {
      setOAuthStateCookie(state);
    }

    let active = true;
    completeTgAuth(tgAuthResult)
      .then((response) => {
        if (!active) return;
        if (response.status === "challenge") {
          const baseChallenge = response.challenge ?? { type: "unknown" };
          saveAuthChallenge({
            ...baseChallenge,
            loginMethod: "telegram",
            redirectUrl: response.redirectUrl ?? baseChallenge.redirectUrl,
          });
          router.replace("/login/verify");
          return;
        }
        const redirectUrl = response.redirectUrl?.trim() || "/";
        router.replace(redirectUrl);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          setMessage(t("oauthNotLinkedTg"));
          return;
        }
        setMessage(err instanceof Error ? err.message : t("tgCallbackError"));
      });

    return () => {
      active = false;
    };
  }, [params, router, t]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 px-4 pb-12 sm:pt-28 sm:px-6">
        <div className="container mx-auto max-w-lg rounded-3xl border border-border/70 bg-card/90 p-6 text-center shadow-[0_24px_60px_-45px_rgba(0,0,0,0.35)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2AABEE]/10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 text-[#2AABEE]"
              aria-hidden="true"
            >
              <path
                d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold">{t("tgCallbackTitle")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {message ?? t("tgCallbackPending")}
          </p>
          {message ? (
            <button
              type="button"
              onClick={() => router.replace("/auth")}
              className="mt-5 rounded-full border border-border/70 px-5 py-2 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
            >
              {t("backToAuth")}
            </button>
          ) : null}
        </div>
      </main>
    </div>
  );
}
