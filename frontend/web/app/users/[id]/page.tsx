"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, Crown, FileText, MapPin } from "lucide-react";
import { Header } from "@/components/header";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { GradientButton } from "@/components/gradient-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  fetchProjects,
  fetchUserPublic,
  type ApiProject,
  type ApiUserPublic,
  type ApiAvatar,
} from "@/lib/api";
import { getRankGlowStyle } from "@/lib/rank-colors";

type UserPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type UserProjectCard = {
  id: string;
  title: string;
  summary: string;
  category: string;
  address: string;
  city: string;
  votes: number;
  createdAtLabel: string;
  createdAtMs: number;
};

const CATEGORY_ENUM_MAP: Record<number, string> = {
  1: "improvement",
  2: "roadsidewalks",
  3: "lighting",
  4: "playgrounds",
  5: "parks",
  6: "other",
};

const CATEGORY_ALIAS_MAP: Record<string, string> = {
  improvement: "improvement",
  landscaping: "improvement",
  благоустройство: "improvement",
  roadsidewalks: "roadsidewalks",
  roadsandsidewalks: "roadsidewalks",
  roads_and_sidewalks: "roadsidewalks",
  "дороги и тротуары": "roadsidewalks",
  lighting: "lighting",
  освещение: "lighting",
  playgrounds: "playgrounds",
  "детские площадки": "playgrounds",
  parks: "parks",
  parksandsquares: "parks",
  parks_and_squares: "parks",
  "парки и скверы": "parks",
  other: "other",
  другое: "other",
};

const UNKNOWN_LABEL = "-";
const UNKNOWN_ADDRESS_LABEL = "Адрес не указан";

const parseTimestamp = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value && typeof value === "object" && "seconds" in value) {
    const seconds = Number((value as { seconds?: number | string }).seconds);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return new Date(seconds * 1000).toISOString();
    }
  }
  return "";
};

const formatDate = (value: string, formatter: Intl.DateTimeFormat) => {
  if (!value) {
    return UNKNOWN_LABEL;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return UNKNOWN_LABEL;
  }
  return formatter.format(date);
};

const toSummary = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return UNKNOWN_LABEL;
  }
  if (trimmed.length <= 160) {
    return trimmed;
  }
  return `${trimmed.slice(0, 157).trimEnd()}...`;
};

const resolveDisplayName = (user?: ApiUserPublic | null) => {
  const settings = user?.settings ?? undefined;
  const name = settings?.display_name ?? settings?.displayName ?? "";
  return name.trim() || user?.username || "User";
};

const getUserInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const resolveAvatarSrc = (avatar?: ApiAvatar | null) => {
  if (!avatar) {
    return "";
  }
  if (avatar.url) {
    return avatar.url;
  }
  if (avatar.contentType && avatar.data) {
    return `data:${avatar.contentType};base64,${avatar.data}`;
  }
  return "";
};

const resolveAuthorId = (project?: ApiProject | null) => {
  const author = project?.author ?? null;
  const id = author?.userID ?? author?.uid;
  return typeof id === "number" ? id : null;
};

const resolveCategoryKey = (value: unknown) => {
  if (typeof value === "number") {
    return CATEGORY_ENUM_MAP[value];
  }
  if (typeof value === "string") {
    return CATEGORY_ALIAS_MAP[value.trim().toLowerCase()];
  }
  return undefined;
};

export default function UserProfilePage({ params }: UserPageProps) {
  const { id } = use(params);
  const userId = Number(id);
  const { status } = useAuth();
  const { language, t } = useLanguage();
  const [user, setUser] = useState<ApiUserPublic | null>(null);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locale = useMemo(
    () => (language === "KZ" ? "kk-KZ" : language === "RU" ? "ru-RU" : "en-US"),
    [language],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [locale],
  );
  const categoryLabels = useMemo<Record<string, string>>(
    () => ({
      improvement: t("landscaping"),
      roadsidewalks: t("roadsAndSidewalks"),
      lighting: t("lighting"),
      playgrounds: t("playgrounds"),
      parks: t("parksAndSquares"),
      other: t("other"),
    }),
    [t],
  );

  useEffect(() => {
    if (status !== "authenticated") {
      setIsLoading(false);
      return;
    }
    if (!Number.isFinite(userId) || userId <= 0) {
      setError(t("userProfileInvalidId"));
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchUserPublic(userId, { signal: controller.signal }),
      fetchProjects({ signal: controller.signal }),
    ])
      .then(([userPayload, projectsPayload]) => {
        if (controller.signal.aborted) {
          return;
        }
        setUser(userPayload);
        setProjects(projectsPayload);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : t("userProfileLoadError"),
          );
          setUser(null);
          setProjects([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [status, userId, t]);

  const profileName = resolveDisplayName(user);
  const initials = getUserInitials(profileName);
  const avatarSrc = resolveAvatarSrc(user?.settings?.avatar);
  const rankName = user?.rank?.name || t("labelUser");
  const rankGlowStyle = getRankGlowStyle(rankName);
  const joinedRaw = parseTimestamp(user?.joinedAt ?? user?.joined);
  const joinedLabel = formatDate(joinedRaw, dateFormatter);

  const userProjects = useMemo<UserProjectCard[]>(() => {
    if (!Number.isFinite(userId) || userId <= 0) {
      return [];
    }
    return projects
      .map((project) => {
        if (!project) {
          return null;
        }
        const id = project.id?.trim();
        if (!id) {
          return null;
        }
        if (resolveAuthorId(project) !== userId) {
          return null;
        }
        const info = project.details ?? project.info ?? null;
        const title = info?.title?.trim() || UNKNOWN_LABEL;
        const description = info?.description?.trim() || "";
        const location = info?.location ?? null;
        const addressParts = [
          location?.street?.trim(),
          location?.house?.trim(),
        ].filter((part): part is string => Boolean(part));
        const address = addressParts.length
          ? addressParts.join(" ")
          : UNKNOWN_ADDRESS_LABEL;
        const city = location?.city?.trim() || UNKNOWN_LABEL;
        const categoryKey = resolveCategoryKey(info?.category);
        const category = categoryKey
          ? (categoryLabels[categoryKey] ?? categoryLabels.other)
          : categoryLabels.other;
        const createdAtRaw = parseTimestamp(
          project.createdAt ?? project.created_at,
        );
        const createdAtLabel = formatDate(createdAtRaw, dateFormatter);
        const createdAtMs = createdAtRaw ? new Date(createdAtRaw).getTime() : 0;
        return {
          id,
          title,
          summary: toSummary(description),
          category,
          address,
          city,
          votes: Number(project.likesCount ?? project.likes_count ?? 0),
          createdAtLabel,
          createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : 0,
        };
      })
      .filter((item): item is UserProjectCard => Boolean(item))
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [projects, userId, categoryLabels, dateFormatter]);

  const lastActivityLabel = useMemo(() => {
    if (userProjects.length === 0) {
      return joinedLabel;
    }
    const latest = userProjects[0]?.createdAtMs ?? 0;
    if (!latest) {
      return joinedLabel;
    }
    return formatDate(new Date(latest).toISOString(), dateFormatter);
  }, [dateFormatter, joinedLabel, userProjects]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4 sm:pt-28 sm:pb-16 sm:px-6">
          <div className="container mx-auto max-w-3xl">
            <div className="h-32 rounded-3xl bg-muted/60 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4 sm:pt-28 sm:pb-16 sm:px-6">
          <div className="container mx-auto max-w-lg text-center">
            <p className="text-lg font-semibold">{t("userProfileAuthTitle")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("userProfileAuthSubtitle")}
            </p>
            <Link href="/auth" className="mt-6 inline-flex">
              <GradientButton className="px-6 py-3 text-sm">
                {t("authorization")}
              </GradientButton>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4 sm:pt-28 sm:pb-16 sm:px-6">
          <div className="container mx-auto max-w-5xl space-y-6">
            <div className="h-36 rounded-3xl bg-muted/60 animate-pulse" />
            <div className="h-64 rounded-3xl bg-muted/60 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!user || error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4 sm:pt-28 sm:pb-16 sm:px-6">
          <div className="container mx-auto max-w-lg text-center">
            <p className="text-lg font-semibold">
              {t("userProfileNotFoundTitle")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {error || t("userProfileNotFoundSubtitle")}
            </p>
            <Link href="/" className="mt-6 inline-flex">
              <GradientButton className="px-6 py-3 text-sm">
                {t("userProfileBackHome")}
              </GradientButton>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12 px-4 sm:pt-28 sm:pb-16 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-6">
          <section className="rounded-3xl border border-border/70 bg-card/90 p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {avatarSrc ? (
                    <AvatarImage src={avatarSrc} alt={profileName} />
                  ) : null}
                  <AvatarFallback className="text-lg font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    @{user.username}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                    {profileName}
                  </h1>
                  <div
                    className="mt-3 inline-flex items-center gap-2 rounded-full border bg-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
                    style={rankGlowStyle ?? undefined}
                  >
                    <Crown className="h-3.5 w-3.5" />
                    {rankName}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    {t("userProfileProposalsCount")}
                  </div>
                  <p className="mt-2 text-lg font-semibold">
                    {userProjects.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {t("userProfileLastActivity")}
                  </div>
                  <p className="mt-2 text-sm font-semibold">
                    {lastActivityLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {t("userProfileRegisteredAt")}
                  </div>
                  <p className="mt-2 text-sm font-semibold">{joinedLabel}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card/90 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {t("userProfileProposals")}
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {t("userProfileProposalsTitle")}
                </h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {userProjects.length}
              </span>
            </div>

            {userProjects.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {userProjects.map((project) => (
                  <article
                    key={project.id}
                    className="rounded-2xl border border-border/60 bg-background/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {project.category}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold">
                          {project.title}
                        </h3>
                      </div>
                      <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                        {project.votes}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {project.summary}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {project.createdAtLabel}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {project.address}
                      </span>
                      <span>{project.city}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                {t("userProfileProposalsEmpty")}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
