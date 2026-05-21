"use client";

import type React from "react";

import { useAuth } from "@/components/auth-provider";
import { GradientButton } from "@/components/gradient-button";
import { useLanguage } from "@/components/language-provider";
import { Logo } from "@/components/logo";
import { useTheme } from "@/components/theme-provider";
import { saveAuthChallenge } from "@/lib/auth-challenge";
import { requestPasswordReset, startTgAuth, startVkAuth } from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ClipboardPaste,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Sun,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register" | "forgot"; // | "forgot-password"

const maskEmail = (value: string) => {
  const trimmed = value.trim();
  const [user, domain] = trimmed.split("@");
  if (!domain) {
    return trimmed;
  }
  if (!user) {
    return `***@${domain}`;
  }
  if (user.length <= 2) {
    return `${user[0]}***@${domain}`;
  }
  const middle = "*".repeat(Math.max(1, user.length - 2));
  return `${user[0]}${middle}${user[user.length - 1]}@${domain}`;
};

export default function AuthPage() {
  const router = useRouter();
  const { login, register, status } = useAuth();
  const minWelcomeMs = 700;
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vkLoading, setVkLoading] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const trimmedName = formData.name.trim();
  const trimmedEmail = formData.email.trim();
  const emailHandle = trimmedEmail.includes("@")
    ? trimmedEmail.split("@")[0]
    : trimmedEmail;
  const welcomeName =
    mode === "register"
      ? trimmedName || emailHandle
      : emailHandle || trimmedName;
  const showWelcome =
    isSubmitting && welcomeName.length > 0 && mode !== "forgot";

  const passwordRules = [
    {
      id: "length",
      label: t("passwordRuleLength"),
      test: (value: string) => value.length >= 10,
    },
    {
      id: "lowercase",
      label: t("passwordRuleLowercase"),
      test: (value: string) => /[a-z]/.test(value),
    },
    {
      id: "uppercase",
      label: t("passwordRuleUppercase"),
      test: (value: string) => /[A-Z]/.test(value),
    },
    {
      id: "number",
      label: t("passwordRuleNumber"),
      test: (value: string) => /[0-9]/.test(value),
    },
    {
      id: "symbol",
      label: t("passwordRuleSymbol"),
      test: (value: string) => /[^A-Za-z0-9]/.test(value),
    },
  ];

  const passwordChecks = passwordRules.map((rule) => ({
    ...rule,
    passed: rule.test(formData.password),
  }));
  const passwordScore = passwordChecks.filter((rule) => rule.passed).length;
  const passwordProgress = Math.round(
    (passwordScore / passwordRules.length) * 100,
  );
  const isPasswordStrong = passwordScore === passwordRules.length;
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = formData.email.trim();
    const password = formData.password;
    const name = formData.name.trim();

    if (mode === "forgot") {
      if (!email) {
        setErrorMessage("Please enter your email.");
        return;
      }
      setIsSubmitting(true);
      try {
        await requestPasswordReset({ email });
        setSuccessMessage(t("passwordResetSent"));
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === "register") {
      if (!name || !email || !password) {
        setErrorMessage("Please fill in all fields.");
        return;
      }
      if (!isPasswordStrong) {
        setErrorMessage(t("passwordRequirementsError"));
        return;
      }
      if (password !== formData.confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
    } else if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    const submitStart = Date.now();
    try {
      let redirectUrl: string | undefined = "/";
      if (mode === "login") {
        const result = await login({ usermail: email, password });
        redirectUrl = result.redirectUrl ?? "/";
        if (result.status === "challenge") {
          const elapsed = Date.now() - submitStart;
          if (elapsed < minWelcomeMs) {
            await new Promise((resolve) =>
              setTimeout(resolve, minWelcomeMs - elapsed),
            );
          }
          const baseChallenge = result.challenge ?? { type: "unknown" };
          const resolvedType =
            baseChallenge.type === "unknown" && email
              ? "email"
              : baseChallenge.type;
          saveAuthChallenge({
            ...baseChallenge,
            type: resolvedType,
            loginMethod: "password",
            destination:
              baseChallenge.destination || (email ? maskEmail(email) : ""),
            redirectUrl,
          });
          router.push("/login/verify");
          return;
        }
      } else {
        await register({ username: name, email, password });
      }
      const elapsed = Date.now() - submitStart;
      if (elapsed < minWelcomeMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, minWelcomeMs - elapsed),
        );
      }
      router.push(redirectUrl || "/");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVkLogin = async () => {
    setErrorMessage(null);
    setVkLoading(true);
    try {
      const { authUrl } = await startVkAuth();
      window.location.assign(authUrl);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t("vkAuthError"));
    } finally {
      setVkLoading(false);
    }
  };

  const handleTgLogin = async () => {
    setErrorMessage(null);
    setTgLoading(true);
    try {
      const { authUrl } = await startTgAuth();
      window.location.assign(authUrl);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t("tgAuthError"));
    } finally {
      setTgLoading(false);
    }
  };

  const copyPassword = async () => {
    if (mode !== "register" || !formData.password || !navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(formData.password);
  };

  const pasteConfirmPassword = async () => {
    if (mode !== "register" || !navigator.clipboard) {
      return;
    }
    const password = await navigator.clipboard.readText();
    setFormData((current) => ({
      ...current,
      confirmPassword: password,
    }));
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-6 relative sm:p-8">
        <motion.button
          onClick={toggleTheme}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground  transition-shadow duration-300 hover:shadow-foreground/20 sm:right-8 sm:top-8 sm:h-11 sm:w-11"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
        </motion.button>
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="mb-8 flex justify-center sm:mb-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/" className="inline-flex justify-center">
              <Logo className="h-12 w-12 sm:h-16 sm:w-16" showText={false} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold mb-3 sm:text-4xl">
              {mode === "forgot"
                ? t("passwordResetTitle")
                : mode === "login"
                  ? t("authorization")
                  : t("registration")}
            </h1>
            <p className="text-sm text-muted-foreground mb-8 sm:text-base">
              {mode === "forgot"
                ? t("passwordResetSubtitle")
                : t("heroSubtitle")}
            </p>
          </motion.div>

          <motion.div
            className="flex bg-muted rounded-2xl p-1 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {["login", "register"].map((m) => {
              const isActive =
                mode === m || (mode === "forgot" && m === "login");
              return (
                <button
                  key={m}
                  onClick={() => setMode(m as AuthMode)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "login" ? t("authorization") : t("registration")}
                </button>
              );
            })}
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {errorMessage ? (
              <div className="rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
            {successMessage ? (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
                {successMessage}
              </div>
            ) : null}
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  key="name"
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-medium mb-2">
                    {t("name")}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t("name")}
                      autoComplete="name"
                      className="w-full bg-card border border-border rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-300 sm:py-4"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <label className="block text-sm font-medium mb-2">
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Email"
                  className="w-full bg-card border border-border rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-300 sm:py-4"
                />
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {mode !== "forgot" && (
                <motion.div
                  key="password"
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <label className="block text-sm font-medium mb-2">
                    {t("password")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="••••••••"
                      autoComplete={
                        mode === "register" ? "new-password" : "current-password"
                      }
                      className="w-full bg-card border border-border rounded-2xl py-3 pl-12 pr-24 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-300 sm:py-4"
                    />
                    {mode === "register" ? (
                      <button
                        type="button"
                        onClick={() => void copyPassword()}
                        disabled={!formData.password}
                        className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                        aria-label="Copy password"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {mode === "login" ? (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground"
                      >
                        {t("forgotPassword")}
                      </button>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  key="passwordChecklist"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-border/60 bg-background/70 px-4 py-4 sm:px-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      {t("passwordChecklistTitle")}
                    </p>
                    <span
                      className={`text-xs font-semibold ${
                        isPasswordStrong
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {passwordScore}/{passwordRules.length}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={`h-full ${isPasswordStrong ? "bg-emerald-500" : "bg-foreground"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordProgress}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                    {passwordChecks.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-2 font-semibold"
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            rule.passed
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                              : "border-border/70 text-muted-foreground"
                          }`}
                        >
                          {rule.passed ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span
                          className={
                            rule.passed
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {rule.label}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 font-semibold">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          passwordsMatch
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                            : "border-border/70 text-muted-foreground"
                        }`}
                      >
                        {passwordsMatch ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span
                        className={
                          passwordsMatch
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {t("passwordRuleMatch")}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  key="confirmPassword"
                  variants={inputVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-medium mb-2">
                    {t("confirmPassword")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full bg-card border border-border rounded-2xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-300 sm:py-4"
                    />
                    <button
                      type="button"
                      onClick={() => void pasteConfirmPassword()}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-300 hover:text-foreground"
                      aria-label="Paste password"
                    >
                      <ClipboardPaste className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-2 sm:pt-4"
            >
              <GradientButton
                type="submit"
                className="w-full flex items-center justify-center gap-3"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Loading..."
                  : mode === "login"
                    ? t("login")
                    : mode === "register"
                      ? t("register")
                      : t("passwordResetAction")}
                <ArrowRight className="w-5 h-5" />
              </GradientButton>
            </motion.div>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">или</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <motion.div
            className="space-y-2 sm:space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >

            <button
              type="button"
              onClick={() => void handleTgLogin()}
              disabled={tgLoading}
              className="w-full bg-card border border-border rounded-2xl py-3 px-6 text-sm font-medium hover:bg-muted transition-colors duration-300 flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-60 sm:py-4 sm:text-base"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 shrink-0 text-[#2AABEE]"
                aria-hidden="true"
              >
                <path
                  d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"
                  fill="currentColor"
                />
              </svg>
              <span>{tgLoading ? "..." : "Telegram"}</span>
            </button>


            <button
              type="button"
              onClick={() => void handleVkLogin()}
              disabled={vkLoading}
              className="w-full bg-card border border-border rounded-2xl py-3 px-6 text-sm font-medium hover:bg-muted transition-colors duration-300 flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:opacity-60 sm:py-4 sm:text-base"
            >

              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M0 23.04C0 12.1788 0 6.74826 3.37413 3.37413C6.74826 0 12.1788 0 23.04 0H24.96C35.8212 0 41.2517 0 44.6259 3.37413C48 6.74826 48 12.1788 48 23.04V24.96C48 35.8212 48 41.2517 44.6259 44.6259C41.2517 48 35.8212 48 24.96 48H23.04C12.1788 48 6.74826 48 3.37413 44.6259C0 41.2517 0 35.8212 0 24.96V23.04Z"
                  fill="#0077FF"
                />
                <path
                  d="M25.54 34.5801C14.6 34.5801 8.3601 27.0801 8.1001 14.6001H13.5801C13.7601 23.7601 17.8 27.6401 21 28.4401V14.6001H26.1602V22.5001C29.3202 22.1601 32.6398 18.5601 33.7598 14.6001H38.9199C38.0599 19.4801 34.4599 23.0801 31.8999 24.5601C34.4599 25.7601 38.5601 28.9001 40.1201 34.5801H34.4399C33.2199 30.7801 30.1802 27.8401 26.1602 27.4401V34.5801H25.54Z"
                  fill="white"
                />
              </svg>
              <span>{vkLoading ? "..." : "VK"}</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
      <AnimatePresence>
        {showWelcome ? (
          <motion.div
            key="welcome-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl border border-white/20 bg-black px-6 py-7 text-center text-white shadow-[0_25px_80px_rgba(0,0,0,0.65)]"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-live="polite"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                {mode === "login" ? t("authorization") : t("registration")}
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {t("welcome")}, {welcomeName}
              </p>
              <p className="mt-2 text-sm text-white/70">
                {t("welcomeSubtitle")}
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                {[0, 1, 2].map((index) => (
                  <motion.span
                    key={index}
                    className="h-2 w-2 rounded-full bg-white"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
