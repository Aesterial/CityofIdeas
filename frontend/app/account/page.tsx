"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  Clock3,
  Fingerprint,
  KeyRound,
  LogOut,
  Mail,
  MonitorCheck,
  PencilLine,
  RotateCw,
  Shield,
  Sparkles,
  Trash2,
  User,
  XIcon,
} from "lucide-react";
import { Header } from "@/components/header";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { getRankGlowStyle } from "@/lib/rank-colors";
import { GradientButton } from "@/components/gradient-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchUserSessions,
  confirmTotpEnrollment,
  disableTotp,
  revokeUserSession,
  requestEmailVerification,
  startTotpEnrollment,
  type TotpEnrollment,
  type UserSession,
} from "@/lib/api";

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const PROFILE_DESCRIPTION_MAX_LENGTH = 256;
const SESSION_HASH_TRIMMED_LENGTH = 30;

const getLocaleByLanguage = (language: string) => {
  if (language === "RU") {
    return "ru-RU";
  }
  if (language === "KZ") {
    return "kk-KZ";
  }
  return "en-US";
};

const formatSessionHash = (hash?: string) => {
  if (!hash) {
    return null;
  }
  if (hash.length <= SESSION_HASH_TRIMMED_LENGTH) {
    return hash;
  }
  return `${hash.slice(0, 14)}...${hash.slice(-8)}`;
};

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

type AccountTab = "profile" | "security" | "sessions" | "editor";

export default function AccountPage() {
  const router = useRouter();
  const {
    user,
    status,
    refreshUser,
    updateDisplayName,
    updateProfileDescription,
    updateAvatar,
    deleteAvatar,
    deleteProfile,
  } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [displayName, setDisplayName] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [draftDisplayName, setDraftDisplayName] = useState("");
  const [draftProfileDescription, setDraftProfileDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [avatarAction, setAvatarAction] = useState<"upload" | "reset" | null>(
    null,
  );
  const [deleteDescriptionLoading, setDeleteDescriptionLoading] =
    useState(false);
  const [deleteProfileOpen, setDeleteProfileOpen] = useState(false);
  const [deleteProfileInput, setDeleteProfileInput] = useState("");
  const [deleteProfileError, setDeleteProfileError] = useState<string | null>(
    null,
  );
  const [deleteProfileLoading, setDeleteProfileLoading] = useState(false);
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [emailVerifyError, setEmailVerifyError] = useState<string | null>(null);
  const [emailVerifySuccess, setEmailVerifySuccess] = useState<string | null>(
    null,
  );
  const [totpSetup, setTotpSetup] = useState<TotpEnrollment | null>(null);
  const [totpSetupOpen, setTotpSetupOpen] = useState(false);
  const [totpRecoveryCodes, setTotpRecoveryCodes] = useState<string[]>([]);
  const [totpRecoveryRevealed, setTotpRecoveryRevealed] = useState(false);
  const [totpEnableCode, setTotpEnableCode] = useState("");
  const [totpDisableCode, setTotpDisableCode] = useState("");
  const [totpAction, setTotpAction] = useState<
    "start" | "confirm" | "disable" | null
  >(null);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpSuccess, setTotpSuccess] = useState<string | null>(null);
  const [totpDisableOpen, setTotpDisableOpen] = useState(false);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionActionId, setSessionActionId] = useState<string | null>(null);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [revokedSessionIds, setRevokedSessionIds] = useState<
    Record<string, boolean>
  >({});
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");
  const isAvatarSaving = avatarAction !== null;
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const sessionRemovalTimersRef = useRef<Record<string, number>>({});
  const roleGlowStyle = getRankGlowStyle(user?.rank?.name);
  const languageOptions = [
    { code: "RU" as const, label: "RU" },
    { code: "EN" as const, label: "EN" },
    { code: "KZ" as const, label: "KZ" },
  ];
  const maxAvatarSize = 2 * 1024 * 1024;

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
    setDraftDisplayName(user?.displayName ?? "");
  }, [user?.displayName]);

  useEffect(() => {
    setProfileDescription(user?.description ?? "");
    setDraftProfileDescription(user?.description ?? "");
  }, [user?.description]);

  useEffect(() => {
    if (user?.emailVerified) {
      setEmailVerifyError(null);
      setEmailVerifySuccess(null);
    }
  }, [user?.emailVerified]);

  useEffect(() => {
    if (user?.totpEnabled && totpRecoveryCodes.length === 0) {
      setTotpSetup(null);
      setTotpEnableCode("");
    }
  }, [user?.totpEnabled, totpRecoveryCodes.length]);

  const clearSessionRemovalTimers = useCallback(() => {
    Object.values(sessionRemovalTimersRef.current).forEach((timer) => {
      window.clearTimeout(timer);
    });
    sessionRemovalTimersRef.current = {};
  }, []);

  useEffect(() => {
    return () => {
      clearSessionRemovalTimers();
    };
  }, [clearSessionRemovalTimers]);

  const loadUserSessions = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      setSessionsLoading(true);
      setSessionsError(null);
      try {
        const list = await fetchUserSessions({ signal: options?.signal });
        if (options?.signal?.aborted) {
          return;
        }
        setSessions(list);
      } catch (err) {
        if (isAbortError(err) || options?.signal?.aborted) {
          return;
        }
        setSessionsError(
          err instanceof Error ? err.message : t("accountSessionsLoadError"),
        );
      } finally {
        if (!options?.signal?.aborted) {
          setSessionsLoading(false);
        }
      }
    },
    [t],
  );

  const handleSessionRevoke = useCallback(
    async (sessionId: string) => {
      if (sessionRemovalTimersRef.current[sessionId]) {
        return;
      }
      setSessionsError(null);
      setSessionActionId(sessionId);
      try {
        await revokeUserSession(sessionId);
        setRevokedSessionIds((prev) => ({ ...prev, [sessionId]: true }));
        sessionRemovalTimersRef.current[sessionId] = window.setTimeout(() => {
          setSessions((prev) =>
            prev.filter((session) => session.id !== sessionId),
          );
          setRevokedSessionIds((prev) => {
            const next = { ...prev };
            delete next[sessionId];
            return next;
          });
          delete sessionRemovalTimersRef.current[sessionId];
          void loadUserSessions();
        }, 1300);
      } catch (err) {
        setSessionsError(
          err instanceof Error ? err.message : t("accountSessionsRevokeError"),
        );
      } finally {
        setSessionActionId(null);
      }
    },
    [t, loadUserSessions],
  );

  useEffect(() => {
    if (!user || status !== "authenticated") {
      clearSessionRemovalTimers();
      setSessions([]);
      setSessionsError(null);
      setSessionActionId(null);
      setRevokedSessionIds({});
      setSessionsLoading(false);
      return;
    }
    clearSessionRemovalTimers();
    setRevokedSessionIds({});
    const controller = new AbortController();
    void loadUserSessions({ signal: controller.signal });
    return () => controller.abort();
  }, [user?.uid, status, loadUserSessions, clearSessionRemovalTimers]);

  const handleAvatarSelect = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setAvatarError(null);
    setAvatarSuccess(null);

    if (!file.type.startsWith("image/")) {
      setAvatarError(t("accountAvatarErrorType"));
      event.target.value = "";
      return;
    }

    if (file.size > maxAvatarSize) {
      setAvatarError(t("accountAvatarErrorSize"));
      event.target.value = "";
      return;
    }

    if (!user) {
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarAction("upload");
    try {
      await updateAvatar({ userId: user.uid, file, contentType: file.type });
      setAvatarSuccess(t("accountAvatarSuccess"));
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : t("accountAvatarErrorUpload"),
      );
    } finally {
      setAvatarAction(null);
      setAvatarPreview(null);
      URL.revokeObjectURL(previewUrl);
    }
    event.target.value = "";
  };

  const handleAvatarReset = async () => {
    if (!user) {
      return;
    }
    setAvatarError(null);
    setAvatarSuccess(null);
    setAvatarAction("reset");
    try {
      await deleteAvatar();
      setAvatarSuccess(t("accountAvatarResetSuccess"));
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : t("accountAvatarErrorUpload"),
      );
    } finally {
      setAvatarAction(null);
      setAvatarPreview(null);
    }
  };

  const openProfileEditor = () => {
    setDraftDisplayName(displayName);
    setDraftProfileDescription(profileDescription);
    setErrorMessage(null);
    setProfileEditorOpen(true);
  };

  const handleProfileSave = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user) {
      return;
    }

    const nextName = draftDisplayName.trim();
    const nextDescription = draftProfileDescription
      .trim()
      .slice(0, PROFILE_DESCRIPTION_MAX_LENGTH);
    const currentName = (user.displayName ?? "").trim();
    const currentDescription = (user.description ?? "").trim();
    const nameChanged = nextName !== currentName;
    const descriptionChanged = nextDescription !== currentDescription;

    if (!nameChanged && !descriptionChanged) {
      return;
    }

    if (nameChanged && !nextName) {
      setErrorMessage(t("accountDisplayNameEmpty"));
      return;
    }

    setIsSaving(true);
    try {
      if (nameChanged) {
        await updateDisplayName(nextName);
      }
      if (descriptionChanged) {
        await updateProfileDescription(nextDescription);
      }
      setDisplayName(nextName);
      setProfileDescription(nextDescription);
      setProfileEditorOpen(false);
      setSuccessMessage(t("accountProfileSaved"));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : t("accountProfileError"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDisplayName = () => {
    if (!user) {
      return;
    }
    const fallbackName = user.username?.trim();
    if (!fallbackName) {
      return;
    }
    setErrorMessage(null);
    setDraftDisplayName(fallbackName);
  };

  const handleDeleteDescription = async () => {
    if (!user) {
      return;
    }
    if (!profileDescription.trim()) {
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setDeleteDescriptionLoading(true);
    try {
      await updateProfileDescription("");
      setProfileDescription("");
      setSuccessMessage(t("accountDescriptionDeleted"));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : t("accountProfileError"),
      );
    } finally {
      setDeleteDescriptionLoading(false);
    }
  };

  const handleConfirmDeleteProfile = async () => {
    if (!user) {
      return;
    }
    if (deleteProfileInput.trim() !== user.username) {
      setDeleteProfileError(t("accountDeleteProfileMismatch"));
      return;
    }
    setDeleteProfileError(null);
    setDeleteProfileLoading(true);
    try {
      await deleteProfile();
      router.replace("/");
    } catch (err) {
      setDeleteProfileError(
        err instanceof Error ? err.message : t("accountDeleteProfileError"),
      );
    } finally {
      setDeleteProfileLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!user?.email) {
      setEmailVerifyError(t("accountEmailVerifyMissing"));
      return;
    }
    setEmailVerifyError(null);
    setEmailVerifySuccess(null);
    setEmailVerifyLoading(true);
    try {
      await requestEmailVerification({ email: user.email });
      setEmailVerifySuccess(t("accountEmailVerifySent"));
    } catch (err) {
      setEmailVerifyError(
        err instanceof Error ? err.message : t("emailVerifyError"),
      );
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const handleTotpStart = async () => {
    setTotpError(null);
    setTotpSuccess(null);
    setTotpRecoveryCodes([]);
    setTotpRecoveryRevealed(false);
    setTotpSetupOpen(true);
    setTotpAction("start");
    try {
      const setup = await startTotpEnrollment();
      setTotpSetup(setup);
    } catch (err) {
      setTotpError(
        err instanceof Error ? err.message : t("accountTotpSetupError"),
      );
    } finally {
      setTotpAction(null);
    }
  };

  const handleTotpConfirm = async () => {
    if (!totpEnableCode.trim()) {
      setTotpError(t("authCodeError"));
      return;
    }
    setTotpError(null);
    setTotpSuccess(null);
    setTotpAction("confirm");
    try {
      const result = await confirmTotpEnrollment({
        code: totpEnableCode,
        token: totpSetup?.token,
      });
      setTotpSuccess(t("accountTotpSetupSuccess"));
      setTotpRecoveryCodes(result.recoveryCodes);
      setTotpRecoveryRevealed(false);
      setTotpSetup(null);
      setTotpEnableCode("");
      await refreshUser({ silent: true });
    } catch (err) {
      setTotpError(
        err instanceof Error ? err.message : t("accountTotpSetupError"),
      );
    } finally {
      setTotpAction(null);
    }
  };

  const handleTotpDisable = async () => {
    if (!totpDisableCode.trim()) {
      setTotpError(t("accountTotpDisableHint"));
      return;
    }
    setTotpError(null);
    setTotpSuccess(null);
    setTotpAction("disable");
    try {
      await disableTotp({ code: totpDisableCode });
      setTotpSuccess(t("accountTotpDisableSuccess"));
      setTotpDisableCode("");
      setTotpDisableOpen(false);
      await refreshUser({ silent: true });
    } catch (err) {
      setTotpError(
        err instanceof Error ? err.message : t("accountTotpSetupError"),
      );
    } finally {
      setTotpAction(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 px-4 sm:pt-28 sm:px-6">
          <div className="container mx-auto max-w-3xl">
            <div className="h-24 rounded-3xl bg-muted/70 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const nameForAvatar = displayName.trim() || user.username || "User";
  const initials = getInitials(nameForAvatar);
  const storedAvatarSrc =
    user.avatar?.url ||
    (user.avatar?.contentType && user.avatar?.data
      ? `data:${user.avatar.contentType};base64,${user.avatar.data}`
      : null);
  const avatarSrc = avatarPreview || storedAvatarSrc;
  const canResetAvatar = Boolean(storedAvatarSrc);
  const canResetDisplayName =
    Boolean(user.username) && draftDisplayName.trim() !== user.username;
  const canDeleteDescription = Boolean(profileDescription.trim());
  const hasProfileDraftChanges =
    draftDisplayName.trim() !== (user.displayName ?? "").trim() ||
    draftProfileDescription.trim() !== (user.description ?? "").trim();
  const previewName = draftDisplayName.trim() || user.username || "User";
  const previewDescription = draftProfileDescription.trim();
  const previewInitials = getInitials(previewName);
  const isDeleteProfileMatch = deleteProfileInput.trim() === user.username;
  const isEmailVerified = Boolean(user.emailVerified);
  const isTotpEnabled = Boolean(user.totpEnabled);
  const totpQrBase64 = totpSetup?.qrBase64;
  const totpManualUrl = totpSetup?.manualUrl ?? totpSetup?.otpauthUrl;
  const totpSecret = totpSetup?.secret;
  const isTotpBusy = totpAction !== null;
  const totpLength = Math.min(Math.max(totpSetup?.digits ?? 6, 4), 10);
  const totpQrImage = totpQrBase64
    ? totpQrBase64.startsWith("data:")
      ? totpQrBase64
      : `data:image/png;base64,${totpQrBase64}`
    : null;
  const sessionLocale = getLocaleByLanguage(language);
  const sessionDateFormatter = new Intl.DateTimeFormat(sessionLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const formatSessionDate = (value?: string) => {
    if (!value) {
      return t("accountSessionsUnknown");
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return t("accountSessionsUnknown");
    }
    return sessionDateFormatter.format(parsed);
  };
  const sessionsBusy = sessionsLoading || sessionActionId !== null;

  const renderSessionCard = (session: UserSession) => {
    const isRevoking = sessionActionId === session.id;
    const isRevoked = Boolean(revokedSessionIds[session.id]);
    const hash = formatSessionHash(session.hash);

    return (
      <div
        className={`group relative overflow-hidden rounded-[1.55rem] border p-4 shadow-[0_18px_54px_-42px_rgba(0,0,0,0.82)] transition-all duration-300 ${
          isRevoked
            ? "border-muted-foreground/30 bg-muted/54 opacity-75"
            : "border-border/70 bg-card/82 hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-card"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(320px_circle_at_0%_0%,hsl(var(--foreground)/0.08),transparent_46%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="relative flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/70">
                <MonitorCheck className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {t("accountSessionsTitle")}
                </p>
                <code className="block truncate text-[11px] font-semibold text-muted-foreground">
                  {session.id}
                </code>
              </div>
            </div>
          </div>

          {isRevoked ? (
            <span className="relative rounded-full border border-muted-foreground/30 bg-muted/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
              {t("accountSessionsEnded")}
            </span>
          ) : (
            <button
              type="button"
              className="relative inline-flex items-center gap-2 rounded-full border border-foreground bg-foreground px-4 py-2 text-xs font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void handleSessionRevoke(session.id)}
              disabled={isRevoking || sessionsLoading}
            >
              {isRevoking ? (
                <span className="inline-flex items-center gap-1.5">
                  <RotateCw className="h-3 w-3 animate-spin" />
                  {t("accountSessionsRevoking")}
                </span>
              ) : (
                <>
                  <LogOut className="h-3.5 w-3.5" />
                  {t("accountSessionsRevoke")}
                </>
              )}
            </button>
          )}
        </div>

        <div className="relative mt-4 grid gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/64 px-3 py-2.5 shadow-inner">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <Fingerprint className="h-3 w-3" />
              {t("accountSessionsDeviceHash")}
            </span>
            <code className="mt-1 block truncate font-semibold text-foreground" title={session.hash}>
              {hash ?? t("accountSessionsUnknown")}
            </code>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/64 px-3 py-2.5 shadow-inner">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <Clock3 className="h-3 w-3" />
              {t("accountSessionsCreated")}
            </span>
            <p className="mt-1 font-semibold text-foreground">
              {formatSessionDate(session.createdAt)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/64 px-3 py-2.5 shadow-inner">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <Clock3 className="h-3 w-3" />
              {t("accountSessionsLastSeen")}
            </span>
            <p className="mt-1 font-semibold text-foreground">
              {formatSessionDate(session.lastSeenAt)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_16%_12%,hsl(var(--foreground)/0.08),transparent_30%),radial-gradient(circle_at_86%_14%,hsl(var(--foreground)/0.06),transparent_26%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.24)_48%,hsl(var(--background)))]">
      <Header />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.16)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.12)_1px,transparent_1px)] bg-[size:76px_76px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
      </div>

      <main className="relative px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
        <div className="container mx-auto max-w-6xl space-y-8">
          <motion.div
            className="relative overflow-hidden rounded-[2.6rem] border border-border/70 bg-background/76 p-6 shadow-[0_36px_110px_-78px_rgba(0,0,0,0.92)] backdrop-blur-xl sm:p-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_circle_at_12%_0%,hsl(var(--foreground)/0.12),transparent_48%)]" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/76 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Account control
              </span>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.9] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                {t("accountSettings")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {t("accountSettingsSubtitle")}
              </p>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[19rem_1fr] lg:items-start">
            <motion.aside
              className="lg:sticky lg:top-28"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/82 p-5 shadow-[0_30px_90px_-62px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_circle_at_0%_0%,hsl(var(--foreground)/0.1),transparent_46%)]" />
                <div className="relative flex items-center gap-4">
                  <Avatar className="h-16 w-16 border border-border/70 shadow-[0_18px_44px_-30px_rgba(0,0,0,0.8)]">
                    {avatarSrc ? (
                      <AvatarImage src={avatarSrc} alt={nameForAvatar} />
                    ) : null}
                    <AvatarFallback className="text-lg font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-semibold">
                        {user.displayName || user.username}
                      </p>
                      {user.rank?.name ? (
                        <span
                          className="inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground"
                          style={roleGlowStyle ?? undefined}
                        >
                          {user.rank.name}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <nav className="relative mt-6 grid gap-2" aria-label="Account settings">
                  {[
                    { id: "profile" as const, label: t("accountSettings"), icon: User },
                    { id: "security" as const, label: t("accountSecurityTitle"), icon: KeyRound },
                    { id: "sessions" as const, label: t("accountSessionsTitle"), icon: MonitorCheck },
                    { id: "editor" as const, label: "Редактор", icon: PencilLine },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all duration-300 ${
                          isActive
                            ? "border-foreground bg-foreground text-background shadow-[0_18px_42px_-30px_hsl(var(--foreground)/0.55)]"
                            : "border-border/60 bg-background/54 text-foreground hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-background"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </motion.aside>

            <div className="min-w-0 space-y-6">

          {activeTab === "profile" ? (
          <motion.div
            key="profile-tab"
            className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/82 p-6 shadow-[0_30px_90px_-62px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(460px_circle_at_0%_0%,hsl(var(--foreground)/0.08),transparent_46%)]" />
            <div className="relative">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="h-16 w-16 border border-border/70 shadow-[0_18px_44px_-30px_rgba(0,0,0,0.8)]">
                {avatarSrc ? (
                  <AvatarImage src={avatarSrc} alt={nameForAvatar} />
                ) : null}
                <AvatarFallback className="text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">
                  {user.displayName || user.username}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("userIdLabel")}: {user.uid}
                </p>
              </div>
              <div className="w-full sm:w-auto sm:ml-auto">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  <GradientButton
                    type="button"
                    className="w-full justify-center shadow-[0_18px_44px_-28px_rgba(0,0,0,0.75)] sm:w-auto"
                    onClick={handleAvatarSelect}
                    disabled={isAvatarSaving}
                  >
                    <Camera className="h-4 w-4" />
                    {avatarAction === "upload"
                      ? t("accountAvatarUploading")
                      : t("accountAvatarChange")}
                  </GradientButton>
                  {canResetAvatar ? (
                    <button
                      type="button"
                      className="w-full rounded-full border border-border/70 bg-background/60 px-4 py-3 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-foreground hover:text-background sm:w-auto"
                      onClick={() => void handleAvatarReset()}
                      disabled={isAvatarSaving}
                    >
                      {avatarAction === "reset"
                        ? t("accountAvatarResetting")
                        : t("accountAvatarReset")}
                    </button>
                  ) : null}
                </div>
                {avatarError ? (
                  <p className="mt-2 text-xs text-destructive">{avatarError}</p>
                ) : null}
                {avatarSuccess ? (
                  <p className="mt-2 text-xs text-foreground">
                    {avatarSuccess}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 rounded-[1.6rem] border border-rose-500/25 bg-rose-500/8 p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-rose-500">
                <Trash2 className="h-3.5 w-3.5" />
                {t("accountDangerZone")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("accountDangerHint")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="w-full rounded-full border border-rose-500/35 bg-background/60 px-4 py-2 text-xs font-semibold text-rose-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  onClick={() => void handleDeleteDescription()}
                  disabled={deleteDescriptionLoading || !canDeleteDescription}
                >
                  {deleteDescriptionLoading
                    ? t("accountDescriptionDeleting")
                    : t("accountDescriptionDelete")}
                </button>
                <button
                  type="button"
                  className="w-full rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_18px_44px_-28px_rgba(225,29,72,0.85)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  onClick={() => {
                    setDeleteProfileInput("");
                    setDeleteProfileError(null);
                    setDeleteProfileOpen(true);
                  }}
                  disabled={deleteProfileLoading}
                >
                  {deleteProfileLoading
                    ? t("accountProfileDeleting")
                    : t("accountProfileDelete")}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {t("usernameLabel")}: {user.username}
                </span>
              </div>
              {user.email ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>
                    {t("emailLabel")}: {user.email}
                  </span>
                </div>
              ) : null}
              {user.rank?.name ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span className="flex items-center gap-2">
                    {t("roleLabel")}:
                    <span
                      className="rounded-full border px-2 py-0.5 text-xs font-semibold text-foreground"
                      style={roleGlowStyle ?? undefined}
                    >
                      {user.rank.name}
                    </span>
                  </span>
                </div>
              ) : null}
            </div>
            </div>
          </motion.div>
          ) : null}

          {activeTab === "security" ? (
          <motion.div
            key="security-tab"
            className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/82 p-6 shadow-[0_30px_90px_-62px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(460px_circle_at_0%_0%,hsl(var(--foreground)/0.08),transparent_46%)]" />
            <div className="relative">
            <div>
              <h2 className="text-xl font-semibold">
                {t("accountSecurityTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("accountSecuritySubtitle")}
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.6rem] border border-border/60 bg-background/64 p-4 shadow-inner">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {t("accountEmailVerificationTitle")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email ?? t("accountEmailVerifyMissing")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      isEmailVerified
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {isEmailVerified
                      ? t("accountEmailVerified")
                      : t("accountEmailNotVerified")}
                  </span>
                </div>
                {!isEmailVerified ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <GradientButton
                      type="button"
                      className="px-5 py-2 text-xs sm:text-sm"
                      onClick={() => void handleSendVerificationEmail()}
                      disabled={emailVerifyLoading}
                    >
                      {emailVerifyLoading
                        ? t("accountEmailVerifySending")
                        : t("accountEmailVerifyAction")}
                    </GradientButton>
                  </div>
                ) : null}
                {emailVerifyError ? (
                  <p className="mt-2 text-xs text-destructive">
                    {emailVerifyError}
                  </p>
                ) : null}
                {emailVerifySuccess ? (
                  <p className="mt-2 text-xs text-foreground">
                    {emailVerifySuccess}
                  </p>
                ) : null}
              </div>

              <div className="rounded-[1.6rem] border border-border/60 bg-background/64 p-4 shadow-inner">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {t("accountTotpTitle")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("accountTotpSubtitle")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      isTotpEnabled
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                        : "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {isTotpEnabled
                      ? t("accountTotpEnabled")
                      : t("accountTotpDisabled")}
                  </span>
                </div>

                {!isTotpEnabled ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <GradientButton
                      type="button"
                      className="px-5 py-2 text-xs sm:text-sm"
                      onClick={() => void handleTotpStart()}
                      disabled={isTotpBusy}
                    >
                      {totpAction === "start"
                        ? t("saving")
                        : t("accountTotpEnableAction")}
                    </GradientButton>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {!totpDisableOpen ? (
                      <GradientButton
                        type="button"
                        className="px-5 py-2 text-xs sm:text-sm"
                        onClick={() => setTotpDisableOpen(true)}
                        disabled={isTotpBusy}
                      >
                        {t("accountTotpDisableAction")}
                      </GradientButton>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          {t("accountTotpDisableHint")}
                        </p>
                        <InputOTP
                          maxLength={6}
                          value={totpDisableCode}
                          onChange={setTotpDisableCode}
                          inputMode="numeric"
                        >
                          <InputOTPGroup className="gap-2">
                            {Array.from({ length: 6 }).map((_, index) => (
                              <InputOTPSlot key={index} index={index} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                        <div className="flex flex-wrap gap-2">
                          <GradientButton
                            type="button"
                            className="px-5 py-2 text-xs sm:text-sm"
                            onClick={() => void handleTotpDisable()}
                            disabled={totpAction === "disable"}
                          >
                            {totpAction === "disable"
                              ? t("saving")
                              : t("accountTotpDisableAction")}
                          </GradientButton>
                          <button
                            type="button"
                            className="rounded-full border border-border/70 px-4 py-2 text-xs font-semibold transition-colors duration-300 hover:bg-foreground hover:text-background"
                            onClick={() => {
                              setTotpDisableOpen(false);
                              setTotpDisableCode("");
                              setTotpError(null);
                            }}
                            disabled={isTotpBusy}
                          >
                            {t("accountTotpCancelAction")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {totpError ? (
                  <p className="mt-3 text-xs text-destructive">{totpError}</p>
                ) : null}
                {totpSuccess ? (
                  <p className="mt-3 text-xs text-foreground">{totpSuccess}</p>
                ) : null}
              </div>
            </div>
            </div>
          </motion.div>
          ) : null}

          {activeTab === "sessions" ? (
          <motion.div
            key="sessions-tab"
            className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/82 p-4 shadow-[0_30px_90px_-62px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(460px_circle_at_0%_0%,hsl(var(--foreground)/0.08),transparent_46%)]" />
            <div className="relative rounded-[1.6rem] border border-border/60 bg-background/64 p-4 shadow-inner sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-xl">
                    <MonitorCheck className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
                    {t("accountSessionsTitle")}
                  </h2>
                  <p className="max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {t("accountSessionsSubtitle")}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-foreground bg-foreground px-3 py-1 text-xs font-semibold text-background">
                  {t("accountSessionsActiveLabel")}: {sessions.length}
                </span>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                {t("accountSessionsCurrentHint")}
              </p>

              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-foreground bg-foreground px-4 py-2 text-xs font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-[13px]"
                  onClick={() => setSessionsDialogOpen(true)}
                  disabled={sessionsBusy}
                >
                  {sessionsLoading
                    ? t("accountSessionsRefreshing")
                    : t("accountSessionsOpen")}
                </button>
              </div>
            </div>

            {sessionsError ? (
              <p className="relative mt-3 px-1 text-xs text-muted-foreground">
                {sessionsError}
              </p>
            ) : null}
          </motion.div>
          ) : null}

          <Dialog open={sessionsDialogOpen} onOpenChange={setSessionsDialogOpen}>
            <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col overflow-hidden rounded-[2rem] border-border/70 bg-background/95 p-3 shadow-[0_40px_120px_-64px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:max-h-[90vh] sm:w-[calc(100vw-2rem)] sm:p-6 lg:max-w-6xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <MonitorCheck className="h-4 w-4 text-muted-foreground" />
                  {t("accountSessionsTitle")}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {t("accountSessionsSubtitle")}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 flex min-h-0 flex-1 flex-col space-y-3">
                <div className="rounded-[1.6rem] border border-border/70 bg-card/82 p-3 shadow-[0_18px_54px_-42px_rgba(0,0,0,0.82)] sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full border border-foreground bg-foreground px-3 py-1 text-xs font-semibold text-background">
                      {t("accountSessionsActiveLabel")}: {sessions.length}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-xs font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => void loadUserSessions()}
                      disabled={sessionsBusy}
                    >
                      <RotateCw className={`h-3.5 w-3.5 ${sessionsLoading ? "animate-spin" : ""}`} />
                      {sessionsLoading
                        ? t("accountSessionsRefreshing")
                        : t("accountSessionsRefresh")}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("accountSessionsCurrentHint")}
                  </p>
                </div>

                {sessionsLoading && sessions.length === 0
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`session-skeleton-${index}`}
                        className="h-28 animate-pulse rounded-[1.55rem] border border-border/70 bg-muted/60"
                      />
                    ))
                  : null}

                {!sessionsLoading && sessions.length === 0 ? (
                  <div className="rounded-[1.55rem] border border-dashed border-border/70 bg-card/64 px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("accountSessionsEmpty")}
                  </div>
                ) : null}

                {sessions.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="-mx-1 flex-1 overflow-y-auto overscroll-contain px-1"
                  >
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.04 } },
                      }}
                      className="space-y-3 pb-2"
                    >
                      {sessions.map((session) => (
                        <motion.div
                          key={session.id}
                          variants={{
                            hidden: { opacity: 0, y: 6 },
                            visible: { opacity: 1, y: 0 },
                          }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {renderSessionCard(session)}
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                ) : null}

                {sessionsError ? (
                  <p className="text-xs text-muted-foreground">
                    {sessionsError}
                  </p>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>

          {activeTab === "editor" ? (
          <motion.div
            key="editor-tab"
            className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/82 p-6 shadow-[0_30px_90px_-62px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(460px_circle_at_0%_0%,hsl(var(--foreground)/0.08),transparent_46%)]" />
            <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Редактирование профиля
                </h2>
                <p className="text-sm text-muted-foreground">
                  Измените отображаемое имя и описание в отдельном окне с
                  превью.
                </p>
              </div>
              <GradientButton
                type="button"
                className="w-full justify-center shadow-[0_18px_44px_-28px_rgba(0,0,0,0.75)] sm:w-auto"
                onClick={openProfileEditor}
              >
                Открыть редактор
              </GradientButton>
            </div>

            <div className="mt-5 rounded-[1.6rem] border border-border/60 bg-background/64 p-4 shadow-inner">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Текущее состояние
              </p>
              <p className="mt-2 text-lg font-semibold">{nameForAvatar}</p>
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {profileDescription.trim() ||
                  t("profileDescriptionPlaceholder")}
              </p>
            </div>

            {errorMessage ? (
              <p className="mt-4 text-sm text-destructive">{errorMessage}</p>
            ) : null}
            {successMessage ? (
              <p className="mt-4 text-sm text-foreground">{successMessage}</p>
            ) : null}
            </div>
          </motion.div>
          ) : null}
            </div>
          </div>
        </div>
      </main>

      <Dialog
        open={profileEditorOpen}
        onOpenChange={(open) => {
          setProfileEditorOpen(open);
          if (!open) {
            setDraftDisplayName(displayName);
            setDraftProfileDescription(profileDescription);
            setErrorMessage(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl overflow-x-hidden overflow-y-auto p-3 sm:max-h-[90vh] sm:w-[calc(100vw-1.5rem)] sm:p-7 lg:max-w-6xl"
        >
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="ring-offset-background focus:ring-ring absolute top-4 right-4 z-20 hidden rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden sm:inline-flex"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>
          <div className="sticky top-0 z-20 -mx-3 -mt-3 mb-2 flex justify-end border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur sm:hidden">
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close"
                className="ring-offset-background focus:ring-ring inline-flex rounded-xs opacity-80 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden"
              >
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </button>
            </DialogClose>
          </div>
          <DialogHeader>
            <DialogTitle>Редактирование профиля</DialogTitle>
            <DialogDescription>
              Слева заполните поля, справа проверьте как профиль увидят другие.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleProfileSave}
            className="grid gap-4 sm:gap-6 md:grid-cols-2"
          >
            <div className="space-y-5">
              <div className="rounded-2xl border border-border/60 bg-background/64 p-4 shadow-inner">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("accountAvatarChange")}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <Avatar className="h-16 w-16 border border-border/70">
                    {avatarSrc ? (
                      <AvatarImage src={avatarSrc} alt={previewName} />
                    ) : null}
                    <AvatarFallback className="text-lg font-semibold">
                      {previewInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-wrap gap-2">
                    <GradientButton
                      type="button"
                      className="px-4 py-2 text-xs"
                      onClick={handleAvatarSelect}
                      disabled={isAvatarSaving}
                    >
                      <Camera className="h-4 w-4" />
                      {avatarAction === "upload"
                        ? t("accountAvatarUploading")
                        : t("accountAvatarChange")}
                    </GradientButton>
                    {canResetAvatar ? (
                      <button
                        type="button"
                        className="rounded-full border border-border/70 bg-background/60 px-4 py-2 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => void handleAvatarReset()}
                        disabled={isAvatarSaving}
                      >
                        {avatarAction === "reset"
                          ? t("accountAvatarResetting")
                          : t("accountAvatarReset")}
                      </button>
                    ) : null}
                  </div>
                </div>
                {avatarError ? (
                  <p className="mt-2 text-xs text-destructive">{avatarError}</p>
                ) : null}
                {avatarSuccess ? (
                  <p className="mt-2 text-xs text-foreground">{avatarSuccess}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium">
                    {t("displayNameLabel")}
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleResetDisplayName}
                    disabled={isSaving || !canResetDisplayName}
                  >
                    {t("displayNameReset")}
                  </button>
                </div>
                <input
                  type="text"
                  value={draftDisplayName}
                  onChange={(event) =>
                    setDraftDisplayName(event.target.value.slice(0, 32))
                  }
                  placeholder={t("displayNamePlaceholder")}
                  maxLength={32}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {draftDisplayName.length}/32
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("profileDescriptionLabel")}
                </label>
                <textarea
                  value={draftProfileDescription}
                  onChange={(event) =>
                    setDraftProfileDescription(
                      event.target.value.slice(
                        0,
                        PROFILE_DESCRIPTION_MAX_LENGTH,
                      ),
                    )
                  }
                  placeholder={t("profileDescriptionPlaceholder")}
                  rows={6}
                  maxLength={PROFILE_DESCRIPTION_MAX_LENGTH}
                  className="w-full min-h-[160px] resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 sm:min-h-[220px] sm:px-4 sm:py-3"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {draftProfileDescription.length}/
                  {PROFILE_DESCRIPTION_MAX_LENGTH}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/70 p-2.5 sm:p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Превью профиля
              </p>
              <div className="mt-2 rounded-2xl border border-border/60 bg-card p-2.5 sm:mt-4 sm:p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    {avatarSrc ? (
                      <AvatarImage src={avatarSrc} alt={previewName} />
                    ) : null}
                    <AvatarFallback className="text-sm font-semibold">
                      {previewInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold sm:text-base">
                      {previewName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </div>
                {user.rank?.name ? (
                  <div className="mt-3">
                    <span
                      className="inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold text-foreground"
                      style={roleGlowStyle ?? undefined}
                    >
                      {user.rank.name}
                    </span>
                  </div>
                ) : null}
                <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap break-all sm:mt-4">
                  {previewDescription || t("profileDescriptionPlaceholder")}
                </p>
              </div>
            </div>

            {errorMessage ? (
              <p className="text-sm text-destructive md:col-span-2">
                {errorMessage}
              </p>
            ) : null}

            <DialogFooter className="md:col-span-2 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setProfileEditorOpen(false)}
                className="w-full rounded-full border border-border/70 px-4 py-2 text-sm font-semibold transition-colors duration-300 hover:bg-foreground hover:text-background sm:w-auto"
                disabled={isSaving}
              >
                Отмена
              </button>
              <GradientButton
                type="submit"
                className="w-full px-5 py-2 text-sm sm:w-auto"
                disabled={isSaving || !hasProfileDraftChanges}
              >
                {isSaving ? t("saving") : t("saveChanges")}
              </GradientButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      <Dialog
        open={totpSetupOpen}
        onOpenChange={(open) => {
          setTotpSetupOpen(open);
          if (!open) {
            setTotpSetup(null);
            setTotpEnableCode("");
            setTotpError(null);
            setTotpSuccess(null);
            setTotpRecoveryCodes([]);
            setTotpRecoveryRevealed(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("accountTotpModalTitle")}</DialogTitle>
            <DialogDescription>
              {t("accountTotpModalSubtitle")}
            </DialogDescription>
          </DialogHeader>

          {totpAction === "start" ? (
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              {t("accountTotpSetupHint")}
            </div>
          ) : null}

          {totpQrImage ? (
            <div className="flex flex-col gap-3">
              <div className="inline-flex self-center rounded-2xl border border-border/60 bg-white p-3">
                <img src={totpQrImage} alt="TOTP QR" className="h-40 w-40" />
              </div>
              {totpManualUrl ? (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <span className="block">{t("accountTotpManualLabel")}</span>
                  <code className="block rounded-xl border border-border/60 bg-background px-3 py-2 text-[11px] font-semibold text-foreground break-all">
                    {totpManualUrl}
                  </code>
                </div>
              ) : null}
              {totpSecret ? (
                <div className="space-y-1 text-xs text-muted-foreground">
                  <span className="block">{t("accountTotpSecretLabel")}</span>
                  <code className="block rounded-xl border border-border/60 bg-background px-3 py-2 text-[11px] font-semibold text-foreground">
                    {totpSecret}
                  </code>
                </div>
              ) : null}
            </div>
          ) : null}

          {totpSetup ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("accountTotpCodeLabel")}
              </label>
              <InputOTP
                maxLength={totpLength}
                value={totpEnableCode}
                onChange={setTotpEnableCode}
                inputMode="numeric"
              >
                <InputOTPGroup className="gap-2">
                  {Array.from({ length: totpLength }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          ) : null}

          {totpError ? (
            <p className="text-xs text-destructive">{totpError}</p>
          ) : null}
          {totpSuccess ? (
            <p className="text-xs text-foreground">{totpSuccess}</p>
          ) : null}

          {totpRecoveryCodes.length > 0 ? (
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  {t("accountTotpRecoveryTitle")}
                </p>
                <button
                  type="button"
                  className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setTotpRecoveryRevealed((prev) => !prev)}
                >
                  {totpRecoveryRevealed
                    ? t("accountTotpRecoveryHide")
                    : t("accountTotpRecoveryShow")}
                </button>
              </div>
              {!totpRecoveryRevealed ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("accountTotpRecoveryHint")}
                </p>
              ) : null}
              <div
                className={`mt-3 grid gap-2 text-xs font-semibold ${
                  totpRecoveryRevealed
                    ? "text-foreground"
                    : "blur-sm select-none pointer-events-none text-muted-foreground"
                }`}
              >
                {totpRecoveryCodes.map((code, index) => (
                  <span
                    key={`${code}-${index}`}
                    className="rounded-lg border border-border/60 bg-background px-3 py-2 text-center"
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            {totpSetup ? (
              <GradientButton
                type="button"
                className="px-5 py-2 text-sm"
                onClick={() => void handleTotpConfirm()}
                disabled={totpAction === "confirm"}
              >
                {totpAction === "confirm"
                  ? t("saving")
                  : t("accountTotpConfirmAction")}
              </GradientButton>
            ) : null}
            <button
              type="button"
              onClick={() => setTotpSetupOpen(false)}
              className="rounded-full border border-border/70 px-4 py-2 text-sm font-semibold transition-colors duration-300 hover:bg-foreground hover:text-background"
            >
              {t("accountTotpCloseAction")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteProfileOpen}
        onOpenChange={(open) => {
          setDeleteProfileOpen(open);
          if (!open) {
            setDeleteProfileInput("");
            setDeleteProfileError(null);
            setDeleteProfileLoading(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("accountDeleteProfileTitle")}</DialogTitle>
            <DialogDescription>
              {t("accountDeleteProfileDescription")}{" "}
              <span className="font-semibold text-foreground">
                {user.username}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <input
              value={deleteProfileInput}
              onChange={(event) => setDeleteProfileInput(event.target.value)}
              placeholder={t("accountDeleteProfilePlaceholder")}
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm"
            />
            {deleteProfileError ? (
              <p className="text-xs text-destructive">{deleteProfileError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeleteProfileOpen(false)}
              className="rounded-full border border-border/70 px-4 py-2 text-sm font-semibold transition-colors duration-300 hover:bg-foreground hover:text-background"
              disabled={deleteProfileLoading}
            >
              {t("accountDeleteProfileCancel")}
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmDeleteProfile()}
              className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={deleteProfileLoading || !isDeleteProfileMatch}
            >
              {t("accountDeleteProfileAction")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
