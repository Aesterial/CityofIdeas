"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, MailCheck, Moon, Sun, XCircle } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { Logo } from "@/components/logo";
import { useTheme } from "@/components/theme-provider";
import { requestEmailVerification, verifyEmail } from "@/lib/api";

type VerificationState =
  | "idle"
  | "sending"
  | "verifying"
  | "sent"
  | "success"
  | "error";

export function EmailVerifyView() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<VerificationState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const autoVerificationTriggered = useRef(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  const runVerification = useCallback(
    async (verificationToken: string) => {
      const normalizedToken = verificationToken.trim();

      if (!normalizedToken) {
        setStatus("error");
        setErrorMessage(t("emailVerifyTokenMissing"));
        return;
      }

      setStatus("verifying");
      setErrorMessage(null);

      try {
        await verifyEmail({ token: normalizedToken });
        setStatus("success");
        redirectTimer.current = setTimeout(() => {
          router.replace("/");
        }, 900);
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : t("emailVerifyError"),
        );
      }
    },
    [router, t],
  );

  const sendVerificationEmail = useCallback(async () => {
    if (!user?.email) {
      setStatus("error");
      setErrorMessage(t("accountEmailVerifyMissing"));
      return;
    }

    setStatus("sending");
    setErrorMessage(null);
    try {
      await requestEmailVerification({ email: user.email });
      setStatus("sent");
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/verify-email?sent=1");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : t("emailVerifyError"),
      );
    }
  }, [t, user]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    const nextToken =
      hashParams.get("token") || searchParams.get("token") || "";
    const isSentRedirect = searchParams.get("sent") === "1";
    if (autoVerificationTriggered.current) {
      return;
    }
    autoVerificationTriggered.current = true;
    if (!nextToken.trim() && isSentRedirect) {
      setStatus("sent");
      return;
    }
    if (!nextToken.trim()) {
      setStatus("idle");
      return;
    }
    void runVerification(nextToken);
  }, [runVerification]);

  const isVerifying = status === "verifying";
  const isSending = status === "sending";
  const title =
    status === "success" ? t("emailVerifySuccess") : t("emailVerifyTitle");
  const subtitle =
    status === "success"
      ? t("heroSubtitle")
      : status === "sent"
        ? t("accountEmailVerifySent")
      : status === "idle"
        ? t("emailVerifySubtitle")
      : status === "error"
        ? t("userProfileNotFoundSubtitle")
        : t("emailVerifySubtitle");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative flex min-h-screen items-center justify-center px-5 py-16 sm:px-8">
          <button
            type="button"
            onClick={toggleTheme}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/85 text-foreground shadow-lg shadow-foreground/10 backdrop-blur transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-foreground/20 hover:shadow-foreground/15 active:scale-[0.97] sm:right-8 sm:top-8"
            aria-label="Toggle theme"
          >
            {mounted ? (
              theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )
            ) : (
              <span className="block h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <motion.div
            className="w-full max-w-[420px]"
            initial={{ opacity: 0, transform: "translateY(12px)" }}
            animate={{ opacity: 1, transform: "translateY(0)" }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          >
            <Link
              href="/"
              className="mb-10 inline-flex transition-opacity duration-150 ease-out hover:opacity-80"
              aria-label={t("cityOfIdeas")}
            >
              <Logo className="h-12 w-12 sm:h-14 sm:w-14" showText={false} />
            </Link>

            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-card shadow-sm">
              {status === "success" ? (
                <Check className="h-7 w-7 text-emerald-500" />
              ) : status === "error" ? (
                <XCircle className="h-7 w-7 text-destructive" />
              ) : (
                <MailCheck className="h-7 w-7 text-foreground" />
              )}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {title}
              </h1>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            </div>

            <div className="mt-8 min-h-14">
              {isVerifying ? (
                <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-foreground" />
                  Loading...
                </div>
              ) : null}

              {isSending ? (
                <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-foreground" />
                  {t("accountEmailVerifySending")}
                </div>
              ) : null}

              {status === "success" ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                  {t("emailVerifySuccess")}
                </div>
              ) : null}

              {status === "error" && errorMessage ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              {status === "idle" || status === "sent" ? (
                <button
                  type="button"
                  onClick={() => void sendVerificationEmail()}
                  disabled={isSending}
                  className="inline-flex h-10 items-center rounded-full bg-foreground px-5 font-medium text-background transition-transform duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
                >
                  {t("emailVerifyAction")}
                </button>
              ) : null}
              {status === "error" ? (
                <button
                  type="button"
                  onClick={() => {
                    autoVerificationTriggered.current = false;
                    if (typeof window !== "undefined") {
                      const hashParams = new URLSearchParams(
                        window.location.hash.slice(1),
                      );
                      const searchParams = new URLSearchParams(
                        window.location.search,
                      );
                      void runVerification(
                        hashParams.get("token") ||
                          searchParams.get("token") ||
                          "",
                      );
                    }
                  }}
                  className="inline-flex h-10 items-center rounded-full bg-foreground px-5 font-medium text-background transition-transform duration-150 ease-out active:scale-[0.97]"
                >
                  {t("emailVerifyAction")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => router.push("/auth")}
                className="inline-flex h-10 items-center rounded-full px-1 font-medium text-foreground transition-opacity duration-150 ease-out hover:opacity-70"
              >
                {t("authCodeBack")}
              </button>
            </div>
          </motion.div>
      </div>
    </main>
  );
}
