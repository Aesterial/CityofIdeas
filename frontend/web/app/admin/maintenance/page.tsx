"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Globe,
  LogOut,
  Play,
  RefreshCw,
  Settings,
  SquarePen,
  StopCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminNotificationsMenu } from "@/components/admin-notifications-menu";
import { Logo } from "@/components/logo";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import {
  ApiError,
  completeMaintenance,
  editMaintenance,
  fetchMaintenanceActive,
  fetchMaintenanceData,
  fetchMaintenancePlanned,
  scheduleMaintenance,
  startMaintenance,
  type ApiMaintenanceData,
  type ApiPermissions,
  type MaintenanceScope,
} from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type PermissionPath = Array<string | string[]>;
type MaintenanceMode = "emergency" | "planned";

const adminRoles = new Set([
  "root",
  "admin",
  "staff",
  "moderator",
  "support",
  "developer",
  "operator",
]);

const maintenancePermissionPaths: PermissionPath[] = [
  ["all"],
  ["ranks", "all"],
  ["ranks", ["permsChange", "permissionsChange", "permissions_change"]],
];

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
};

const readPermissionFlag = (value: unknown, path: PermissionPath): boolean => {
  let current: unknown = value;
  for (const segment of path) {
    const record = toRecord(current);
    if (!record) {
      return false;
    }
    const keys = Array.isArray(segment) ? segment : [segment];
    let next: unknown = undefined;
    for (const key of keys) {
      if (key in record) {
        next = record[key];
        break;
      }
    }
    if (next === undefined) {
      return false;
    }
    current = next;
  }
  return current === true;
};

const hasAnyPermission = (
  permissions: ApiPermissions | null,
  paths: PermissionPath[],
): boolean => {
  if (!permissions) {
    return false;
  }
  return paths.some((path) => readPermissionFlag(permissions, path));
};

const isAdminRole = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }
  return adminRoles.has(value.trim().toLowerCase());
};

const canManageMaintenance = (
  permissions: ApiPermissions | null,
  rankName?: string,
) =>
  hasAnyPermission(permissions, maintenancePermissionPaths) ||
  isAdminRole(rankName);

const pad = (value: number) => String(value).padStart(2, "0");

const toLocalDateTimeInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const resolveDefaultDate = (offsetMinutes: number) => {
  const value = new Date();
  value.setSeconds(0, 0);
  value.setMinutes(value.getMinutes() + offsetMinutes);
  return toLocalDateTimeInput(value);
};

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const formatDateTime = (value: string | undefined, locale: string) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

export default function AdminMaintenancePage() {
  const router = useRouter();
  const { logout, user, permissions } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [active, setActive] = useState(false);
  const [planned, setPlanned] = useState(false);
  const [maintenanceData, setMaintenanceData] =
    useState<ApiMaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<MaintenanceMode>("emergency");
  const [createDescription, setCreateDescription] = useState("");
  const [createScope, setCreateScope] = useState<MaintenanceScope>("all");
  const [createStartAt, setCreateStartAt] = useState(() =>
    resolveDefaultDate(15),
  );
  const [createEndAt, setCreateEndAt] = useState(() => resolveDefaultDate(90));
  const [creating, setCreating] = useState(false);

  const [editDescription, setEditDescription] = useState("");
  const [editScope, setEditScope] = useState<"" | MaintenanceScope>("");
  const [editing, setEditing] = useState(false);
  const [completing, setCompleting] = useState(false);

  const displayName = user?.displayName || user?.username || "";
  const initials = (displayName || "A").slice(0, 2).toUpperCase();
  const avatarSrc =
    user?.avatar?.url ||
    (user?.avatar?.contentType && user?.avatar?.data
      ? `data:${user.avatar.contentType};base64,${user.avatar.data}`
      : "");
  const locale =
    language === "KZ" ? "kk-KZ" : language === "RU" ? "ru-RU" : "en-US";
  const languageOptions = [
    { code: "RU" as const, label: "RU" },
    { code: "EN" as const, label: "EN" },
    { code: "KZ" as const, label: "KZ" },
  ];
  const scopeOptions: Array<{ value: MaintenanceScope; label: string }> = [
    { value: "all", label: t("adminMaintenanceScopeAll") },
    { value: "auth", label: t("adminMaintenanceScopeAuth") },
    { value: "projects", label: t("adminMaintenanceScopeProjects") },
  ];

  const hasAccess = useMemo(
    () => canManageMaintenance(permissions, user?.rank?.name),
    [permissions, user?.rank?.name],
  );

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const loadState = useCallback(
    async (options?: { signal?: AbortSignal; silent?: boolean }) => {
      const signal = options?.signal;
      const silent = options?.silent ?? false;
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const [isActive, isPlanned] = await Promise.all([
          fetchMaintenanceActive({ signal }),
          fetchMaintenancePlanned({ signal }),
        ]);
        if (signal?.aborted) {
          return;
        }
        setActive(isActive);
        setPlanned(isPlanned);
        if (!isActive) {
          setMaintenanceData(null);
          setEditDescription("");
          return;
        }

        const data = await fetchMaintenanceData({ signal });
        if (signal?.aborted) {
          return;
        }
        setMaintenanceData(data);
        setEditDescription(data?.description ?? "");
      } catch (loadError) {
        if (signal?.aborted) {
          return;
        }
        if (
          loadError instanceof ApiError &&
          (loadError.status === 503 ||
            loadError.status === 409 ||
            loadError.status === 404)
        ) {
          setActive(false);
          setMaintenanceData(null);
          return;
        }
        setError(toErrorMessage(loadError, t("adminMaintenanceErrorLoad")));
      } finally {
        if (!signal?.aborted) {
          if (!silent) {
            setLoading(false);
          } else {
            setRefreshing(false);
          }
        }
      }
    },
    [t],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadState({ signal: controller.signal });
    return () => controller.abort();
  }, [loadState]);

  const handleCreate = async () => {
    if (!hasAccess) {
      toast.error(t("adminMaintenanceErrorPermission"));
      return;
    }
    const description = createDescription.trim();
    if (!description) {
      toast.error(t("adminMaintenanceErrorDescriptionRequired"));
      return;
    }
    if (!createEndAt.trim()) {
      toast.error(t("adminMaintenanceErrorEndRequired"));
      return;
    }
    if (mode === "planned" && !createStartAt.trim()) {
      toast.error(t("adminMaintenanceErrorStartRequired"));
      return;
    }

    setCreating(true);
    try {
      if (mode === "planned") {
        await scheduleMaintenance({
          description,
          scope: createScope,
          willStart: createStartAt,
          willEnd: createEndAt,
        });
        toast.success(t("adminMaintenanceSuccessScheduled"));
      } else {
        await startMaintenance({
          description,
          scope: createScope,
          willEnd: createEndAt,
        });
        toast.success(t("adminMaintenanceSuccessStarted"));
      }
      await loadState({ silent: true });
    } catch (actionError) {
      toast.error(
        toErrorMessage(actionError, t("adminMaintenanceErrorCreate")),
      );
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!hasAccess) {
      toast.error(t("adminMaintenanceErrorPermission"));
      return;
    }
    if (!active) {
      toast.error(t("adminMaintenanceErrorActiveNotFound"));
      return;
    }

    const description = editDescription.trim();
    const scope = editScope || undefined;
    if (!description && !scope) {
      toast.error(t("adminMaintenanceErrorEditFieldsRequired"));
      return;
    }

    setEditing(true);
    try {
      await editMaintenance({
        description: description || undefined,
        scope: scope as MaintenanceScope | undefined,
      });
      toast.success(t("adminMaintenanceSuccessUpdated"));
      await loadState({ silent: true });
    } catch (actionError) {
      toast.error(
        toErrorMessage(actionError, t("adminMaintenanceErrorUpdate")),
      );
    } finally {
      setEditing(false);
    }
  };

  const handleComplete = async () => {
    if (!hasAccess) {
      toast.error(t("adminMaintenanceErrorPermission"));
      return;
    }
    if (!active) {
      toast.error(t("adminMaintenanceErrorActiveNotFound"));
      return;
    }
    if (!window.confirm(t("adminMaintenanceConfirmComplete"))) {
      return;
    }

    setCompleting(true);
    try {
      await completeMaintenance();
      toast.success(t("adminMaintenanceSuccessCompleted"));
      await loadState({ silent: true });
    } catch (actionError) {
      toast.error(
        toErrorMessage(actionError, t("adminMaintenanceErrorComplete")),
      );
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-foreground/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-foreground/5 blur-3xl" />

      <header
        className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur"
        style={{ top: "var(--maintenance-banner-height)" }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label="Go to main site">
              <Logo className="h-9 w-9 text-foreground" showText={false} />
            </Link>
            <div>
              <p className="text-lg font-semibold">
                {t("adminMaintenanceTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("adminMaintenanceSubtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AdminNotificationsMenu />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold transition-all duration-300 hover:bg-foreground hover:text-background sm:hidden"
                >
                  <span>{t("menuLabel")}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                className="w-56 sm:hidden"
              >
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Settings className="h-4 w-4" />
                    {t("adminPanel")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <Settings className="h-4 w-4" />
                    {t("accountSettings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {languageOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.code}
                    onSelect={() => setLanguage(option.code)}
                  >
                    <Globe className="h-4 w-4" />
                    {option.label}
                    {language === option.code ? " (current)" : ""}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    void handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden items-center gap-3 sm:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold transition-all duration-300 hover:bg-foreground hover:text-background"
                  >
                    <Globe className="h-4 w-4" />
                    {language}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[90px]">
                  {languageOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.code}
                      onClick={() => setLanguage(option.code)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-full border border-border/60 bg-card/90 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:bg-foreground hover:text-background"
                  >
                    <Avatar className="h-9 w-9">
                      {avatarSrc ? (
                        <AvatarImage
                          src={avatarSrc}
                          alt={displayName || t("adminPanel")}
                        />
                      ) : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[140px] truncate">
                      {displayName || t("adminPanel")}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Settings className="h-4 w-4" />
                      {t("adminPanel")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account">
                      <Settings className="h-4 w-4" />
                      {t("accountSettings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      void handleLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/admin"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-semibold transition hover:bg-foreground hover:text-background sm:w-auto"
          >
            <Settings className="h-4 w-4" />
            {t("adminMaintenanceBack")}
          </Link>
          <Link
            href="/technics"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-semibold transition hover:bg-foreground hover:text-background sm:w-auto"
          >
            <Clock className="h-4 w-4" />
            {t("adminMaintenanceOpenPage")}
          </Link>
          <button
            type="button"
            onClick={() => void loadState({ silent: true })}
            disabled={refreshing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-semibold transition hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {t("adminMaintenanceRefresh")}
          </button>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("adminMaintenanceActive")}
            </p>
            <p className="mt-3 text-2xl font-bold">
              {active
                ? t("adminMaintenanceEnabled")
                : t("adminMaintenanceDisabled")}
            </p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("adminMaintenancePlanned")}
            </p>
            <p className="mt-3 text-2xl font-bold">
              {planned
                ? t("adminMaintenanceScheduled")
                : t("adminMaintenanceNoPlanned")}
            </p>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("adminMaintenancePermissions")}
            </p>
            <p className="mt-3 text-2xl font-bold">
              {hasAccess
                ? t("adminMaintenanceCanManage")
                : t("adminMaintenanceReadOnly")}
            </p>
          </div>
        </section>

        {maintenanceData ? (
          <section className="mt-4 rounded-3xl border border-border/70 bg-card/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {t("adminMaintenanceCurrentTitle")}
              </h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold">
                <CalendarDays className="h-3.5 w-3.5" />
                {t("adminMaintenanceEnds")}:{" "}
                {formatDateTime(maintenanceData.willEnd, locale)}
              </span>
            </div>
            <p className="mt-3 text-sm text-foreground/80">
              {maintenanceData.description ||
                t("adminMaintenanceNoDescription")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("adminMaintenanceRequestId")}: {maintenanceData.id || "-"}
            </p>
          </section>
        ) : null}

        {error ? (
          <section className="mt-4 rounded-3xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-800">
            {error}
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
            <h2 className="text-lg font-semibold">
              {t("adminMaintenanceCreateTitle")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("adminMaintenanceCreateSubtitle")}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("emergency")}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  mode === "emergency"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/70 bg-background"
                }`}
              >
                {t("adminMaintenanceModeEmergency")}
              </button>
              <button
                type="button"
                onClick={() => setMode("planned")}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  mode === "planned"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/70 bg-background"
                }`}
              >
                {t("adminMaintenanceModePlanned")}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <Textarea
                value={createDescription}
                onChange={(event) => setCreateDescription(event.target.value)}
                placeholder={t("adminMaintenanceDescriptionPlaceholder")}
                rows={4}
                disabled={!hasAccess}
              />

              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("adminMaintenanceScope")}
              </label>
              <select
                value={createScope}
                onChange={(event) =>
                  setCreateScope(event.target.value as MaintenanceScope)
                }
                disabled={!hasAccess}
                className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 text-sm"
              >
                {scopeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {mode === "planned" ? (
                <>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("adminMaintenanceStartAt")}
                  </label>
                  <Input
                    type="datetime-local"
                    value={createStartAt}
                    onChange={(event) => setCreateStartAt(event.target.value)}
                    disabled={!hasAccess}
                  />
                </>
              ) : null}

              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("adminMaintenanceEndAt")}
              </label>
              <Input
                type="datetime-local"
                value={createEndAt}
                onChange={(event) => setCreateEndAt(event.target.value)}
                disabled={!hasAccess}
              />
            </div>

            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={!hasAccess || creating || loading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Play className="h-4 w-4" />
              {creating
                ? t("adminMaintenanceCreateSubmitting")
                : t("adminMaintenanceCreateAction")}
            </button>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
            <h2 className="text-lg font-semibold">
              {t("adminMaintenanceManageTitle")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("adminMaintenanceManageSubtitle")}
            </p>

            <div className="mt-4 space-y-3">
              <Textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder={t("adminMaintenanceEditDescriptionPlaceholder")}
                rows={4}
                disabled={!hasAccess || !active}
              />

              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("adminMaintenanceScopeUpdate")}
              </label>
              <select
                value={editScope}
                onChange={(event) =>
                  setEditScope(event.target.value as "" | MaintenanceScope)
                }
                disabled={!hasAccess || !active}
                className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 text-sm"
              >
                <option value="">{t("adminMaintenanceScopeKeep")}</option>
                {scopeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleEdit()}
                disabled={!hasAccess || !active || editing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-background px-4 py-2 text-sm font-semibold transition hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-70"
              >
                <SquarePen className="h-4 w-4" />
                {editing
                  ? t("adminMaintenanceSaving")
                  : t("adminMaintenanceSaveChanges")}
              </button>
              <button
                type="button"
                onClick={() => void handleComplete()}
                disabled={!hasAccess || !active || completing}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-600/70 bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <StopCircle className="h-4 w-4" />
                {completing
                  ? t("adminMaintenanceCompleting")
                  : t("adminMaintenanceComplete")}
              </button>
            </div>

            {!hasAccess ? (
              <p className="mt-3 text-xs text-amber-700">
                {t("adminMaintenanceNoPermissionHint")}
              </p>
            ) : null}
          </div>
        </section>

        {!loading ? null : (
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            {t("adminMaintenanceLoading")}
          </div>
        )}

        {!active && !planned && !loading ? (
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {t("adminMaintenanceDisabledState")}
          </div>
        ) : null}
      </main>
    </div>
  );
}
