"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Shield, User } from "lucide-react";
import { Header } from "@/components/header";
import { useLanguage } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { GradientButton } from "@/components/gradient-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

export default function AccountPage() {
  const router = useRouter();
  const {
    user,
    status,
    updateDisplayName,
    updateProfileDescription,
    updateAvatar,
    deleteAvatar,
    deleteProfile,
  } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [displayName, setDisplayName] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
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
  const isAvatarSaving = avatarAction !== null;
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
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
  }, [user?.displayName]);

  useEffect(() => {
    setProfileDescription(user?.description ?? "");
  }, [user?.description]);

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user) {
      return;
    }

    const nextName = displayName.trim();
    const nextDescription = profileDescription.trim();
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
      setSuccessMessage(t("accountProfileSaved"));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : t("accountProfileError"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDisplayName = async () => {
    if (!user) {
      return;
    }
    const fallbackName = user.username?.trim();
    if (!fallbackName) {
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);
    try {
      await updateDisplayName(fallbackName);
      setDisplayName(fallbackName);
      setSuccessMessage(t("displayNameResetSuccess"));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : t("accountProfileError"),
      );
    } finally {
      setIsSaving(false);
    }
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

  const nameForAvatar = user.displayName || user.username || "User";
  const initials = getInitials(nameForAvatar);
  const storedAvatarSrc =
    user.avatar?.url ||
    (user.avatar?.contentType && user.avatar?.data
      ? `data:${user.avatar.contentType};base64,${user.avatar.data}`
      : null);
  const avatarSrc = avatarPreview || storedAvatarSrc;
  const canResetAvatar = Boolean(storedAvatarSrc);
  const canResetDisplayName =
    Boolean(user.username) && displayName.trim() !== user.username;
  const canDeleteDescription = Boolean(profileDescription.trim());
  const isDeleteProfileMatch = deleteProfileInput.trim() === user.username;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12 px-4 sm:pt-28 sm:pb-16 sm:px-6">
        <div className="container mx-auto max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold mb-2 sm:text-4xl">
              {t("accountSettings")}
            </h1>
            <p className="text-muted-foreground">
              {t("accountSettingsSubtitle")}
            </p>
          </motion.div>

          <motion.div
            className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[0_24px_60px_-45px_rgba(0,0,0,0.35)]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="h-14 w-14">
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
                    className="w-full justify-center sm:w-auto"
                    onClick={handleAvatarSelect}
                    disabled={isAvatarSaving}
                  >
                    {avatarAction === "upload"
                      ? t("accountAvatarUploading")
                      : t("accountAvatarChange")}
                  </GradientButton>
                  {canResetAvatar ? (
                    <button
                      type="button"
                      className="w-full rounded-full border border-border/70 px-4 py-3 text-xs font-semibold transition-colors duration-300 hover:bg-foreground hover:text-background sm:w-auto"
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

            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-destructive">
                {t("accountDangerZone")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("accountDangerHint")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="w-full rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive transition-colors duration-300 hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  onClick={() => void handleDeleteDescription()}
                  disabled={deleteDescriptionLoading || !canDeleteDescription}
                >
                  {deleteDescriptionLoading
                    ? t("accountDescriptionDeleting")
                    : t("accountDescriptionDelete")}
                </button>
                <button
                  type="button"
                  className="w-full rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground transition-opacity duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
                  <span>
                    {t("roleLabel")}: {user.rank.name}
                  </span>
                </div>
              ) : null}
            </div>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border/70 bg-card/90 p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium">
                  {t("displayNameLabel")}
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => void handleResetDisplayName()}
                  disabled={isSaving || !canResetDisplayName}
                >
                  {t("displayNameReset")}
                </button>
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder={t("displayNamePlaceholder")}
                className="w-full bg-background border border-border rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-300"
              />
              <label className="block text-sm font-medium">
                {t("profileDescriptionLabel")}
              </label>
              <textarea
                value={profileDescription}
                onChange={(event) => setProfileDescription(event.target.value)}
                placeholder={t("profileDescriptionPlaceholder")}
                rows={4}
                className="w-full bg-background border border-border rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all duration-300"
              />
              {errorMessage ? (
                <p className="text-sm text-destructive">{errorMessage}</p>
              ) : null}
              {successMessage ? (
                <p className="text-sm text-foreground">{successMessage}</p>
              ) : null}
            </div>

            <div className="mt-5">
              <GradientButton
                type="submit"
                className="w-full justify-center sm:w-auto"
                disabled={isSaving}
              >
                {isSaving ? t("saving") : t("saveChanges")}
              </GradientButton>
            </div>
          </motion.form>
        </div>
      </main>

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
