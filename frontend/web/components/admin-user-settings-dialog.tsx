"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Shield, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/components/language-provider";
import {
  fetchRanksList,
  fetchUserPermissions,
  updateUserPermission,
  type ApiRankListItem,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export type AdminUserSettingsTarget = {
  userID: number;
  name: string;
  username?: string;
  role?: string;
};

type SettingsSection = "permissions" | "role" | "profile";
type SettingsAction =
  | "permissions"
  | "role"
  | "profile"
  | "profileDescription"
  | "profileDelete";

type AdminUserSettingsDialogProps = {
  open: boolean;
  user: AdminUserSettingsTarget | null;
  onOpenChange: (open: boolean) => void;
  onAction?: (action: SettingsAction, user: AdminUserSettingsTarget) => void;
};

type PermissionEntry = {
  key: string;
  value: boolean;
};

const humanizePermissionPart = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();

const getPermissionLabel = (entry: PermissionEntry) => {
  const parts = entry.key.split(".");
  const labelParts = parts.length > 1 ? parts.slice(1) : parts;
  return labelParts.map(humanizePermissionPart).join(" / ");
};

const flattenPermissions = (
  value: unknown,
  path: string[] = [],
): PermissionEntry[] => {
  if (typeof value === "boolean") {
    return [{ key: path.join("."), value }];
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  return Object.entries(value).flatMap(([key, entry]) =>
    flattenPermissions(entry, [...path, key]),
  );
};

const updatePermissionValue = (
  value: Record<string, unknown>,
  path: string[],
  nextValue: boolean,
): Record<string, unknown> => {
  const next = { ...value };
  let cursor: Record<string, unknown> = next;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    const current = cursor[key];
    if (current && typeof current === "object" && !Array.isArray(current)) {
      cursor[key] = { ...(current as Record<string, unknown>) };
    } else {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = nextValue;
  return next;
};

const groupPermissions = (entries: PermissionEntry[]) => {
  const groups = new Map<string, PermissionEntry[]>();
  entries.forEach((entry) => {
    const groupKey = entry.key.split(".")[0] || "other";
    const list = groups.get(groupKey) ?? [];
    list.push(entry);
    groups.set(groupKey, list);
  });
  return Array.from(groups.entries())
    .map(([key, items]) => ({
      key,
      items: items.sort((a, b) => a.key.localeCompare(b.key)),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
};

const DEFAULT_ROLE_EXPIRY_HOUR = 18;
const DEFAULT_ROLE_EXPIRY_MINUTE = 0;

const applyRoleExpiryTime = (date: Date) => {
  const next = new Date(date);
  next.setHours(DEFAULT_ROLE_EXPIRY_HOUR, DEFAULT_ROLE_EXPIRY_MINUTE, 0, 0);
  return next;
};

export function AdminUserSettingsDialog({
  open,
  user,
  onOpenChange,
  onAction,
}: AdminUserSettingsDialogProps) {
  const { t, language } = useLanguage();
  const [section, setSection] = useState<SettingsSection>("permissions");
  const [permissions, setPermissions] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [permissionsUpdating, setPermissionsUpdating] = useState<Set<string>>(
    new Set(),
  );
  const [permissionsReloadKey, setPermissionsReloadKey] = useState(0);

  const [ranks, setRanks] = useState<ApiRankListItem[]>([]);
  const [ranksLoading, setRanksLoading] = useState(false);
  const [ranksError, setRanksError] = useState<string | null>(null);
  const [ranksReloadKey, setRanksReloadKey] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roleExpiresAt, setRoleExpiresAt] = useState<Date | null>(null);
  const [roleCalendarOpen, setRoleCalendarOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setSection("permissions");
    }
  }, [open, user?.name]);

  useEffect(() => {
    if (!open || !user) {
      return;
    }
    setSelectedRole(user.role || t("labelUser"));
    setRoleExpiresAt(null);
    setRoleCalendarOpen(false);
  }, [open, user?.userID, user?.role, t]);

  useEffect(() => {
    if (!open || !user || section !== "permissions") {
      return;
    }
    let active = true;
    const controller = new AbortController();
    setPermissionsLoading(true);
    setPermissionsError(null);
    fetchUserPermissions(user.userID, { signal: controller.signal })
      .then((data) => {
        if (active) {
          setPermissions((data ?? {}) as Record<string, unknown>);
        }
      })
      .catch((error) => {
        if (active) {
          setPermissionsError(
            error instanceof Error
              ? error.message
              : t("adminUserSettingsPermissionsError"),
          );
        }
      })
      .finally(() => {
        if (active) {
          setPermissionsLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [open, section, user?.userID, permissionsReloadKey, t]);

  useEffect(() => {
    if (!open || !user || section !== "role") {
      return;
    }
    let active = true;
    const controller = new AbortController();
    setRanksLoading(true);
    setRanksError(null);
    fetchRanksList({ signal: controller.signal })
      .then((data) => {
        if (active) {
          setRanks(data);
        }
      })
      .catch((error) => {
        if (active) {
          setRanksError(
            error instanceof Error
              ? error.message
              : t("adminUserSettingsRoleError"),
          );
        }
      })
      .finally(() => {
        if (active) {
          setRanksLoading(false);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [open, section, user?.userID, ranksReloadKey, t]);

  const locale =
    language === "KZ" ? "kk-KZ" : language === "RU" ? "ru-RU" : "en-US";

  const permissionEntries = useMemo(
    () => flattenPermissions(permissions ?? {}),
    [permissions],
  );
  const permissionGroups = useMemo(
    () => groupPermissions(permissionEntries),
    [permissionEntries],
  );
  const totalPermissions = permissionEntries.length;
  const activePermissions = permissionEntries.filter(
    (entry) => entry.value,
  ).length;

  const roleDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  const handlePermissionToggle = async (entry: PermissionEntry) => {
    if (!user || permissionsUpdating.has(entry.key)) {
      return;
    }
    const nextValue = !entry.value;
    setPermissionsUpdating((prev) => new Set(prev).add(entry.key));
    try {
      await updateUserPermission(user.userID, entry.key, nextValue);
      setPermissions((prev) =>
        prev
          ? updatePermissionValue(prev, entry.key.split("."), nextValue)
          : prev,
      );
    } catch (error) {
      toast.error(t("adminUserSettingsPermissionsUpdateError"), {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setPermissionsUpdating((prev) => {
        const next = new Set(prev);
        next.delete(entry.key);
        return next;
      });
    }
  };

  const sections = useMemo(
    () => [
      {
        id: "permissions" as const,
        label: t("adminUserSettingsPermissions"),
        hint: t("adminUserSettingsPermissionsHint"),
        icon: Shield,
      },
      {
        id: "role" as const,
        label: t("adminUserSettingsRole"),
        hint: t("adminUserSettingsRoleHint"),
        icon: Users,
      },
      {
        id: "profile" as const,
        label: t("adminUserSettingsProfile"),
        hint: t("adminUserSettingsProfileHint"),
        icon: UserX,
      },
    ],
    [t],
  );

  const activeSection =
    sections.find((item) => item.id === section) ?? sections[0];
  const displayRole = user?.role || t("labelUser");
  const roleHasChanges =
    (selectedRole ?? displayRole) !== displayRole || roleExpiresAt !== null;

  const handleRoleQuickAdd = (days: number) => {
    const next = new Date();
    next.setDate(next.getDate() + days);
    setRoleExpiresAt(applyRoleExpiryTime(next));
  };

  const handleRoleReset = () => {
    setSelectedRole(displayRole);
    setRoleExpiresAt(null);
  };

  const handleRoleApply = () => {
    if (!roleHasChanges) {
      return;
    }
    toast.message(t("adminUserSettingsRoleUnavailable"));
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-10xl overflow-hidden rounded-3xl border-border/70 bg-card/95 p-0 shadow-2xl sm:max-w-7xl">
        <DialogTitle className="sr-only">
          {t("adminUserSettingsTitle")}
        </DialogTitle>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
          <div className="border-b border-border/60 bg-muted/40 p-4 md:border-b-0 md:border-r md:p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-xs">
              {t("adminUserSettingsTitle")}
            </p>
            <div className="mt-5 space-y-1">
              {sections.map((item) => {
                const isActive = item.id === section;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] font-semibold transition sm:gap-3 sm:text-sm ${
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-muted/30 via-background/90 to-background p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-xs">
                    {t("adminUserSettingsTitle")}
                  </p>
                  <p className="text-base font-semibold sm:text-lg">
                    {user.name}
                  </p>
                  {user.username ? (
                    <p className="text-[11px] text-muted-foreground sm:text-xs">
                      @{user.username}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-[11px] font-semibold sm:px-4 sm:py-2 sm:text-xs">
                  <span className="text-muted-foreground">
                    {t("roleLabel")}
                  </span>
                  <span className="text-foreground">{displayRole}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                    {activeSection.label}
                  </p>
                  <p className="mt-1 text-[13px] text-muted-foreground sm:text-sm">
                    {activeSection.hint}
                  </p>
                </div>
              </div>
            </div>

            {section === "permissions" ? (
              <div className="mt-5 space-y-4">
                {permissionsLoading ? (
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-3 sm:p-4">
                    <p className="text-[13px] text-muted-foreground sm:text-sm">
                      {t("adminUserSettingsPermissionsLoading")}
                    </p>
                  </div>
                ) : permissionsError ? (
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-3 sm:p-4">
                    <p className="text-[13px] text-destructive sm:text-sm">
                      {t("adminUserSettingsPermissionsError")}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground sm:text-xs">
                      {permissionsError}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setPermissionsReloadKey((prev) => prev + 1)
                      }
                      className="mt-3 rounded-full border border-border/70 px-3 py-1.5 text-[11px] font-semibold transition hover:bg-foreground hover:text-background sm:px-4 sm:py-2 sm:text-xs"
                    >
                      {t("adminUserSettingsRetry")}
                    </button>
                  </div>
                ) : permissionGroups.length ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
                      <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 sm:px-3">
                        {t("labelTotal")}:{" "}
                        <span className="text-foreground">
                          {totalPermissions}
                        </span>
                      </span>
                      <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 sm:px-3">
                        {t("labelActive")}:{" "}
                        <span className="text-foreground">
                          {activePermissions}
                        </span>
                      </span>
                    </div>
                    <div className="max-h-[55vh] overflow-y-auto pr-2 sm:max-h-[60vh]">
                      <div className="space-y-4">
                        {permissionGroups.map((group) => {
                          const activeCount = group.items.filter(
                            (entry) => entry.value,
                          ).length;
                          return (
                            <div
                              key={group.key}
                              className="rounded-3xl border border-border/60 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                            >
                              <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2 sm:px-4 sm:py-3">
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                                    {group.key}
                                  </p>
                                  <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground sm:py-1 sm:text-[10px]">
                                    {group.items.length}
                                  </span>
                                </div>
                                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground sm:py-1 sm:text-[10px]">
                                  {activeCount}/{group.items.length}
                                </span>
                              </div>
                              <div className="divide-y divide-border/60">
                                {group.items.map((entry) => (
                                  <div
                                    key={entry.key}
                                    className="flex items-start justify-between gap-3 px-3 py-2 transition hover:bg-muted/30 sm:gap-4 sm:px-4 sm:py-3"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-semibold break-words sm:text-sm">
                                        {getPermissionLabel(entry)}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground/80 break-words sm:text-[11px]">
                                        {entry.key}
                                      </p>
                                    </div>
                                    <Switch
                                      checked={entry.value}
                                      disabled={permissionsUpdating.has(
                                        entry.key,
                                      )}
                                      onCheckedChange={() =>
                                        void handlePermissionToggle(entry)
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-muted-foreground sm:text-sm">
                    {t("adminUserSettingsPermissionsEmpty")}
                  </p>
                )}
              </div>
            ) : null}

            {section === "role" ? (
              <div className="mt-5 space-y-4">
                {ranksLoading ? (
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-3 sm:p-4">
                    <p className="text-[13px] text-muted-foreground sm:text-sm">
                      {t("adminUserSettingsRoleLoading")}
                    </p>
                  </div>
                ) : ranksError ? (
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-3 sm:p-4">
                    <p className="text-[13px] text-destructive sm:text-sm">
                      {t("adminUserSettingsRoleError")}
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground sm:text-xs">
                      {ranksError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setRanksReloadKey((prev) => prev + 1)}
                      className="mt-3 rounded-full border border-border/70 px-3 py-1.5 text-[11px] font-semibold transition hover:bg-foreground hover:text-background sm:px-4 sm:py-2 sm:text-xs"
                    >
                      {t("adminUserSettingsRetry")}
                    </button>
                  </div>
                ) : ranks.length ? (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]">
                    <div className="space-y-4">
                      <div className="rounded-3xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
                        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                              {t("adminUserSettingsRole")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-semibold sm:text-xs">
                            <span className="text-muted-foreground">
                              {t("roleLabel")}
                            </span>
                            <span className="text-foreground">
                              {displayRole}
                            </span>
                          </div>
                        </div>
                        <div
                          role="listbox"
                          aria-label={t("adminUserSettingsRole")}
                          className="mt-4 grid gap-3 sm:grid-cols-2"
                        >
                          {ranks.map((rank) => {
                            const isSelected =
                              (selectedRole ?? displayRole) === rank.name;
                            return (
                              <button
                                key={rank.name}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => setSelectedRole(rank.name)}
                                className={cn(
                                  "flex flex-col gap-2 rounded-2xl border px-3 py-2.5 text-left transition sm:px-4 sm:py-3",
                                  isSelected
                                    ? "border-foreground bg-foreground text-background shadow-lg shadow-foreground/20"
                                    : "border-border/60 bg-background/70 text-foreground hover:border-foreground/40",
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[13px] font-semibold sm:text-sm">
                                      {rank.name}
                                    </p>
                                    {rank.description ? (
                                      <p
                                        className={cn(
                                          "mt-1 text-[11px] sm:text-xs",
                                          isSelected
                                            ? "text-background/80"
                                            : "text-muted-foreground",
                                        )}
                                      >
                                        {rank.description}
                                      </p>
                                    ) : null}
                                  </div>
                                  <div
                                    className={cn(
                                      "mt-1 flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-semibold sm:h-7 sm:w-7 sm:text-[10px]",
                                      isSelected
                                        ? "border-background/40 bg-background/10 text-background"
                                        : "border-border/60 text-muted-foreground",
                                    )}
                                  >
                                    {isSelected ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                      rank.name.slice(0, 2).toUpperCase()
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-3xl border border-border/60 bg-background/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-xs">
                            {t("adminUserSettingsRoleDurationLabel")}
                          </p>
                          <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground sm:py-1 sm:text-[10px]">
                            {t("adminUserSettingsRoleDurationUntil")}
                          </span>
                        </div>
                        <div className="mt-3 space-y-3">
                          <Popover
                            open={roleCalendarOpen}
                            onOpenChange={setRoleCalendarOpen}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 px-3 py-2.5 text-left text-[13px] sm:px-4 sm:py-3 sm:text-sm"
                              >
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px]">
                                    {t("adminUserSettingsRoleExpiresLabel")}
                                  </p>
                                  <p className="mt-1 text-[13px] font-semibold text-foreground sm:text-sm">
                                    {roleExpiresAt
                                      ? roleDateFormatter.format(roleExpiresAt)
                                      : t("adminUserSettingsRoleExpiresEmpty")}
                                  </p>
                                </div>
                                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="w-auto p-0"
                            >
                              <Calendar
                                mode="single"
                                selected={roleExpiresAt ?? undefined}
                                onSelect={(value) => {
                                  if (!value) {
                                    return;
                                  }
                                  setRoleExpiresAt(applyRoleExpiryTime(value));
                                  setRoleCalendarOpen(false);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <button
                              type="button"
                              onClick={() => handleRoleQuickAdd(1)}
                              className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-[11px] font-semibold transition hover:bg-foreground hover:text-background sm:text-xs"
                            >
                              +{t("adminBanDuration24h")}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRoleQuickAdd(7)}
                              className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-[11px] font-semibold transition hover:bg-foreground hover:text-background sm:text-xs"
                            >
                              +{t("adminBanDuration7d")}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRoleQuickAdd(30)}
                              className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-[11px] font-semibold transition hover:bg-foreground hover:text-background sm:text-xs"
                            >
                              +{t("adminBanDuration30d")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setRoleCalendarOpen(true)}
                              className="rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-[11px] font-semibold transition hover:bg-foreground hover:text-background sm:text-xs"
                            >
                              {t("adminUserSettingsRolePickDate")}
                            </button>
                          </div>
                          <p className="text-[11px] text-muted-foreground sm:text-xs">
                            {t("adminUserSettingsRoleApplyHint")}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleRoleReset}
                          disabled={!roleHasChanges}
                          className="rounded-full border border-border/70 px-3 py-1.5 text-[11px] font-semibold transition hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-xs"
                        >
                          {t("adminUserSettingsRoleReset")}
                        </button>
                        <button
                          type="button"
                          onClick={handleRoleApply}
                          disabled={!roleHasChanges}
                          className="rounded-full bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background transition hover:shadow-lg hover:shadow-foreground/20 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-xs"
                        >
                          {t("adminUserSettingsRoleApply")}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground sm:text-sm">
                    {t("adminUserSettingsRoleEmpty")}
                  </p>
                )}
              </div>
            ) : null}

            {section === "profile" ? (
              <div className="mt-6">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => onAction?.("profile", user)}
                    className="w-full rounded-full border border-border/70 px-3 py-2 text-[13px] font-semibold transition hover:bg-foreground hover:text-background sm:text-sm"
                  >
                    {t("adminUserSettingsProfileAction")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction?.("profileDescription", user)}
                    className="w-full rounded-full border border-destructive/40 px-3 py-2 text-[13px] font-semibold text-destructive transition hover:bg-destructive hover:text-destructive-foreground sm:text-sm"
                  >
                    {t("adminUserSettingsProfileDeleteDescription")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction?.("profileDelete", user)}
                    className="w-full rounded-full px-3 py-2 text-[13px] font-semibold text-destructive-foreground transition hover:opacity-90 sm:text-sm"
                  >
                    {t("adminUserSettingsProfileDeleteAccount")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
