"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { useLanguage } from "@/components/language-provider";
import { ApiError, completeVkAuth } from "@/lib/api";
import { saveAuthChallenge } from "@/lib/auth-challenge";

export default function VkCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLanguage();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code")?.trim() ?? "";
    const state = params.get("state")?.trim() ?? "";
    if (!code || !state) {
      setMessage(t("vkCallbackMissing"));
      return;
    }
    let active = true;
    completeVkAuth(code, state)
      .then((response) => {
        if (!active) {
          return;
        }
        if (response.status === "challenge") {
          const baseChallenge = response.challenge ?? { type: "unknown" };
          saveAuthChallenge({
            ...baseChallenge,
            loginMethod: "vk",
            redirectUrl: response.redirectUrl ?? baseChallenge.redirectUrl,
          });
          router.replace("/login/verify");
          return;
        }
        const redirectUrl = response.redirectUrl?.trim() || "/";
        router.replace(redirectUrl);
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setMessage(t("oauthNotLinkedVk"));
          return;
        }
        setMessage(err instanceof Error ? err.message : t("vkCallbackError"));
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
          <h1 className="text-2xl font-semibold">{t("vkCallbackTitle")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {message ?? t("vkCallbackPending")}
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
