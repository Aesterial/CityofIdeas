"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, ListFilter, MapPin, Sparkles, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Header, cities as availableCities } from "@/components/header";
import { GradientButton } from "@/components/gradient-button";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import {
  TutorialProvider,
  type TutorialStep,
} from "@/components/tutorial/tutorial-provider";
import { fetchProjects, toggleProjectLike, type ApiProject } from "@/lib/api";
import { resolveCoordinates, type Coordinates } from "@/lib/location";
import type { Variants } from "framer-motion";

interface IdeaCard {
  id: string;
  title: string;
  address: string;
  description: string;
  coordinates: Coordinates | null;
  photoImage: string;
  category: string;
  city: string;
  votes: number;
  isVoted: boolean;
  createdAt: string;
  status: "pending" | "approved" | "declined" | "unknown";
}

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

const UNKNOWN_CITY_LABEL = "Не указан";
const UNKNOWN_ADDRESS_LABEL = "Адрес не указан";
const MAP_FALLBACK_IMAGE = "/aerial-view-of-city-block-kemerovo.jpg";
const PHOTO_FALLBACK_IMAGE = "/aerial-view-residential-area-kemerovo.jpg";

const extractUserId = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const payload = value as {
    uid?: unknown;
    userID?: unknown;
    userId?: unknown;
  };
  const id = payload.uid ?? payload.userID ?? payload.userId;
  return typeof id === "number" ? id : null;
};

const toImageSrc = (
  photo?: {
    contentType?: string;
    data?: string;
    url?: string;
  } | null,
) => {
  if (!photo) {
    return "";
  }
  if (photo.url) {
    return photo.url;
  }
  if (photo.contentType && photo.data) {
    return `data:${photo.contentType};base64,${photo.data}`;
  }
  return "";
};

const buildMapPreviewSrc = (coords: Coordinates | null) => {
  if (!coords) {
    return "";
  }

  const [lng, lat] = coords;
  const params = new URLSearchParams({
    center: `${lat.toFixed(6)},${lng.toFixed(6)}`,
    zoom: "15",
    size: "640x360",
    markers: `${lat.toFixed(6)},${lng.toFixed(6)},red-pushpin`,
  });
  return `https://staticmap.openstreetmap.de/staticmap.php?${params.toString()}`;
};

const buildYandexMapPreviewSrc = (coords: Coordinates | null) => {
  if (!coords) {
    return "";
  }

  const [lng, lat] = coords;
  const params = new URLSearchParams({
    ll: `${lng.toFixed(6)},${lat.toFixed(6)}`,
    z: "15",
    l: "map",
    size: "650,360",
    pt: `${lng.toFixed(6)},${lat.toFixed(6)},pm2rdm`,
  });
  return `https://static-maps.yandex.ru/1.x/?${params.toString()}`;
};

const buildMapPreviewSources = (coords: Coordinates | null) => {
  const sources = [buildMapPreviewSrc(coords), buildYandexMapPreviewSrc(coords)]
    .map((src) => src.trim())
    .filter(Boolean);
  return Array.from(new Set([...sources, MAP_FALLBACK_IMAGE]));
};

function MapPreviewImage({
  title,
  coordinates,
}: {
  title: string;
  coordinates: Coordinates | null;
}) {
  const sources = useMemo(
    () => buildMapPreviewSources(coordinates),
    [coordinates],
  );
  const sourcesKey = useMemo(() => sources.join("|"), [sources]);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sourcesKey]);

  const src = sources[Math.min(sourceIndex, sources.length - 1)];

  return (
    <img
      src={src}
      alt={`Карта - ${title}`}
      className="h-full w-full object-cover"
      onError={() => {
        setSourceIndex((current) =>
          current < sources.length - 1 ? current + 1 : current,
        );
      }}
    />
  );
}

const parseTimestamp = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && "seconds" in value) {
    const seconds = Number((value as { seconds?: number | string }).seconds);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return new Date(seconds * 1000).toISOString();
    }
  }
  return "";
};

const normalizeProjectStatus = (
  value: unknown,
): "pending" | "approved" | "declined" | "unknown" => {
  if (typeof value === "number") {
    if (value === 1) return "pending";
    if (value === 2) return "approved";
    if (value === 3) return "declined";
    return "unknown";
  }
  if (typeof value !== "string") {
    return "unknown";
  }
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "pending" ||
    normalized === "new" ||
    normalized === "in_review" ||
    normalized === "inreview" ||
    normalized === "on_moderation" ||
    normalized === "moderation"
  ) {
    return "pending";
  }
  if (
    normalized === "approved" ||
    normalized === "accept" ||
    normalized === "accepted"
  ) {
    return "approved";
  }
  if (
    normalized === "declined" ||
    normalized === "rejected" ||
    normalized === "decline"
  ) {
    return "declined";
  }
  return "unknown";
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const sortOptions = [
  { id: "popular", label: "По голосам" },
  { id: "newest", label: "Новые" },
] as const;

const votingTutorialSteps: TutorialStep[] = [
  {
    selector: '[data-tutorial="voting-hero"]',
    text: "Здесь общий обзор голосования: сколько идей и голосов.",
    position: "bottom",
  },
  {
    selector: '[data-tutorial="voting-filters"]',
    text: "Фильтры помогают быстро найти проекты по теме и городу.",
    position: "bottom",
  },
  {
    selector: '[data-tutorial="voting-sort"]',
    text: "Сортируй идеи по популярности или новизне.",
    position: "bottom",
  },
  {
    selector: '[data-tutorial="voting-list"]',
    text: "В карточках можно проголосовать за идею.",
    position: "top",
  },
];

type CityFilter = "all" | string;
const normalizeKey = (value: string) => value.trim().toLowerCase();
const ALL_FILTER = "all";
const moderationRoles = new Set([
  "root",
  "admin",
  "staff",
  "moderator",
  "assistant",
  "support",
  "developer",
  "operator",
]);

const toPermissionRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
};

const hasSubmissionsModerationAccess = (
  permissions: unknown,
  roleName?: string,
) => {
  const normalizedRole = roleName?.trim().toLowerCase();
  if (normalizedRole && moderationRoles.has(normalizedRole)) {
    return true;
  }

  const record = toPermissionRecord(permissions);
  if (!record) {
    return false;
  }
  if (record.all === true) {
    return true;
  }

  const submissions = toPermissionRecord(record.submissions);
  if (!submissions) {
    return false;
  }

  return (
    submissions.view === true ||
    submissions.accept === true ||
    submissions.decline === true
  );
};

export default function VotingPage() {
  const shouldReduceMotion = useReducedMotion();
  const [ideas, setIdeas] = useState<IdeaCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER);
  const [selectedCity, setSelectedCity] = useState<CityFilter>(ALL_FILTER);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement | null>(null);
  const cityListRef = useRef<HTMLUListElement | null>(null);
  const [sortBy, setSortBy] =
    useState<(typeof sortOptions)[number]["id"]>("popular");
  const [actionError, setActionError] = useState<string | null>(null);
  const { user, status, permissions } = useAuth();
  const { t } = useLanguage();
  const isEmailVerified = Boolean(user?.emailVerified);
  const canOpenModerationProjects = useMemo(
    () => hasSubmissionsModerationAccess(permissions, user?.rank?.name),
    [permissions, user?.rank?.name],
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
  const statusLabels = useMemo<Record<IdeaCard["status"], string>>(
    () => ({
      pending: t("statusPending"),
      approved: t("statusApproved"),
      declined: t("statusDeclined"),
      unknown: "Не указан",
    }),
    [t],
  );

  const loadIdeas = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setLoadError(null);

      const resolveCategoryLabel = (value: unknown) => {
        let key: string | undefined;
        if (typeof value === "number") {
          key = CATEGORY_ENUM_MAP[value];
        } else if (typeof value === "string") {
          key = CATEGORY_ALIAS_MAP[normalizeKey(value)];
        }

        if (key && categoryLabels[key]) {
          return categoryLabels[key];
        }
        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
        return categoryLabels.other;
      };

      const mapProjectToIdea = (project?: ApiProject | null) => {
        if (!project) return null;

        const id = project.id?.trim();
        if (!id) return null;

        const info = project.details ?? project.info ?? null;
        const title = info?.title?.trim() || "Без названия";
        const description =
          info?.description?.trim() || "Описание пока не добавлено.";

        const location = info?.location ?? null;
        const city = location?.city?.trim() || UNKNOWN_CITY_LABEL;

        const addressParts = [
          location?.street?.trim(),
          location?.house?.trim(),
        ].filter((part): part is string => Boolean(part));
        const address = addressParts.length
          ? addressParts.join(" ")
          : UNKNOWN_ADDRESS_LABEL;

        const photos = Array.isArray(info?.photos) ? info?.photos : [];
        const coordinates = resolveCoordinates(location);
        const photoImage = toImageSrc(photos[0]) || PHOTO_FALLBACK_IMAGE;

        const liked = Array.isArray(project.liked) ? project.liked : [];
        const userId = user?.uid;

        const isVoted =
          userId != null &&
          liked.some((item) => extractUserId(item) === userId);

        return {
          id,
          title,
          address,
          description,
          coordinates,
          photoImage,
          category: resolveCategoryLabel(info?.category),
          city,
          votes: Number(project.likesCount ?? project.likes_count ?? 0),
          isVoted,
          createdAt:
            parseTimestamp(project.createdAt ?? project.created_at) || "",
          status: normalizeProjectStatus(project.status),
        };
      };

      try {
        const projects = await fetchProjects({ signal });

        if (signal?.aborted) {
          return;
        }

        const merged = new Map<string, IdeaCard>();
        const addIdea = (idea: IdeaCard | null) => {
          if (idea) {
            merged.set(idea.id, idea);
          }
        };

        projects.forEach((project) => {
          addIdea(mapProjectToIdea(project));
        });

        setIdeas(Array.from(merged.values()));
      } catch (error) {
        if (!signal?.aborted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить идеи.",
          );
          setIdeas([]);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [categoryLabels, user?.uid],
  );

  useEffect(() => {
    if (status !== "authenticated") {
      setIdeas([]);
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    void loadIdeas(controller.signal);
    return () => controller.abort();
  }, [loadIdeas, status]);

  const totalVotes = useMemo(
    () => ideas.reduce((sum, idea) => sum + idea.votes, 0),
    [ideas],
  );

  const updateIdea = (id: string, update: (idea: IdeaCard) => IdeaCard) => {
    let snapshot: IdeaCard | null = null;
    setIdeas((current) =>
      current.map((idea) => {
        if (idea.id !== id) {
          return idea;
        }
        snapshot = idea;
        return update(idea);
      }),
    );
    return snapshot;
  };

  const handleVote = async (id: string) => {
    if (!isEmailVerified) {
      setActionError(t("emailVerificationRequiredVotingBody"));
      return;
    }
    let wasUpdated = false;
    const snapshot = updateIdea(id, (idea) => {
      if (idea.isVoted) {
        return idea;
      }
      wasUpdated = true;
      return { ...idea, isVoted: true, votes: idea.votes + 1 };
    });

    if (!snapshot || !wasUpdated) {
      return;
    }

    try {
      await toggleProjectLike(id);
    } catch {
      setIdeas((current) =>
        current.map((idea) => (idea.id === id ? snapshot : idea)),
      );
    }
  };

  useEffect(() => {
    if (isEmailVerified) {
      setActionError(null);
    }
  }, [isEmailVerified]);

  const resetFilters = () => {
    setSelectedCategory(ALL_FILTER);
    setSelectedCity(ALL_FILTER);
  };

  const hasFilters =
    selectedCategory !== ALL_FILTER || selectedCity !== ALL_FILTER;
  const handleReload = () => {
    void loadIdeas();
  };

  const categories = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    ideas.forEach((idea) => {
      const key = normalizeKey(idea.category);
      const entry = counts.get(key);
      if (entry) {
        entry.count += 1;
      } else {
        counts.set(key, { label: idea.category, count: 1 });
      }
    });
    return [
      {
        id: "all",
        label: "Все категории",
        count: ideas.length,
      },
      ...Array.from(counts.entries()).map(([id, data]) => ({
        id,
        label: data.label,
        count: data.count,
      })),
    ];
  }, [ideas]);

  const cityOptions = useMemo(() => {
    const dynamicCities = ideas
      .map((idea) => idea.city)
      .filter((city) => Boolean(city) && city !== UNKNOWN_CITY_LABEL);
    const merged = Array.from(new Set([...availableCities, ...dynamicCities]));
    return [
      { id: "all", label: "Все города" },
      ...merged.map((city) => ({ id: city, label: city })),
    ];
  }, [ideas]);

  const selectedCategoryLabel = useMemo(() => {
    return (
      categories.find((category) => category.id === selectedCategory)?.label ??
      "Все категории"
    );
  }, [categories, selectedCategory]);

  const selectedCityLabel = useMemo(() => {
    return selectedCity === ALL_FILTER ? "Все города" : selectedCity;
  }, [selectedCity]);

  const handleCityChange = (value: string) => {
    setSelectedCity(value as CityFilter);
    setIsCityOpen(false);
  };

  useEffect(() => {
    if (!isCityOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!cityDropdownRef.current?.contains(event.target as Node)) {
        setIsCityOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCityOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCityOpen]);

  useEffect(() => {
    if (!isCityOpen) {
      return;
    }

    const list = cityListRef.current;
    if (!list) {
      return;
    }

    const escapeValue =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape
        : (value: string) => value.replace(/"/g, '\\"');
    const selected = list.querySelector(
      `[data-value="${escapeValue(selectedCity)}"]`,
    ) as HTMLElement | null;

    if (selected) {
      requestAnimationFrame(() => {
        selected.scrollIntoView({ block: "nearest" });
      });
    }
  }, [isCityOpen, selectedCity]);

  const visibleIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const categoryOk =
        selectedCategory === ALL_FILTER ||
        normalizeKey(idea.category) === selectedCategory;
      const cityOk = selectedCity === ALL_FILTER || idea.city === selectedCity;
      return categoryOk && cityOk;
    });
  }, [ideas, selectedCategory, selectedCity]);

  const sortedIdeas = useMemo(() => {
    const data = [...visibleIdeas];
    const toTime = (value: string) => {
      const time = Date.parse(value);
      return Number.isNaN(time) ? 0 : time;
    };
    switch (sortBy) {
      case "newest":
        return data.sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));
      case "popular":
      default:
        return data.sort((a, b) => b.votes - a.votes);
    }
  }, [sortBy, visibleIdeas]);

  const maxVotes = useMemo(() => {
    return Math.max(...visibleIdeas.map((idea) => idea.votes), 0);
  }, [visibleIdeas]);

  const renderSidebarContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Фильтры
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Сбросить
          </button>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-border/60 bg-card/90 p-5 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.55)]">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Категории
        </p>
        <div className="mt-4 space-y-2">
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "border-foreground bg-foreground text-background shadow-lg shadow-foreground/25"
                    : "border-border/60 bg-background/70 text-foreground hover:border-foreground/40 hover:bg-foreground hover:text-background"
                }`}
              >
                <span className="truncate">{category.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[2rem] border border-border/60 bg-card/90 p-5 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.55)]">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Селектор города
        </p>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Город
        </label>
        <div className="relative mt-3" ref={cityDropdownRef}>
          <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isCityOpen}
            onClick={() => setIsCityOpen((prev) => !prev)}
            className="w-full rounded-2xl border border-border/60 bg-background px-10 py-3 text-left text-sm font-semibold text-foreground shadow-sm transition focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            {selectedCityLabel}
          </button>
          <ChevronDown
            className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform ${
              isCityOpen ? "rotate-180" : "rotate-0"
            }`}
          />
          <ul
            ref={cityListRef}
            role="listbox"
            aria-hidden={!isCityOpen}
            className={`absolute left-0 right-0 z-20 mt-2 h-60 max-h-60 origin-top overflow-auto rounded-2xl border border-border/60 bg-card/95 p-1 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.55)] backdrop-blur transition duration-150 ease-out ${
              isCityOpen
                ? "pointer-events-auto scale-100 opacity-100"
                : "pointer-events-none scale-95 opacity-0"
            }`}
          >
            {cityOptions.map((city) => {
              const isSelected = selectedCity === city.id;
              return (
                <li key={city.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-value={city.id}
                    onClick={() => handleCityChange(city.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                      isSelected ? "bg-foreground/10" : "hover:bg-foreground/10"
                    }`}
                  >
                    <span className="truncate">{city.label}</span>
                    {isSelected ? (
                      <Check
                        aria-hidden="true"
                        className="h-4 w-4 text-foreground"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 px-4 sm:pt-28 sm:pb-20 sm:px-6">
          <div className="container mx-auto flex justify-center">
            <div className="h-10 w-40 rounded-full bg-muted/80 animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16 px-4 sm:pt-28 sm:pb-20 sm:px-6">
          <div className="container mx-auto max-w-lg text-center">
            <p className="text-lg font-semibold">
              Для начала необходимо авторизовать
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Авторизуйтесь, чтобы участвовать в голосовании.
            </p>
            <Link href="/auth" className="mt-6 inline-flex">
              <GradientButton className="px-6 py-3 text-sm">
                Авторизация
              </GradientButton>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <TutorialProvider
      steps={votingTutorialSteps}
      storageKey="voting-tutorial-v1"
    >
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_12%,hsl(var(--foreground)/0.08),transparent_28%),radial-gradient(circle_at_86%_8%,hsl(var(--foreground)/0.06),transparent_24%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.28)_48%,hsl(var(--background)))]">
        <Header />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.18)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.14)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent" />
        </div>

        <main className="relative pt-24 pb-16 px-4 sm:pt-28 sm:pb-20 sm:px-6">
          <div className="relative">
            <div className="lg:pl-[320px]">
              <div className="container mx-auto max-w-6xl">
                <motion.div
                  className="relative overflow-hidden rounded-[2.5rem] border border-border/70 bg-background/76 p-6 shadow-[0_36px_110px_-78px_rgba(0,0,0,0.92)] backdrop-blur-xl sm:p-8"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  data-tutorial="voting-hero"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_circle_at_18%_0%,hsl(var(--foreground)/0.12),transparent_46%)]" />
                  <div className="relative flex flex-wrap items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      Открытое голосование
                    </span>
                  </div>

                  <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl space-y-3">
                      <h1 className="max-w-2xl text-5xl font-semibold leading-[0.9] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                        {t("voting")}
                      </h1>
                      <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                        Выбирай идеи для своего города и голосуй за лучшие.
                      </p>
                    </div>

                    <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:max-w-none sm:grid-cols-2">
                      <div className="rounded-[1.4rem] border border-border/60 bg-card/72 p-4 text-center shadow-[0_18px_48px_-34px_rgba(0,0,0,0.65)] backdrop-blur">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                          Идей
                        </p>
                        <p className="text-2xl font-semibold">{ideas.length}</p>
                      </div>
                      <div className="rounded-[1.4rem] border border-border/60 bg-card/72 p-4 text-center shadow-[0_18px_48px_-34px_rgba(0,0,0,0.65)] backdrop-blur">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                          Голосов
                        </p>
                        <p className="text-2xl font-semibold">{totalVotes}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-8 flex flex-wrap items-center gap-3 sm:mt-10">
                    <Link href={`/users/${user.uid}`} className="inline-flex">
                      <button
                        type="button"
                        className="rounded-full border border-border/70 bg-background/80 px-5 py-2 text-sm font-semibold text-foreground shadow-[0_12px_28px_-24px_rgba(0,0,0,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground hover:bg-foreground hover:text-background"
                      >
                        Мои проекты
                      </button>
                    </Link>
                    {canOpenModerationProjects ? (
                      <Link href="/admin/submissions" className="inline-flex">
                        <button
                          type="button"
                          className="rounded-full border border-foreground/30 bg-foreground/10 px-5 py-2 text-sm font-semibold text-foreground shadow-[0_12px_28px_-24px_rgba(0,0,0,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground hover:bg-foreground hover:text-background"
                        >
                          Проекты на модерации
                        </button>
                      </Link>
                    ) : null}
                  </div>
                </motion.div>

                <div className="mt-10 flex flex-col gap-8">

                  <motion.aside
                    className="hidden lg:flex lg:flex-col lg:gap-6 lg:fixed lg:left-6 lg:top-28 lg:h-[calc(100vh-7rem)] lg:w-[280px] lg:overflow-y-auto lg:rounded-[2rem] lg:border lg:border-border/70 lg:bg-background/78 lg:p-5 lg:shadow-[0_28px_90px_-62px_rgba(0,0,0,0.92)] lg:backdrop-blur-xl"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    data-tutorial="voting-filters"
                  >
                    {renderSidebarContent()}
                  </motion.aside>


                  <div className="lg:hidden">
                    <button
                      type="button"
                      onClick={() => setMobileFiltersOpen((v) => !v)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-sm font-semibold text-foreground backdrop-blur transition-[transform,border-color] duration-200 active:scale-[0.98] @media (hover: hover) hover:border-foreground/40"
                    >
                      <span className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                        Фильтры
                        {hasFilters && (
                          <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background">
                            {[selectedCategory !== ALL_FILTER, selectedCity !== ALL_FILTER].filter(Boolean).length}
                          </span>
                        )}
                      </span>
                      <motion.div
                        animate={{ rotate: mobileFiltersOpen ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {mobileFiltersOpen && (
                        <motion.div
                          key="mobile-filters"
                          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4">
                            {renderSidebarContent()}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <section className="space-y-6">
                    <div
                      className="rounded-[2rem] border border-border/60 bg-card/78 px-4 py-4 shadow-[0_26px_70px_-52px_rgba(0,0,0,0.82)] backdrop-blur-xl sm:px-5"
                      data-tutorial="voting-sort"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background sm:h-11 sm:w-11 sm:rounded-2xl">
                            <ListFilter className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                              Сортировка
                            </p>
                            <p className="hidden text-sm font-semibold sm:block">
                              Выбери режим показа идей
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 rounded-full border border-border/50 bg-background/70 p-1">
                          {sortOptions.map((option) => {
                            const isActive = sortBy === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setSortBy(option.id)}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-[transform,background-color,color,box-shadow] duration-200 active:scale-[0.96] sm:px-4 sm:py-2 ${
                                  isActive
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-muted/70 px-3 py-1 font-semibold text-muted-foreground">
                          {sortedIdeas.length} идей
                        </span>
                        {selectedCategory !== ALL_FILTER && (
                          <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 font-semibold text-muted-foreground">
                            {selectedCategoryLabel}
                          </span>
                        )}
                        {selectedCity !== ALL_FILTER && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-3 py-1 font-semibold text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {selectedCityLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {loadError ? (
                      <motion.div
                        className="rounded-[2rem] border border-destructive/50 bg-destructive/10 px-5 py-4 text-sm text-destructive shadow-[0_18px_40px_-32px_rgba(0,0,0,0.45)]"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span>Не удалось загрузить идеи: {loadError}</span>
                          <button
                            type="button"
                            onClick={handleReload}
                            className="rounded-full border border-destructive/60 px-4 py-2 text-xs font-semibold text-destructive transition-all duration-300 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            Повторить
                          </button>
                        </div>
                      </motion.div>
                    ) : null}
                    {!isEmailVerified ? (
                      <motion.div
                        className="rounded-[2rem] border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-700 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.45)]"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {t("emailVerificationRequiredTitle")}
                            </p>
                            <p className="text-xs text-amber-700/80">
                              {t("emailVerificationRequiredVotingBody")}
                            </p>
                          </div>
                          <Link href="/account" className="inline-flex">
                            <button
                              type="button"
                              className="rounded-full border border-amber-500/50 px-4 py-2 text-xs font-semibold text-amber-700 transition-all duration-300 hover:bg-amber-500/20"
                            >
                              {t("emailVerificationGoToAccount")}
                            </button>
                          </Link>
                        </div>
                      </motion.div>
                    ) : null}
                    {actionError ? (
                      <motion.div
                        className="rounded-[2rem] border border-destructive/50 bg-destructive/10 px-5 py-4 text-sm text-destructive shadow-[0_18px_40px_-32px_rgba(0,0,0,0.45)]"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {actionError}
                      </motion.div>
                    ) : null}

                    <motion.div
                      key={`${selectedCategory}-${selectedCity}-${sortBy}-${sortedIdeas.length}`}
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-6"
                      data-tutorial="voting-list"
                    >
                      <AnimatePresence mode="popLayout">
                        {isLoading ? (
                          <motion.div
                            key="loading"
                            variants={shouldReduceMotion ? {} : cardVariants}
                            className="space-y-4"
                          >
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="rounded-[2rem] border border-border/50 bg-card/60 p-5 sm:p-6"
                              >
                                <div className="flex gap-2">
                                  <div className="h-5 w-24 rounded-full bg-muted/80 animate-pulse" />
                                  <div className="h-5 w-16 rounded-full bg-muted/60 animate-pulse" />
                                </div>
                                <div className="mt-4 h-7 w-3/4 rounded-xl bg-muted/80 animate-pulse" />
                                <div className="mt-2 h-4 w-1/2 rounded-full bg-muted/60 animate-pulse" />
                                <div className="mt-4 space-y-2">
                                  <div className="h-3 w-full rounded-full bg-muted/60 animate-pulse" />
                                  <div className="h-3 w-5/6 rounded-full bg-muted/50 animate-pulse" />
                                </div>
                                <div className="mt-5 flex items-center gap-2.5 border-t border-border/40 pt-4">
                                  <div className="h-9 w-28 rounded-full bg-muted/70 animate-pulse" />
                                  <div className="h-9 w-24 rounded-full bg-muted/50 animate-pulse" />
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        ) : sortedIdeas.length ? (
                          sortedIdeas.map((idea) => {
                            const voteShare = maxVotes
                              ? Math.round((idea.votes / maxVotes) * 100)
                              : 0;
                            const neededVotes = Math.max(0, maxVotes - idea.votes);
                            return (
                              <motion.article
                                key={idea.id}
                                variants={shouldReduceMotion ? {} : cardVariants}
                                layout={!shouldReduceMotion}
                                className="group relative overflow-hidden rounded-[2.25rem] border border-border/60 bg-card/82 shadow-[0_28px_72px_-52px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(480px_circle_at_0%_0%,hsl(var(--foreground)/0.08),transparent_44%)] before:opacity-0 before:transition-opacity before:duration-300 @media_(hover:_hover)_hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_36px_90px_-56px_rgba(0,0,0,0.92)] hover:before:opacity-100"
                              >

                                <div className="relative p-5 sm:p-6">

                                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                                    <span className="rounded-full bg-foreground/10 px-3 py-1 text-foreground">
                                      {idea.category}
                                    </span>
                                    <span
                                      className={`rounded-full border px-3 py-1 ${
                                        idea.status === "approved"
                                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                          : idea.status === "declined"
                                            ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                            : idea.status === "pending"
                                              ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                              : "border-border/60 bg-background/70 text-muted-foreground"
                                      }`}
                                    >
                                      {statusLabels[idea.status]}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-muted-foreground">
                                      <MapPin className="h-3 w-3 shrink-0" />
                                      <span className="truncate max-w-[12rem]">{idea.city}</span>
                                    </span>
                                  </div>


                                  <div className="mt-4 flex flex-col gap-5 lg:flex-row">

                                    <div className="flex-1 space-y-3">
                                      <div>
                                        <h3 className="text-xl font-semibold leading-tight tracking-[-0.03em] sm:text-2xl">
                                          {idea.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                          {idea.address}
                                        </p>
                                      </div>
                                      <p className="text-sm leading-relaxed text-foreground/80 line-clamp-3">
                                        {idea.description}
                                      </p>


                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                          <span className="font-semibold">{idea.votes} голосов</span>
                                          {neededVotes > 0 && (
                                            <span>до лидера: {neededVotes}</span>
                                          )}
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                                          <div
                                            className="h-full rounded-full bg-gradient-to-r from-foreground via-foreground/80 to-foreground/40 shadow-[0_0_18px_hsl(var(--foreground)/0.15)] transition-[width] duration-700"
                                            style={{ width: `${voteShare}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>


                                    <div className="grid grid-cols-2 gap-2.5 lg:w-52 lg:grid-cols-1 xl:w-60">
                                      <div className="group/img relative h-28 overflow-hidden rounded-2xl border border-border/60 shadow-sm sm:h-32 lg:h-28">
                                        <div className="h-full w-full transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] @media_(hover:_hover)_group-hover/img:scale-[1.04]">
                                          <MapPreviewImage
                                            title={idea.title}
                                            coordinates={idea.coordinates}
                                          />
                                        </div>
                                        <span className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm">
                                          Карта
                                        </span>
                                        <div className="absolute bottom-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-foreground ring-2 ring-background shadow" />
                                      </div>
                                      <div className="group/img relative h-28 overflow-hidden rounded-2xl border border-border/60 shadow-sm sm:h-32 lg:h-28">
                                        <img
                                          src={idea.photoImage}
                                          alt={`Фото — ${idea.title}`}
                                          className="h-full w-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] @media_(hover:_hover)_group-hover/img:scale-[1.04]"
                                          onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = PHOTO_FALLBACK_IMAGE;
                                          }}
                                        />
                                        <span className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm">
                                          Фото
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>


                                <div className="flex flex-col gap-3 border-t border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                  <Link
                                    href={`/projects/${idea.id}`}
                                    className="inline-flex items-center justify-center rounded-full border border-border/70 bg-background/80 px-5 py-2.5 text-sm font-semibold text-foreground transition-[transform,border-color,background-color,color] duration-200 active:scale-[0.97] hover:border-foreground hover:bg-foreground hover:text-background"
                                  >
                                    К проекту
                                  </Link>
                                  <GradientButton
                                    className="px-5 py-2.5 text-sm active:scale-[0.97]"
                                    onClick={() => handleVote(idea.id)}
                                    disabled={!isEmailVerified || idea.isVoted}
                                  >
                                    {idea.isVoted
                                      ? "Голос учтен"
                                      : isEmailVerified
                                        ? t("voteAction")
                                        : t("emailVerificationRequiredTitle")}
                                  </GradientButton>
                                </div>
                              </motion.article>
                            );
                          })
                        ) : (
                          <motion.div
                            key="empty"
                            variants={shouldReduceMotion ? {} : cardVariants}
                            className="rounded-[2rem] border border-dashed border-border/60 bg-card/50 px-5 py-10 text-center text-sm text-muted-foreground"
                          >
                            <p className="font-semibold">Идей не найдено</p>
                            <p className="mt-1 text-xs">Попробуй изменить фильтры</p>
                            {hasFilters && (
                              <button
                                type="button"
                                onClick={resetFilters}
                                className="mt-4 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-xs font-semibold transition-[transform,border-color] duration-200 active:scale-[0.97] hover:border-foreground"
                              >
                                Сбросить фильтры
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </TutorialProvider>
  );
}
