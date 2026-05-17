"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Logo } from "@/components/logo";
import { TextMorph } from "@/components/forgeui/text-morph";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapLibreMap, type MapMarker } from "@/components/maplibre-map";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { useReverseGeocode } from "@/hooks/use-reverse-geocode";
import {
  fetchStatisticsGlobal,
  fetchTopProjects,
  type ApiProject,
} from "@/lib/api";
import {
  CITY_CHANGE_EVENT,
  CITY_STORAGE_KEY,
  cities,
  getStoredCity,
  resolveCity,
  resolveCityCenter,
  resolveCityId,
  type City,
} from "@/lib/cities";
import {
  build2GisLink,
  formatCoordinates,
  resolveCoordinates,
} from "@/lib/location";

const POPULAR_LIMIT = 3;
const MAP_LIMIT = 12;
const COORDINATE_JITTER_RANGE = 0.04;

const heroLead = {
  RU: "Предлагайте",
  EN: "Shape",
  KZ: "Ұсыныңыз",
} as const;

const heroWords = {
  RU: ["решения", "проекты", "изменения"],
  EN: ["solutions", "projects", "changes"],
  KZ: ["шешімдер", "жобалар", "өзгерістер"],
} as const;

const featureDescriptions = {
  RU: {
    vote:
      "\u0412\u044B\u0431\u0438\u0440\u0430\u0439\u0442\u0435 \u0438\u0434\u0435\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0432\u0430\u0436\u043D\u044B \u0434\u043B\u044F \u0433\u043E\u0440\u043E\u0434\u0430",
    map:
      "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0439\u0442\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u044B \u043F\u0440\u044F\u043C\u043E \u0432 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0435 \u0440\u0430\u0439\u043E\u043D\u0430",
    suggest:
      "\u0417\u0430\u043F\u0443\u0441\u043A\u0430\u0439\u0442\u0435 \u043D\u043E\u0432\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0434\u043B\u044F \u0433\u043E\u0440\u043E\u0434\u0441\u043A\u043E\u0439 \u0441\u0440\u0435\u0434\u044B",
  },
  EN: {
    vote: "Back the ideas that matter most for the city",
    map: "Explore initiatives directly in their neighborhood context",
    suggest: "Launch new improvements for the urban environment",
  },
  KZ: {
    vote:
      "\u049A\u0430\u043B\u0430 \u04AF\u0448\u0456\u043D \u0435\u04A3 \u043C\u0430\u04A3\u044B\u0437\u0434\u044B \u0438\u0434\u0435\u044F\u043B\u0430\u0440\u0434\u044B \u049B\u043E\u043B\u0434\u0430\u04A3\u044B\u0437",
    map:
      "\u0411\u0430\u0441\u0442\u0430\u043C\u0430\u043B\u0430\u0440\u0434\u044B \u0430\u0443\u0434\u0430\u043D \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0456\u043D\u0434\u0435 \u0442\u0456\u043A\u0435\u043B\u0435\u0439 \u043A\u04E9\u0440\u0456\u04A3\u0456\u0437",
    suggest:
      "\u049A\u0430\u043B\u0430\u043B\u044B\u049B \u043E\u0440\u0442\u0430 \u04AF\u0448\u0456\u043D \u0436\u0430\u04A3\u0430 \u04E9\u0437\u0433\u0435\u0440\u0456\u0441\u0442\u0435\u0440\u0434\u0456 \u04B1\u0441\u044B\u043D\u044B\u04A3\u044B\u0437",
  },
} as const;

const mapOverlayPrompt = {
  RU: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u043E\u0447\u043A\u0443 \u043D\u0430 \u043A\u0430\u0440\u0442\u0435",
  EN: "Select a point on the map",
  KZ: "\u041A\u0430\u0440\u0442\u0430\u0434\u0430\u043D \u043D\u04AF\u043A\u0442\u0435 \u0442\u0430\u04A3\u0434\u0430\u04A3\u044B\u0437",
} as const;

const glowStyle = {
  "--glow-x": "50%",
  "--glow-y": "50%",
} as CSSProperties;

const updateGlow = (event: MouseEvent<HTMLDivElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty(
    "--glow-x",
    `${event.clientX - rect.left}px`,
  );
  event.currentTarget.style.setProperty(
    "--glow-y",
    `${event.clientY - rect.top}px`,
  );
};

const resetGlow = (_event: MouseEvent<HTMLDivElement>) => {
  // Intentionally a no-op: keep the last cursor position so the glow fades
  // out from where it was rather than flashing back to centre.
};

const getProjectInfo = (project?: ApiProject | null) =>
  project?.details ?? project?.info ?? null;

const getProjectAddress = (project?: ApiProject | null) => {
  if (!project) return "/";
  const info = getProjectInfo(project);
  const location = info?.location ?? null;
  const addressParts = [location?.street?.trim(), location?.house?.trim()].filter(
    (part): part is string => Boolean(part),
  );
  if (addressParts.length) return addressParts.join(" ");
  return info?.title?.trim() || "/";
};

const hashSeed = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const applyCoordinateJitter = (center: [number, number], seed: string) => {
  const hash = hashSeed(seed);
  const offsetLng = ((hash % 1000) / 1000 - 0.5) * COORDINATE_JITTER_RANGE;
  const offsetLat =
    (((hash >> 10) % 1000) / 1000 - 0.5) * COORDINATE_JITTER_RANGE;
  return [center[0] + offsetLng, center[1] + offsetLat] as [number, number];
};

const surfaceClass =
  "relative overflow-hidden border border-border/85 bg-card/88 shadow-[0_40px_110px_-72px_rgba(0,0,0,0.92)] backdrop-blur-2xl";

const formatMetricNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value < 1000) return String(Math.trunc(value));
  const compact = Math.round((value / 1000) * 10) / 10;
  return `${compact % 1 === 0 ? compact.toFixed(0) : compact.toFixed(1)}k`;
};

export default function HomePage() {
  const [popularProjects, setPopularProjects] = useState<ApiProject[]>([]);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [votesCount, setVotesCount] = useState(0);
  const [implementedCount, setImplementedCount] = useState(0);
  const [topCity, setTopCity] = useState("");
  const [popularLoading, setPopularLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ApiProject | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<
    [number, number] | null
  >(null);
  const [selectedCity, setSelectedCity] = useState<City>(getStoredCity());
  const cacheRef = useRef(new Map<string, ApiProject>());
  const { language, t } = useLanguage();
  const { status } = useAuth();
  const { label: resolvedLocation, loading: resolvedLocationLoading } =
    useReverseGeocode(selectedCoordinates);

  const mapCenter = useMemo(
    () => resolveCityCenter(selectedCity),
    [selectedCity],
  );

  useEffect(() => {
    setSelectedCity(getStoredCity());
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadStatistics = async () => {
      try {
        const statistics = await fetchStatisticsGlobal({
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setVotesCount(statistics.votes);
          setImplementedCount(statistics.implemented);
          setTopCity(statistics.city ?? "");
        }
      } catch {
        if (!controller.signal.aborted) {
          setVotesCount(0);
          setImplementedCount(0);
          setTopCity("");
        }
      }
    };

    void loadStatistics();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCityChange = (event: Event) => {
      const payload = event as CustomEvent<{ city?: string }>;
      const nextCity = resolveCity(payload.detail?.city);
      if (nextCity) setSelectedCity(nextCity);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CITY_STORAGE_KEY) return;
      const nextCity = resolveCity(event.newValue);
      if (nextCity) setSelectedCity(nextCity);
    };

    window.addEventListener(
      CITY_CHANGE_EVENT,
      handleCityChange as EventListener,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        CITY_CHANGE_EVENT,
        handleCityChange as EventListener,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setPopularLoading(true);
    setMapLoading(true);
    setSelectedProject(null);
    setSelectedCoordinates(null);
    cacheRef.current.clear();

    const loadProjects = async () => {
      try {
        const projects = await fetchTopProjects({
          limit: MAP_LIMIT,
          city: resolveCityId(selectedCity),
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setPopularProjects(projects.slice(0, POPULAR_LIMIT));
        setSelectedProject(projects[0] ?? null);

        const markers = projects.flatMap((project) => {
          const info = getProjectInfo(project);
          const id = project.id?.toString();
          if (!id) return [];

          const coordinates =
            resolveCoordinates(info?.location ?? null) ??
            applyCoordinateJitter(resolveCityCenter(selectedCity), id);

          cacheRef.current.set(id, project);

          return [
            {
              id,
              coordinates,
              title: info?.title?.trim() || getProjectAddress(project),
              description: info?.description?.trim(),
            },
          ];
        });

        setMapMarkers(markers);
      } catch {
        if (!controller.signal.aborted) {
          setPopularProjects([]);
          setMapMarkers([]);
          setSelectedProject(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setPopularLoading(false);
          setMapLoading(false);
        }
      }
    };

    void loadProjects();
    return () => controller.abort();
  }, [selectedCity]);

  useEffect(() => {
    const info = getProjectInfo(selectedProject);
    setSelectedCoordinates(resolveCoordinates(info?.location ?? null));
  }, [selectedProject]);

  const selectedSummary = useMemo(() => {
    if (!selectedProject) return null;
    const info = getProjectInfo(selectedProject);
    return {
      title: info?.title?.trim() || getProjectAddress(selectedProject),
      description: info?.description?.trim() || t("mapProjectNoDescription"),
      address:
        resolvedLocation ||
        (selectedCoordinates ? formatCoordinates(selectedCoordinates) : "") ||
        getProjectAddress(selectedProject),
      href: selectedProject.id
        ? `/projects/${encodeURIComponent(String(selectedProject.id))}`
        : null,
    };
  }, [resolvedLocation, selectedCoordinates, selectedProject, t]);

  const startHref = status === "authenticated" ? "/suggest" : "/auth";
  const hasSelectedProject = Boolean(selectedSummary);

  const metricItems = [
    { label: t("ideas"), value: mapMarkers.length || MAP_LIMIT },
    { label: t("vote"), value: formatMetricNumber(votesCount) },
    { label: t("topCity"), value: topCity || selectedCity },
    { label: t("implemented"), value: formatMetricNumber(implementedCount) },
  ];

  const featureItems = [
    {
      icon: Users,
      title: t("vote"),
      description: featureDescriptions[language].vote,
    },
    {
      icon: MapPin,
      title: t("markOnMap"),
      description: featureDescriptions[language].map,
    },
    {
      icon: CheckCircle2,
      title: t("suggestIdea"),
      description: featureDescriptions[language].suggest,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="overflow-hidden pb-20">
        <section className="relative px-4 pb-18 pt-32 sm:px-6 sm:pb-20 sm:pt-36">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[8%] top-20 h-52 w-52 rounded-full bg-foreground/5 blur-3xl" />
            <div className="absolute right-[8%] top-24 h-64 w-64 rounded-full bg-foreground/7 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/18 to-transparent" />
          </div>

          <div className="container relative mx-auto">
            <div className="grid items-start gap-8 xl:grid-cols-[0.88fr_1.12fr]">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >

                <h1 className="mt-6 text-5xl leading-[0.94] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                  <span className="block font-semibold">{heroLead[language]}</span>
                  <span className="mt-2 block font-semibold">
                    <TextMorph
                      words={heroWords[language]}
                      className="inline-flex text-foreground"
                      charClassName="tracking-[-0.06em]"
                    />
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {t("heroSubtitle")}. {t("describeIssue")}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    asChild
                    className="rounded-full px-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.55)]"
                  >
                    <Link href={startHref}>
                      {t("suggestIdea")}
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full px-6">
                    <Link href="/voting">{t("voteAction")}</Link>
                  </Button>
                </div>

                <motion.div
                  style={glowStyle}
                  onMouseMove={updateGlow}
                  onMouseLeave={resetGlow}
                  whileHover={{ y: -4 }}
                  className={`${surfaceClass} group mt-8 rounded-[2rem] before:pointer-events-none before:absolute before:inset-0 before:rounded-[2rem] before:bg-[radial-gradient(340px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.16),transparent_44%)] before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100 dark:before:bg-[radial-gradient(340px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.08),transparent_44%)]`}
                >
                  <div className="relative grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                    {metricItems.map((item, index) => (
                      <div
                        key={item.label}
                        className="relative min-w-0 sm:pl-5"
                      >
                        {index > 0 ? (
                          <div
                            className={`absolute left-0 top-1 hidden h-[calc(100%-8px)] w-px bg-border/80 sm:block ${
                              index % 2 === 0 ? "sm:hidden lg:block" : ""
                            }`}
                          />
                        ) : null}
                        <p className="text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-2 truncate text-3xl font-semibold tracking-[-0.05em]">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="relative"
              >
                <MapLibreMap
                  className="grayscale contrast-[1.05] brightness-[0.96] saturate-0"
                  center={mapCenter}
                  zoom={12}
                  markers={mapMarkers}
                  onMarkerClick={(marker) => {
                    setSelectedProject(cacheRef.current.get(marker.id) ?? null);
                  }}
                />

                <div className="pointer-events-none absolute inset-x-4 bottom-4 z-30 sm:left-5 sm:right-auto sm:bottom-5">
                  <motion.div
                    key={selectedSummary?.href ?? selectedSummary?.title ?? "map-overlay"}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    style={glowStyle}
                    onMouseMove={updateGlow}
                    onMouseLeave={resetGlow}
                    className={`${surfaceClass} group pointer-events-auto w-full max-w-[18rem] rounded-[1.35rem] bg-background/78 before:pointer-events-none before:absolute before:inset-0 before:rounded-[1.35rem] before:bg-[radial-gradient(220px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.14),transparent_44%)] before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100 sm:w-[17.5rem] dark:bg-background/68 dark:before:bg-[radial-gradient(220px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.08),transparent_44%)]`}
                  >
                    <div className="relative space-y-2.5 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                          {t("mapProjectDetailsTitle")}
                        </p>
                        <Badge variant="outline" className="rounded-full border-border/70 bg-background/70 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                          <TrendingUp className="opacity-70" />
                          {mapLoading ? t("mapProjectsLoading") : `${mapMarkers.length || MAP_LIMIT}`}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <h2 className="line-clamp-2 text-base font-semibold leading-5 tracking-[-0.04em] sm:text-[1.05rem]">
                          {selectedSummary?.title || mapOverlayPrompt[language]}
                        </h2>
                        {selectedSummary?.description ? (
                          <p className="line-clamp-1 text-xs leading-4 text-muted-foreground">
                            {selectedSummary.description}
                          </p>
                        ) : null}
                      </div>

                      {hasSelectedProject ? (
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                            {resolvedLocationLoading
                              ? t("locationResolving")
                              : t("projectCityLabel")}
                          </p>
                          <p className="line-clamp-1 text-xs font-semibold leading-4">
                            {selectedSummary?.address}
                          </p>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-1.5">
                        {selectedSummary?.href ? (
                          <Button asChild className="h-8 rounded-full px-3 text-xs">
                            <Link href={selectedSummary.href}>Open project</Link>
                          </Button>
                        ) : null}
                        {selectedCoordinates ? (
                          <Button asChild variant="outline" className="h-8 rounded-full px-3 text-xs">
                            <a
                              href={build2GisLink(selectedCoordinates)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {t("openIn2Gis")}
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-4 sm:px-6">
          <div className="container mx-auto grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <motion.div
              style={glowStyle}
              onMouseMove={updateGlow}
              onMouseLeave={resetGlow}
              whileHover={{ y: -4 }}
              className={`${surfaceClass} group rounded-[2.2rem] before:pointer-events-none before:absolute before:inset-0 before:rounded-[2.2rem] before:bg-[radial-gradient(420px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.14),transparent_44%)] before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100 dark:before:bg-[radial-gradient(420px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.08),transparent_44%)]`}
            >
              <div className="relative p-6 sm:p-7">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                      {selectedCity}
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                      {t("mostPopularIdeas")}
                    </h3>
                  </div>
                  <span className="text-sm text-muted-foreground">Top {POPULAR_LIMIT}</span>
                </div>

                <div className="mt-8 space-y-3">
                  {popularLoading ? (
                    <p className="text-sm text-muted-foreground">{t("mapProjectsLoading")}</p>
                  ) : popularProjects.length ? (
                    popularProjects.map((project, index) => (
                      <Link
                        key={project.id ?? index}
                        href={
                          project.id
                            ? `/projects/${encodeURIComponent(String(project.id))}`
                            : "/voting"
                        }
                        className="group/item flex items-start gap-4 rounded-[1.6rem] border border-border/70 bg-background/60 px-4 py-4 transition hover:bg-muted/80"
                      >
                    <span className="min-w-9 text-2xl font-semibold tracking-[-0.05em] text-muted-foreground">
                      0{index + 1}
                    </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-semibold">
                            {getProjectAddress(project)}
                          </span>
                          <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                            {getProjectInfo(project)?.description?.trim() ||
                              t("mapProjectNoDescription")}
                          </span>
                        </span>
                        <ArrowRight className="mt-1 shrink-0 transition-transform group-hover/item:translate-x-1" />
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("mapProjectsEmpty")}</p>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="grid gap-4">
              {featureItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  style={glowStyle}
                  onMouseMove={updateGlow}
                  onMouseLeave={resetGlow}
                  whileHover={{ x: 8 }}
                  className={`${surfaceClass} group rounded-[2rem] before:pointer-events-none before:absolute before:inset-0 before:rounded-[2rem] before:bg-[radial-gradient(340px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.16),transparent_44%)] before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100 dark:before:bg-[radial-gradient(340px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.08),transparent_44%)]`}
                >
                  <div className="relative grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-[0_20px_30px_-20px_rgba(0,0,0,0.55)]">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold tracking-[-0.03em]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <span className="hidden text-xs uppercase tracking-[0.24em] text-muted-foreground sm:block">
                      0{index + 1}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pt-14 sm:px-6 sm:pt-18">
          <div className="container mx-auto">
            <motion.div
              style={glowStyle}
              onMouseMove={updateGlow}
              onMouseLeave={resetGlow}
              whileHover={{ y: -4 }}
              className={`${surfaceClass} group rounded-[2.6rem] before:pointer-events-none before:absolute before:inset-0 before:rounded-[2.6rem] before:bg-[radial-gradient(460px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.16),transparent_42%)] before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100 dark:before:bg-[radial-gradient(460px_circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.08),transparent_44%)]`}
            >
              <div className="relative grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="min-w-0">
                  <Logo className="h-10 w-10" />
                  <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {t("heroSubtitle")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 lg:justify-end">
                  <Button asChild className="rounded-full px-6">
                    <Link href={startHref}>
                      {t("start")}
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full px-6">
                    <Link href="/support">Support</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
